import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import app from './app';
import { env, Logger, mongoose } from '@deployhub/shared';

const startServer = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    Logger.info('Backend', 'Connected to MongoDB');

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: { origin: '*' },
    });

    const redisSubscriber = new Redis({ host: env.REDIS_HOST, port: env.REDIS_PORT });

    io.on('connection', (socket) => {
      Logger.info('Socket', `Socket connected: ${socket.id}`);

      socket.on('subscribe', async (deploymentId: string) => {
        socket.join(`deployment:${deploymentId}`);
        Logger.info('Socket', `Socket ${socket.id} subscribed to deployment: ${deploymentId}`);

        // History is now fetched via REST API on the client side
      });

      socket.on('disconnect', () => {
        Logger.info('Socket', `Socket disconnected: ${socket.id}`);
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

    httpServer.listen(env.PORT, () => {
      Logger.info('Backend', `Backend API running on port ${env.PORT}`);
    });
  } catch (error) {
    Logger.error('Backend', 'Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
