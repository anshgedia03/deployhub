import { Queue } from 'bullmq';
import { env } from '@deployhub/shared';

export const deployQueue = new Queue('deployments', {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});
