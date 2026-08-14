"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGitDeploy = exports.handleDeployUpload = void 0;
const deploy_service_1 = require("../services/deploy.service");
const git_service_1 = require("../services/git.service");
const shared_1 = require("@deployhub/shared");
const handleDeployUpload = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new shared_1.AppError('No file uploaded', 400);
        }
        // deploymentId was created in initDeployment middleware
        const deploymentId = req.deploymentId;
        // Pass execution to service asynchronously without blocking the response
        deploy_service_1.DeployService.processUpload(deploymentId, req.file.path).catch(err => {
            console.error('Async upload processing error:', err);
        });
        res.status(200).json({
            message: 'Upload successful. Extraction and deployment queued.',
            deploymentId,
            file: {
                originalname: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.handleDeployUpload = handleDeployUpload;
const handleGitDeploy = async (req, res, next) => {
    try {
        const { gitUrl, branch = 'main' } = req.body;
        if (!gitUrl) {
            throw new shared_1.AppError('Git URL is required', 400);
        }
        const deploymentId = req.deploymentId;
        // Pass execution to service asynchronously without blocking the response
        git_service_1.GitDeployService.processGitDeploy(deploymentId, gitUrl, branch).catch(err => {
            console.error('Async git deploy processing error:', err);
        });
        res.status(200).json({
            message: 'Git cloning and deployment queued.',
            deploymentId
        });
    }
    catch (error) {
        next(error);
    }
};
exports.handleGitDeploy = handleGitDeploy;
//# sourceMappingURL=deploy.controller.js.map