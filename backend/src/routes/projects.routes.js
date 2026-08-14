"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projects_controller_1 = require("../controllers/projects.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all projects routes
router.use(auth_middleware_1.requireAuth);
router.get('/', projects_controller_1.getProjects);
router.get('/:id/logs', projects_controller_1.getDeploymentLogs);
router.get('/:id/env', auth_middleware_1.requireFullAccess, projects_controller_1.getDeploymentEnvVars);
router.post('/:id/redeploy', auth_middleware_1.requireFullAccess, projects_controller_1.redeployProject);
router.post('/:id/start', projects_controller_1.startDeployment);
router.post('/:id/stop', projects_controller_1.stopDeployment);
router.delete('/:id', auth_middleware_1.requireFullAccess, projects_controller_1.deleteDeployment);
router.put('/:id/access', projects_controller_1.updateProjectAccess);
exports.default = router;
//# sourceMappingURL=projects.routes.js.map