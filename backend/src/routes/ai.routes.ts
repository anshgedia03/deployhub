import { Router } from 'express';
import { handleAIChat } from '../controllers/ai.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Protect all AI routes
router.use(requireAuth);

router.post('/chat', handleAIChat);

export default router;
