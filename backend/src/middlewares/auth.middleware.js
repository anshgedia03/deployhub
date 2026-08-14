"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFullAccess = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_1 = require("@deployhub/shared");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    try {
        const secret = shared_1.env.JWT_SECRET || 'secret';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        shared_1.Logger.error('Auth', 'Token verification failed:', err);
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
        return;
    }
};
exports.requireAuth = requireAuth;
const shared_2 = require("@deployhub/shared");
const requireFullAccess = async (req, res, next) => {
    try {
        if (req.user?.accountType === 'employee') {
            const deploymentId = req.params.id;
            // If there's no ID in the URL params, this is a create request (POST /deploy or POST /deploy/github). Block it.
            if (!deploymentId) {
                res.status(403).json({ error: 'Forbidden: Employees cannot create new projects. Only organizations can.' });
                return;
            }
            const project = await shared_2.Deployment.findOne({
                $or: [{ deploymentId }, { projectName: deploymentId }]
            });
            if (project && project.accessControl) {
                const employeeAccess = project.accessControl.find(ac => ac.employeeId.toString() === req.user.id);
                if (!employeeAccess || employeeAccess.accessLevel === 'limited') {
                    res.status(403).json({ error: 'Forbidden: Limited access employees cannot perform this action on this project' });
                    return;
                }
            }
            else if (project) {
                // If project exists but no access control array (or employee not in it), block by default for employees
                res.status(403).json({ error: 'Forbidden: You do not have access to this project' });
                return;
            }
            else {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
        }
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.requireFullAccess = requireFullAccess;
//# sourceMappingURL=auth.middleware.js.map