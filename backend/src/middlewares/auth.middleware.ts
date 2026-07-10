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
