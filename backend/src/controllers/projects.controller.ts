import { Request, Response, NextFunction } from 'express';
import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { Deployment, NotFoundError, removeNginxConfig, User, decrypt, encrypt } from '@deployhub/shared';
import { GitDeployService } from '../services/git.service';
import { notifyStatus } from '../utils/notify';

const docker = new Docker();

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    
    const currentUser = await User.findById(req.user!.id);
    let query: any = {};
    if (currentUser) {
      if (currentUser.accountType === 'employee') {
        query = { 'accessControl.employeeId': currentUser._id };
      } else if (currentUser.accountType === 'organization') {
        query = { $or: [{ userId: req.user!.id }, { organizationId: currentUser._id.toString() }] };
      } else {
        query = { userId: req.user!.id };
      }
    } else {
      query = { userId: req.user!.id };
    }

    if (search && typeof search === 'string') {
      query.projectName = { $regex: search, $options: 'i' };
    }

    const projects = await Deployment.find(query).sort({ createdAt: -1 });
    
    const projectsWithUptime = await Promise.all(
      projects.map(async (project) => {
        let startedAt = '';
        if (project.containerId && project.status === 'RUNNING') {
          try {
            const container = docker.getContainer(project.containerId);
            const data = await container.inspect();
            if (data.State && data.State.Running && data.State.StartedAt) {
              startedAt = data.State.StartedAt;
            }
          } catch (e) {
            // Container might have been deleted/recreated or offline
          }
        }
        
        // Convert to plain object and attach startedAt
        const obj = project.toObject();
        return { ...obj, startedAt };
      })
    );

    res.status(200).json(projectsWithUptime);
  } catch (error) {
    next(error);
  }
};

const getAuthorizedProject = async (deploymentId: string, reqUserId: string) => {
  const project = await Deployment.findOne({ deploymentId });
  if (!project) return null;
  
  const currentUser = await User.findById(reqUserId);
  if (!currentUser) return null;

  if (currentUser.accountType !== 'employee') {
    if (project.userId === reqUserId) return project;
  }

  const orgId = currentUser.accountType === 'organization' ? currentUser._id.toString() : currentUser.organizationId?.toString();
  if (orgId && project.organizationId === orgId) {
    if (currentUser.accountType === 'employee') {
      const hasAccess = project.accessControl?.some((ac: any) => ac.employeeId.toString() === currentUser._id.toString());
      if (!hasAccess) return null;
    }
    return project;
  }
  
  return null;
};

export const getDeploymentLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { cursor = 0, limit = 50000 } = req.query;

    const project = await getAuthorizedProject(id, req.user!.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

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
    const project = await getAuthorizedProject(id, req.user!.id);
    if (!project || !project.containerId) {
      throw new NotFoundError('Project or container not found');
    }

    const container = docker.getContainer(project.containerId);
    await container.start();
    
    project.status = 'RUNNING';
    await project.save();
    notifyStatus(id, 'RUNNING', { startedAt: new Date().toISOString() });

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};

export const stopDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await getAuthorizedProject(id, req.user!.id);
    if (!project || !project.containerId) {
      throw new NotFoundError('Project or container not found');
    }

    const container = docker.getContainer(project.containerId);
    await container.stop();
    
    project.status = 'STOPPED';
    await project.save();
    notifyStatus(id, 'STOPPED', { startedAt: null });

    res.status(200).json(project);
  } catch (error: any) {
    // Ignore error if container is already stopped
    if (error && error.statusCode === 304) {
      const id = req.params.id as string;
      const project = await getAuthorizedProject(id, req.user!.id);
      if (project) {
        project.status = 'STOPPED';
        await project.save();
        notifyStatus(project.deploymentId, 'STOPPED', { startedAt: null });
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
    const project = await getAuthorizedProject(id, req.user!.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (project.containerId) {
      const container = docker.getContainer(project.containerId);
      try { await container.stop(); } catch (e: any) {}
      try { await container.remove({ force: true }); } catch (e: any) {}
    }
    
    // Fallback: Also try to remove by name in case containerId was lost
    try {
      const containerName = `deployx-${project.projectName || project.deploymentId}`;
      const existingContainer = docker.getContainer(containerName);
      await existingContainer.stop().catch(() => {});
      await existingContainer.remove({ force: true }).catch(() => {});
    } catch (e) {
      // Ignore
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

export const getDeploymentEnvVars = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const project = await getAuthorizedProject(id, req.user!.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    let envVars: { key: string; value: string }[] = [];
    if (project.envVars) {
      try {
        const decryptedEnv = decrypt(project.envVars);
        const lines = decryptedEnv.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const firstEq = trimmed.indexOf('=');
            if (firstEq !== -1) {
              envVars.push({
                key: trimmed.substring(0, firstEq),
                value: trimmed.substring(firstEq + 1)
              });
            } else {
              envVars.push({ key: trimmed, value: '' });
            }
          }
        }
      } catch (err) {
        console.error('Failed to decrypt envVars', err);
      }
    }

    res.status(200).json({ envVars });
  } catch (error) {
    next(error);
  }
};

export const redeployProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { envVars } = req.body; // Expecting string (the raw .env file format)

    const project = await getAuthorizedProject(id, req.user!.id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (!project.gitUrl) {
      res.status(400).json({ error: 'Only Git-based projects can be redeployed using this endpoint.' });
      return;
    }

    // Stop and remove existing container if running
    if (project.containerId) {
      const container = docker.getContainer(project.containerId);
      try { await container.stop(); } catch (e) {}
      try { await container.remove({ force: true }); } catch (e) {}
    }

    // Update environment variables if provided
    if (envVars !== undefined) {
      project.envVars = envVars ? encrypt(envVars) : undefined;
      await project.save();
    }

    // Pass execution to service asynchronously
    GitDeployService.processGitDeploy(project.deploymentId, project.gitUrl, project.branch || 'main').catch(err => {
      console.error('Async git redeploy processing error:', err);
    });

    res.status(200).json({ message: 'Redeployment queued successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateProjectAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.accountType !== 'organization') {
      res.status(403).json({ error: 'Forbidden: Only organizations can modify project access' });
      return;
    }

    const { id } = req.params;
    const { employeeId, accessLevel } = req.body;

    if (!['full', 'limited', 'none'].includes(accessLevel)) {
      res.status(400).json({ error: 'Invalid access level. Must be "full", "limited", or "none".' });
      return;
    }

    const project = await Deployment.findOne({ deploymentId: id, organizationId: req.user.id });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Initialize array if not present
    if (!project.accessControl) {
      project.accessControl = [];
    }

    // Remove existing entry for this employee
    project.accessControl = project.accessControl.filter(ac => ac.employeeId.toString() !== employeeId);

    // Add new entry if not 'none'
    if (accessLevel !== 'none') {
      project.accessControl.push({ employeeId: employeeId as any, accessLevel });
    }

    await project.save();

    res.status(200).json({ message: 'Project access updated successfully', accessControl: project.accessControl });
  } catch (error) {
    next(error);
  }
};

