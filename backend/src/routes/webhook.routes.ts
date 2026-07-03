import { Router, Request, Response, NextFunction } from 'express';
import { Deployment, Logger } from '@deployhub/shared';
import { GitDeployService } from '../services/git.service';

const router = Router();

router.post('/github', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
      res.status(200).send('Event ignored');
      return;
    }

    const { ref, repository } = req.body;
    if (!ref || !repository || !repository.html_url) {
      res.status(400).send('Invalid payload');
      return;
    }

    const branch = ref.replace('refs/heads/', '');
    const htmlUrl = repository.html_url.toLowerCase();

    Logger.info('Webhooks', `Received push event for ${htmlUrl} on branch ${branch}`);

    const gitUrlWithGit = `${htmlUrl}.git`;
    
    const matchingDeployments = await Deployment.find({
      branch,
      $or: [
        { gitUrl: { $regex: new RegExp(`^${htmlUrl}$`, 'i') } },
        { gitUrl: { $regex: new RegExp(`^${gitUrlWithGit}$`, 'i') } },
      ],
      status: { $ne: 'DELETED' }
    });

    if (matchingDeployments.length === 0) {
      Logger.info('Webhooks', `No active deployments found for ${htmlUrl} on branch ${branch}`);
      res.status(200).send('No active deployments match this repository and branch.');
      return;
    }

    Logger.info('Webhooks', `Found ${matchingDeployments.length} matching deployments. Triggering redeploys...`);

    for (const deployment of matchingDeployments) {
      // Run the redeploy process asynchronously
      GitDeployService.processGitDeploy(
        deployment.deploymentId, 
        deployment.gitUrl || htmlUrl, 
        deployment.branch || branch
      ).catch(err => {
        Logger.error('Webhooks', `Async redeploy failed for ${deployment.deploymentId}`, err);
      });
    }

    res.status(200).json({
      message: 'Redeploy triggered for matching projects',
      count: matchingDeployments.length
    });
  } catch (error) {
    Logger.error('Webhooks', 'Webhook processing failed', error);
    next(error);
  }
});

export default router;
