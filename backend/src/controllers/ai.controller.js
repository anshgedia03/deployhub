"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAIChat = void 0;
const ai_service_1 = require("../services/ai.service");
const shared_1 = require("@deployhub/shared");
const handleAIChat = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
            throw new shared_1.AppError('Prompt is required', 400);
        }
        const userId = req.user.id;
        const currentUser = await shared_1.User.findById(userId);
        let organizationId = userId;
        if (currentUser) {
            if (currentUser.accountType === 'employee' && currentUser.organizationId) {
                organizationId = currentUser.organizationId.toString();
            }
            else if (currentUser.accountType === 'organization') {
                organizationId = currentUser._id.toString();
            }
        }
        // Set Server-Sent Events headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
        res.flushHeaders();
        await (0, ai_service_1.processAIQuery)(prompt.trim(), userId, organizationId, res);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.handleAIChat = handleAIChat;
//# sourceMappingURL=ai.controller.js.map