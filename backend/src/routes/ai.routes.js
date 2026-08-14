"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all AI routes
router.use(auth_middleware_1.requireAuth);
router.post('/chat', ai_controller_1.handleAIChat);
router.get('/sessions', ai_controller_1.getSessions);
router.post('/sessions', ai_controller_1.createSession);
router.get('/sessions/:id/messages', ai_controller_1.getSessionMessages);
router.delete('/sessions/:id', ai_controller_1.deleteSession);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map