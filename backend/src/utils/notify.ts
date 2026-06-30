import { redisPublisher } from '@deployhub/shared';

export const notifyStatus = (deploymentId: string, status: string) => {
  redisPublisher.publish('status:broadcast', JSON.stringify({ deploymentId, status }));
};
