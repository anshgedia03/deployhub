"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const deploy_controller_1 = require("../controllers/deploy.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const shared_1 = require("@deployhub/shared");
const notify_1 = require("../utils/notify");
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const docker = new dockerode_1.default();
// Protect all deploy routes
router.use(auth_middleware_1.requireAuth);
const initDeployment = async (req, res, next) => {
    try {
        const projectName = req.body.projectName;
        if (!projectName) {
            throw new shared_1.AppError('Project name is required', 400);
        }
        const nameRegex = /^[a-z0-9_-]+$/;
        if (!nameRegex.test(projectName)) {
            throw new shared_1.AppError('Only lowercase alphanumeric characters, dashes (-), and underscores (_) are allowed.', 400);
        }
        // Check if project already exists in MongoDB
        const existingDb = await shared_1.Deployment.findOne({ projectName });
        if (existingDb) {
            throw new shared_1.AppError(`Project "${projectName}" already exists. Please choose a different name.`, 400);
        }
        // Check if Docker container already exists
        const containerName = `deployx-${projectName}`;
        const containers = await docker.listContainers({ all: true });
        if (containers.some(c => c.Names.includes(`/${containerName}`))) {
            throw new shared_1.AppError(`Docker container "${containerName}" already exists on the system. Please choose a different name.`, 400);
        }
        // Check if Docker image already exists
        const images = await docker.listImages();
        if (images.some(img => img.RepoTags?.includes(`${projectName}:latest`))) {
            throw new shared_1.AppError(`Docker image "${projectName}:latest" already exists on the system. Please choose a different name.`, 400);
        }
        const deploymentId = (0, uuid_1.v4)();
        req.deploymentId = deploymentId;
        const initialStatus = req.path.includes('/github') ? 'CLONING' : 'UPLOADING';
        // Encrypt envVars if present
        const envVarsRaw = req.body.envVars;
        const encryptedEnv = envVarsRaw ? (0, shared_1.encrypt)(envVarsRaw) : undefined;
        // Determine organizationId
        const currentUser = await shared_1.User.findById(req.user.id);
        let organizationId = undefined;
        if (currentUser) {
            if (currentUser.accountType === 'organization') {
                organizationId = currentUser._id.toString();
            }
            else if (currentUser.accountType === 'employee') {
                organizationId = currentUser.organizationId?.toString();
            }
        }
        await shared_1.Deployment.create({
            deploymentId,
            userId: req.user.id,
            organizationId,
            projectName,
            status: initialStatus,
            envVars: encryptedEnv,
            gitUrl: req.body.gitUrl,
            branch: req.body.branch || 'main'
        });
        (0, notify_1.notifyStatus)(deploymentId, initialStatus);
        next();
    }
    catch (error) {
        if (req.file) {
            fs_1.default.unlink(req.file.path, () => { });
        }
        next(error);
    }
};
router.post('/', upload_middleware_1.uploadMiddleware.single('file'), auth_middleware_1.requireFullAccess, initDeployment, deploy_controller_1.handleDeployUpload);
router.post('/github', auth_middleware_1.requireFullAccess, initDeployment, deploy_controller_1.handleGitDeploy);
exports.default = router;
//# sourceMappingURL=deploy.routes.js.map