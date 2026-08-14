import { Router } from 'express';
import {
  handleAIChat,
  getSessions,
  createSession,
  getSessionMessages,
  deleteSession,
} from '../controllers/ai.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Protect all AI routes
router.use(requireAuth);

router.post('/chat', handleAIChat);
router.get('/sessions', getSessions);
router.post('/sessions', createSession);
router.get('/sessions/:id/messages', getSessionMessages);
router.delete('/sessions/:id', deleteSession);

export default router;
