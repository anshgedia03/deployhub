import { Router } from 'express';
import { getProjects, startDeployment, stopDeployment, deleteDeployment, getDeploymentLogs } from '../controllers/projects.controller';

const router = Router();

router.get('/', getProjects);
router.get('/:id/logs', getDeploymentLogs);
router.post('/:id/start', startDeployment);
router.post('/:id/stop', stopDeployment);
router.delete('/:id', deleteDeployment);

export default router;
