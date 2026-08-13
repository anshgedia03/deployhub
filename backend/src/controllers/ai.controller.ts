import { Request, Response, NextFunction } from 'express';
import { processAIQuery } from '../services/ai.service';
import { User, AppError } from '@deployhub/shared';

export const handleAIChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new AppError('Prompt is required', 400);
    }

    const userId = req.user!.id;
    const currentUser = await User.findById(userId);

    let organizationId = userId;
    if (currentUser) {
      if (currentUser.accountType === 'employee' && currentUser.organizationId) {
        organizationId = currentUser.organizationId.toString();
      } else if (currentUser.accountType === 'organization') {
        organizationId = currentUser._id.toString();
      }
    }

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    await processAIQuery(prompt.trim(), userId, organizationId, res);
    res.end();
  } catch (error) {
    next(error);
  }
};
