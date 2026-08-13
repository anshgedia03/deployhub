"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("@deployhub/shared");
const git_service_1 = require("../services/git.service");
const router = (0, express_1.Router)();
router.post('/github', async (req, res, next) => {
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
        shared_1.Logger.info('Webhooks', `Received push event for ${htmlUrl} on branch ${branch}`);
        const gitUrlWithGit = `${htmlUrl}.git`;
        const matchingDeployments = await shared_1.Deployment.find({
            branch,
            $or: [
                { gitUrl: { $regex: new RegExp(`^${htmlUrl}$`, 'i') } },
                { gitUrl: { $regex: new RegExp(`^${gitUrlWithGit}$`, 'i') } },
            ],
            status: { $ne: 'DELETED' }
        });
        if (matchingDeployments.length === 0) {
            shared_1.Logger.info('Webhooks', `No active deployments found for ${htmlUrl} on branch ${branch}`);
            res.status(200).send('No active deployments match this repository and branch.');
            return;
        }
        shared_1.Logger.info('Webhooks', `Found ${matchingDeployments.length} matching deployments. Triggering redeploys...`);
        for (const deployment of matchingDeployments) {
            // Run the redeploy process asynchronously
            git_service_1.GitDeployService.processGitDeploy(deployment.deploymentId, deployment.gitUrl || htmlUrl, deployment.branch || branch).catch(err => {
                shared_1.Logger.error('Webhooks', `Async redeploy failed for ${deployment.deploymentId}`, err);
            });
        }
        res.status(200).json({
            message: 'Redeploy triggered for matching projects',
            count: matchingDeployments.length
        });
    }
    catch (error) {
        shared_1.Logger.error('Webhooks', 'Webhook processing failed', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map