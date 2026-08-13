"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyStatus = void 0;
const shared_1 = require("@deployhub/shared");
const notifyStatus = (deploymentId, status, additionalData = {}) => {
    shared_1.redisPublisher.publish('status:broadcast', JSON.stringify({ deploymentId, status, ...additionalData }));
};
exports.notifyStatus = notifyStatus;
//# sourceMappingURL=notify.js.map