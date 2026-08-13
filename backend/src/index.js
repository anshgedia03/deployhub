"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const ioredis_1 = __importDefault(require("ioredis"));
const app_1 = __importDefault(require("./app"));
const shared_1 = require("@deployhub/shared");
const qdrant_service_1 = require("./services/qdrant.service");
const startServer = async () => {
    try {
        await shared_1.mongoose.connect(shared_1.env.MONGODB_URI);
        shared_1.Logger.info('Backend', 'Connected to MongoDB');
        // Initialize Qdrant collection
        await (0, qdrant_service_1.initQdrantCollection)();
        const httpServer = (0, http_1.createServer)(app_1.default);
        const io = new socket_io_1.Server(httpServer, {
            cors: { origin: '*' },
            cookie: {
                name: "io",
                sameSite: "lax",
                secure: false,
            }
        });
        const redisSubscriber = new ioredis_1.default({ host: shared_1.env.REDIS_HOST, port: shared_1.env.REDIS_PORT });
        io.on('connection', (socket) => {
            shared_1.Logger.info('Socket', `Socket connected: ${socket.id}`);
            socket.on('subscribe', async (deploymentId) => {
                socket.join(`deployment:${deploymentId}`);
                shared_1.Logger.info('Socket', `Socket ${socket.id} subscribed to deployment: ${deploymentId}`);
                // History is now fetched via REST API on the client side
            });
            socket.on('disconnect', () => {
                shared_1.Logger.info('Socket', `Socket disconnected: ${socket.id}`);
            });
        });
        // Subscribe to all log events from worker and status broadcasts
        redisSubscriber.psubscribe('logs:*');
        redisSubscriber.subscribe('status:broadcast');
        redisSubscriber.on('pmessage', (pattern, channel, message) => {
            const deploymentId = channel.split(':')[1];
            if (deploymentId) {
                // Broadcast the live log chunk to anyone subscribed to this deployment
                io.to(`deployment:${deploymentId}`).emit('logs:live', message);
            }
        });
        redisSubscriber.on('message', (channel, message) => {
            if (channel === 'status:broadcast') {
                io.emit('project:status_changed', JSON.parse(message));
            }
        });
        httpServer.listen(shared_1.env.PORT, () => {
            shared_1.Logger.info('Backend', `Backend API running on port ${shared_1.env.PORT}`);
        });
    }
    catch (error) {
        shared_1.Logger.error('Backend', 'Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map