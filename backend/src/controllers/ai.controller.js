"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSession = exports.getSessionMessages = exports.createSession = exports.getSessions = exports.handleAIChat = void 0;
const ai_service_1 = require("../services/ai.service");
const shared_1 = require("@deployhub/shared");
const neon_service_1 = require("../services/neon.service");
const handleAIChat = async (req, res, next) => {
    try {
        const { prompt, sessionId } = req.body;
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
        await (0, ai_service_1.processAIQuery)(prompt.trim(), userId, organizationId, res, sessionId);
        res.end();
    }
    catch (error) {
        next(error);
    }
};
exports.handleAIChat = handleAIChat;
const getSessions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const currentUser = await shared_1.User.findById(userId);
        let organizationId = userId;
        if (currentUser && currentUser.accountType === 'employee' && currentUser.organizationId) {
            organizationId = currentUser.organizationId.toString();
        }
        const sessions = await (0, neon_service_1.listChatSessions)(userId, organizationId);
        res.status(200).json({ sessions });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessions = getSessions;
const createSession = async (req, res, next) => {
    try {
        const { title } = req.body;
        if (!title || typeof title !== 'string' || !title.trim()) {
            throw new shared_1.AppError('Chat session title is required', 400);
        }
        const userId = req.user.id;
        const currentUser = await shared_1.User.findById(userId);
        let organizationId = userId;
        if (currentUser && currentUser.accountType === 'employee' && currentUser.organizationId) {
            organizationId = currentUser.organizationId.toString();
        }
        const session = await (0, neon_service_1.createChatSession)(userId, organizationId, title.trim());
        res.status(201).json({ session });
    }
    catch (error) {
        next(error);
    }
};
exports.createSession = createSession;
const getSessionMessages = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        const messages = await (0, neon_service_1.getChatMessages)(sessionId);
        res.status(200).json({ messages });
    }
    catch (error) {
        next(error);
    }
};
exports.getSessionMessages = getSessionMessages;
const deleteSession = async (req, res, next) => {
    try {
        const sessionId = req.params.id;
        const userId = req.user.id;
        const currentUser = await shared_1.User.findById(userId);
        let organizationId = userId;
        if (currentUser && currentUser.accountType === 'employee' && currentUser.organizationId) {
            organizationId = currentUser.organizationId.toString();
        }
        await (0, neon_service_1.deleteChatSession)(sessionId, organizationId);
        res.status(200).json({ success: true, message: 'Session deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSession = deleteSession;
//# sourceMappingURL=ai.controller.js.map