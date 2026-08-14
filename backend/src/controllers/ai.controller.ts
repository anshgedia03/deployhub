import { Request, Response, NextFunction } from 'express';
import { processAIQuery } from '../services/ai.service';
import { User, AppError } from '@deployhub/shared';
import {
  createChatSession,
  listChatSessions,
  getChatMessages,
  deleteChatSession,
} from '../services/neon.service';

export const handleAIChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prompt, sessionId } = req.body;

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

    await processAIQuery(prompt.trim(), userId, organizationId, res, sessionId);
    res.end();
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const currentUser = await User.findById(userId);

    let organizationId = userId;
    if (currentUser && currentUser.accountType === 'employee' && currentUser.organizationId) {
      organizationId = currentUser.organizationId.toString();
    }

    const sessions = await listChatSessions(userId, organizationId);
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new AppError('Chat session title is required', 400);
    }

    const userId = req.user!.id;
    const currentUser = await User.findById(userId);

    let organizationId = userId;
    if (currentUser && currentUser.accountType === 'employee' && currentUser.organizationId) {
      organizationId = currentUser.organizationId.toString();
    }

    const session = await createChatSession(userId, organizationId, title.trim());
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

export const getSessionMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const messages = await getChatMessages(sessionId);
    res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionId = req.params.id as string;
    const userId = req.user!.id;
    const currentUser = await User.findById(userId);

    let organizationId = userId;
    if (currentUser && currentUser.accountType === 'employee' && currentUser.organizationId) {
      organizationId = currentUser.organizationId.toString();
    }

    await deleteChatSession(sessionId, organizationId);
    res.status(200).json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
};
