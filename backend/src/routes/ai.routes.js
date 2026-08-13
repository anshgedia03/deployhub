"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all AI routes
router.use(auth_middleware_1.requireAuth);
router.post('/chat', ai_controller_1.handleAIChat);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map