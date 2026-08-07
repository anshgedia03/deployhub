import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env, Logger } from '@deployhub/shared';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        accountType: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1] as string;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    const secret: string = (env.JWT_SECRET as unknown as string) || 'secret';
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    next();
  } catch (err) {
    Logger.error('Auth', 'Token verification failed:', err);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};

import { User, Deployment } from '@deployhub/shared';

export const requireFullAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.accountType === 'employee') {
      const deploymentId = req.params.id; 
      
      // If there's no ID in the URL params, this is a create request (POST /deploy or POST /deploy/github). Block it.
      if (!deploymentId) {
        res.status(403).json({ error: 'Forbidden: Employees cannot create new projects. Only organizations can.' });
        return;
      }

      const project = await Deployment.findOne({ 
        $or: [{ deploymentId }, { projectName: deploymentId }]
      });
      
      if (project && project.accessControl) {
        const employeeAccess = project.accessControl.find(ac => ac.employeeId.toString() === req.user!.id);
        if (!employeeAccess || employeeAccess.accessLevel === 'limited') {
          res.status(403).json({ error: 'Forbidden: Limited access employees cannot perform this action on this project' });
          return;
        }
      } else if (project) {
        // If project exists but no access control array (or employee not in it), block by default for employees
        res.status(403).json({ error: 'Forbidden: You do not have access to this project' });
        return;
      } else {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
