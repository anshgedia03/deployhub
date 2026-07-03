import { Request, Response, NextFunction } from 'express';
import { DeployService } from '../services/deploy.service';
import { GitDeployService } from '../services/git.service';
import { AppError } from '@deployhub/shared';

export const handleDeployUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }
    
    // deploymentId was created in initDeployment middleware
    const deploymentId = req.deploymentId!;
    
    // Pass execution to service asynchronously without blocking the response
    DeployService.processUpload(deploymentId, req.file.path).catch(err => {
      console.error('Async upload processing error:', err);
    });
    
    res.status(200).json({
      message: 'Upload successful. Extraction and deployment queued.',
      deploymentId,
      file: {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
      }
    });
    
  } catch (error) {
    next(error);
  }
};

export const handleGitDeploy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gitUrl, branch = 'main' } = req.body;
    if (!gitUrl) {
      throw new AppError('Git URL is required', 400);
    }
    
    const deploymentId = req.deploymentId!;
    
    // Pass execution to service asynchronously without blocking the response
    GitDeployService.processGitDeploy(deploymentId, gitUrl, branch).catch(err => {
      console.error('Async git deploy processing error:', err);
    });
    
    res.status(200).json({
      message: 'Git cloning and deployment queued.',
      deploymentId
    });
  } catch (error) {
    next(error);
  }
};

