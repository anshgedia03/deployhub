import express from 'express';
import cors from 'cors';
import deployRoutes from './routes/deploy.routes';
import projectsRoutes from './routes/projects.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/deploy', deployRoutes);
app.use('/projects', projectsRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware must be at the very end
app.use(errorHandler);

export default app;
