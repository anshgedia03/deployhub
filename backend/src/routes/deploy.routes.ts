import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { handleDeployUpload } from '../controllers/deploy.controller';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { Deployment, AppError } from '@deployhub/shared';
import { notifyStatus } from '../utils/notify';
import Docker from 'dockerode';
import fs from 'fs';

const router = Router();
const docker = new Docker();

// Extend Request to pass deploymentId
declare module 'express-serve-static-core' {
  interface Request {
    deploymentId?: string;
  }
}

const initDeployment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectName = req.body.projectName;
    if (!projectName) {
      throw new AppError('Project name is required', 400);
    }
    const nameRegex = /^[a-z0-9_-]+$/;
    if (!nameRegex.test(projectName)) {
      throw new AppError('Only lowercase alphanumeric characters, dashes (-), and underscores (_) are allowed.', 400);
    }

    // Check if project already exists in MongoDB
    const existingDb = await Deployment.findOne({ projectName });
    if (existingDb) {
      throw new AppError(`Project "${projectName}" already exists. Please choose a different name.`, 400);
    }

    // Check if Docker container already exists
    const containerName = `deployx-${projectName}`;
    const containers = await docker.listContainers({ all: true });
    if (containers.some(c => c.Names.includes(`/${containerName}`))) {
      throw new AppError(`Docker container "${containerName}" already exists on the system. Please choose a different name.`, 400);
    }

    // Check if Docker image already exists
    const images = await docker.listImages();
    if (images.some(img => img.RepoTags?.includes(`${projectName}:latest`))) {
      throw new AppError(`Docker image "${projectName}:latest" already exists on the system. Please choose a different name.`, 400);
    }

    const deploymentId = uuidv4();
    req.deploymentId = deploymentId;
    await Deployment.create({ deploymentId, projectName, status: 'UPLOADING' });
    notifyStatus(deploymentId, 'UPLOADING');
    next();
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

router.post('/', uploadMiddleware.single('file'), initDeployment, handleDeployUpload);

export default router;
