import { Request, Response, NextFunction } from 'express';
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { Deployment, NotFoundError, removeNginxConfig } from '@deployhub/shared';
import { notifyStatus } from '../utils/notify';

const docker = new Docker();

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Deployment.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

export const getDeploymentLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { cursor = 0, limit = 50000 } = req.query;

    const extractPath = path.resolve(process.cwd(), `deployments/${id}`);
    const logFilePath = path.join(extractPath, 'build.log');

    if (!fs.existsSync(logFilePath)) {
      res.status(200).json({ logs: '', nextCursor: null });
      return;
    }

    const startByte = parseInt(cursor as string, 10);
    const length = parseInt(limit as string, 10);

    const fd = await fs.promises.open(logFilePath, 'r');
    const stats = await fd.stat();

    if (startByte >= stats.size) {
      await fd.close();
      res.status(200).json({ logs: '', nextCursor: stats.size });
      return;
    }

    const bytesToRead = Math.min(length, stats.size - startByte);
    const buffer = Buffer.alloc(bytesToRead);
    
    await fd.read(buffer, 0, bytesToRead, startByte);
    await fd.close();

    res.status(200).json({ 
      logs: buffer.toString('utf-8'),
      nextCursor: startByte + bytesToRead
    });
  } catch (error) {
    next(error);
  }
};

export const startDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await Deployment.findOne({ deploymentId: id });
    if (!project || !project.containerId) {
      throw new NotFoundError('Project or container not found');
    }

    const container = docker.getContainer(project.containerId);
    await container.start();
    
    project.status = 'RUNNING';
    await project.save();
    notifyStatus(id, 'RUNNING');

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const stopDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await Deployment.findOne({ deploymentId: id });
    if (!project || !project.containerId) {
      throw new NotFoundError('Project or container not found');
    }

    const container = docker.getContainer(project.containerId);
    await container.stop();
    
    project.status = 'STOPPED';
    await project.save();
    notifyStatus(id, 'STOPPED');

    res.status(200).json(project);
  } catch (error: any) {
    // Ignore error if container is already stopped
    if (error && error.statusCode === 304) {
      const id = req.params.id as string;
      const project = await Deployment.findOneAndUpdate({ deploymentId: id }, { status: 'STOPPED' }, { new: true });
      if (project) {
        notifyStatus(project.deploymentId, 'STOPPED');
        res.status(200).json(project);
        return;
      }
    }
    next(error);
  }
};

export const deleteDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await Deployment.findOne({ deploymentId: id });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.containerId) {
      const container = docker.getContainer(project.containerId);
      try {
        await container.stop();
      } catch (e: any) {
        // Ignore if already stopped
      }
      try {
        await container.remove({ force: true });
      } catch (e: any) {
        // Ignore if already removed
      }
    }
    
    // Remove Nginx config and reload
    await removeNginxConfig(project.projectName || id);
    
    // Delete files from deployments/ directory
    const extractPath = path.resolve(process.cwd(), `deployments/${id}`);
    if (fs.existsSync(extractPath)) {
      try {
        fs.rmSync(extractPath, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to delete deployment directory: ${extractPath}`, e);
      }
    }
    
    await Deployment.deleteOne({ deploymentId: id });
    notifyStatus(id, 'DELETED');

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
