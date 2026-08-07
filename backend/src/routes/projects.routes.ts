import { Router } from 'express';
import { getProjects, startDeployment, stopDeployment, deleteDeployment, getDeploymentLogs, getDeploymentEnvVars, redeployProject } from '../controllers/projects.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Protect all projects routes
router.use(requireAuth);

router.get('/', getProjects);
router.get('/:id/logs', getDeploymentLogs);
router.get('/:id/env', getDeploymentEnvVars);
router.post('/:id/redeploy', redeployProject);
router.post('/:id/start', startDeployment);
router.post('/:id/stop', stopDeployment);
router.delete('/:id', deleteDeployment);

export default router;
