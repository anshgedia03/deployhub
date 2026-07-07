import { redisPublisher } from '@deployhub/shared';

export const notifyStatus = (deploymentId: string, status: string, additionalData: Record<string, any> = {}) => {
  redisPublisher.publish('status:broadcast', JSON.stringify({ deploymentId, status, ...additionalData }));
};
