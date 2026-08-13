"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectAccess = exports.redeployProject = exports.getDeploymentEnvVars = exports.deleteDeployment = exports.stopDeployment = exports.startDeployment = exports.getDeploymentLogs = exports.getProjects = void 0;
const dockerode_1 = __importDefault(require("dockerode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const shared_1 = require("@deployhub/shared");
const git_service_1 = require("../services/git.service");
const notify_1 = require("../utils/notify");
const docker = new dockerode_1.default();
const getProjects = async (req, res, next) => {
    try {
        const { search } = req.query;
        const currentUser = await shared_1.User.findById(req.user.id);
        let query = {};
        if (currentUser) {
            if (currentUser.accountType === 'employee') {
                query = { 'accessControl.employeeId': currentUser._id };
            }
            else if (currentUser.accountType === 'organization') {
                query = { $or: [{ userId: req.user.id }, { organizationId: currentUser._id.toString() }] };
            }
            else {
                query = { userId: req.user.id };
            }
        }
        else {
            query = { userId: req.user.id };
        }
        if (search && typeof search === 'string') {
            query.projectName = { $regex: search, $options: 'i' };
        }
        const projects = await shared_1.Deployment.find(query).sort({ createdAt: -1 });
        const projectsWithUptime = await Promise.all(projects.map(async (project) => {
            let startedAt = '';
            if (project.containerId && project.status === 'RUNNING') {
                try {
                    const container = docker.getContainer(project.containerId);
                    const data = await container.inspect();
                    if (data.State && data.State.Running && data.State.StartedAt) {
                        startedAt = data.State.StartedAt;
                    }
                }
                catch (e) {
                    // Container might have been deleted/recreated or offline
                }
            }
            // Convert to plain object and attach startedAt
            const obj = project.toObject();
            return { ...obj, startedAt };
        }));
        res.status(200).json(projectsWithUptime);
    }
    catch (error) {
        next(error);
    }
};
exports.getProjects = getProjects;
const getAuthorizedProject = async (deploymentId, reqUserId) => {
    const project = await shared_1.Deployment.findOne({ deploymentId });
    if (!project)
        return null;
    const currentUser = await shared_1.User.findById(reqUserId);
    if (!currentUser)
        return null;
    if (currentUser.accountType !== 'employee') {
        if (project.userId === reqUserId)
            return project;
    }
    const orgId = currentUser.accountType === 'organization' ? currentUser._id.toString() : currentUser.organizationId?.toString();
    if (orgId && project.organizationId === orgId) {
        if (currentUser.accountType === 'employee') {
            const hasAccess = project.accessControl?.some((ac) => ac.employeeId.toString() === currentUser._id.toString());
            if (!hasAccess)
                return null;
        }
        return project;
    }
    return null;
};
const getDeploymentLogs = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { cursor = 0, limit = 50000 } = req.query;
        const project = await getAuthorizedProject(id, req.user.id);
        if (!project) {
            throw new shared_1.NotFoundError('Project not found');
        }
        const extractPath = path_1.default.resolve(process.cwd(), `deployments/${id}`);
        const logFilePath = path_1.default.join(extractPath, 'build.log');
        if (!fs_1.default.existsSync(logFilePath)) {
            res.status(200).json({ logs: '', nextCursor: null });
            return;
        }
        const startByte = parseInt(cursor, 10);
        const length = parseInt(limit, 10);
        const fd = await fs_1.default.promises.open(logFilePath, 'r');
        const stats = await fd.stat();
        if (startByte >= stats.size) {
            await fd.close();
            res.status(200).json({ logs: '', nextCursor: stats.size });
            return;
        }
        const bytesToRead = Math.min(length, stats.size - startByte);
        const buffer = Buffer.alloc(bytesToRead);
        await fd.read(buffer, 0, bytesToRead, startByte);
        await fd.close();
        res.status(200).json({
            logs: buffer.toString('utf-8'),
            nextCursor: startByte + bytesToRead
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeploymentLogs = getDeploymentLogs;
const startDeployment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const project = await getAuthorizedProject(id, req.user.id);
        if (!project || !project.containerId) {
            throw new shared_1.NotFoundError('Project or container not found');
        }
        const container = docker.getContainer(project.containerId);
        await container.start();
        project.status = 'RUNNING';
        await project.save();
        (0, notify_1.notifyStatus)(id, 'RUNNING', { startedAt: new Date().toISOString() });
        res.status(200).json(project);
    }
    catch (error) {
        next(error);
    }
};
exports.startDeployment = startDeployment;
const stopDeployment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const project = await getAuthorizedProject(id, req.user.id);
        if (!project || !project.containerId) {
            throw new shared_1.NotFoundError('Project or container not found');
        }
        const container = docker.getContainer(project.containerId);
        await container.stop();
        project.status = 'STOPPED';
        await project.save();
        (0, notify_1.notifyStatus)(id, 'STOPPED', { startedAt: null });
        res.status(200).json(project);
    }
    catch (error) {
        // Ignore error if container is already stopped
        if (error && error.statusCode === 304) {
            const id = req.params.id;
            const project = await getAuthorizedProject(id, req.user.id);
            if (project) {
                project.status = 'STOPPED';
                await project.save();
                (0, notify_1.notifyStatus)(project.deploymentId, 'STOPPED', { startedAt: null });
                res.status(200).json(project);
                return;
            }
        }
        next(error);
    }
};
exports.stopDeployment = stopDeployment;
const deleteDeployment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const project = await getAuthorizedProject(id, req.user.id);
        if (!project) {
            throw new shared_1.NotFoundError('Project not found');
        }
        if (project.containerId) {
            const container = docker.getContainer(project.containerId);
            try {
                await container.stop();
            }
            catch (e) { }
            try {
                await container.remove({ force: true });
            }
            catch (e) { }
        }
        // Fallback: Also try to remove by name in case containerId was lost
        try {
            const containerName = `deployx-${project.projectName || project.deploymentId}`;
            const existingContainer = docker.getContainer(containerName);
            await existingContainer.stop().catch(() => { });
            await existingContainer.remove({ force: true }).catch(() => { });
        }
        catch (e) {
            // Ignore
        }
        // Remove Nginx config and reload
        await (0, shared_1.removeNginxConfig)(project.projectName || id);
        // Delete files from deployments/ directory
        const extractPath = path_1.default.resolve(process.cwd(), `deployments/${id}`);
        if (fs_1.default.existsSync(extractPath)) {
            try {
                fs_1.default.rmSync(extractPath, { recursive: true, force: true });
            }
            catch (e) {
                console.error(`Failed to delete deployment directory: ${extractPath}`, e);
            }
        }
        await shared_1.Deployment.deleteOne({ deploymentId: id });
        (0, notify_1.notifyStatus)(id, 'DELETED');
        res.status(200).json({ success: true });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDeployment = deleteDeployment;
const getDeploymentEnvVars = async (req, res, next) => {
    try {
        const id = req.params.id;
        const project = await getAuthorizedProject(id, req.user.id);
        if (!project) {
            throw new shared_1.NotFoundError('Project not found');
        }
        let envVars = [];
        if (project.envVars) {
            try {
                const decryptedEnv = (0, shared_1.decrypt)(project.envVars);
                const lines = decryptedEnv.split(/\r?\n/);
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        const firstEq = trimmed.indexOf('=');
                        if (firstEq !== -1) {
                            envVars.push({
                                key: trimmed.substring(0, firstEq),
                                value: trimmed.substring(firstEq + 1)
                            });
                        }
                        else {
                            envVars.push({ key: trimmed, value: '' });
                        }
                    }
                }
            }
            catch (err) {
                console.error('Failed to decrypt envVars', err);
            }
        }
        res.status(200).json({ envVars });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeploymentEnvVars = getDeploymentEnvVars;
const redeployProject = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { envVars } = req.body; // Expecting string (the raw .env file format)
        const project = await getAuthorizedProject(id, req.user.id);
        if (!project) {
            throw new shared_1.NotFoundError('Project not found');
        }
        if (!project.gitUrl) {
            res.status(400).json({ error: 'Only Git-based projects can be redeployed using this endpoint.' });
            return;
        }
        // Stop and remove existing container if running
        if (project.containerId) {
            const container = docker.getContainer(project.containerId);
            try {
                await container.stop();
            }
            catch (e) { }
            try {
                await container.remove({ force: true });
            }
            catch (e) { }
        }
        // Update environment variables if provided
        if (envVars !== undefined) {
            project.envVars = envVars ? (0, shared_1.encrypt)(envVars) : '';
            await project.save();
        }
        // Pass execution to service asynchronously
        git_service_1.GitDeployService.processGitDeploy(project.deploymentId, project.gitUrl, project.branch || 'main').catch(err => {
            console.error('Async git redeploy processing error:', err);
        });
        res.status(200).json({ message: 'Redeployment queued successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.redeployProject = redeployProject;
const updateProjectAccess = async (req, res, next) => {
    try {
        if (req.user?.accountType !== 'organization') {
            res.status(403).json({ error: 'Forbidden: Only organizations can modify project access' });
            return;
        }
        const { id } = req.params;
        const { employeeId, accessLevel } = req.body;
        if (!['full', 'limited', 'none'].includes(accessLevel)) {
            res.status(400).json({ error: 'Invalid access level. Must be "full", "limited", or "none".' });
            return;
        }
        const project = await shared_1.Deployment.findOne({ deploymentId: id, organizationId: req.user.id });
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        // Initialize array if not present
        if (!project.accessControl) {
            project.accessControl = [];
        }
        // Remove existing entry for this employee
        project.accessControl = project.accessControl.filter(ac => ac.employeeId.toString() !== employeeId);
        // Add new entry if not 'none'
        if (accessLevel !== 'none') {
            project.accessControl.push({ employeeId: employeeId, accessLevel });
        }
        await project.save();
        res.status(200).json({ message: 'Project access updated successfully', accessControl: project.accessControl });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProjectAccess = updateProjectAccess;
//# sourceMappingURL=projects.controller.js.map