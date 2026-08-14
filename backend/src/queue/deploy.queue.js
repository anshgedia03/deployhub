"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployQueue = void 0;
const bullmq_1 = require("bullmq");
const shared_1 = require("@deployhub/shared");
exports.deployQueue = new bullmq_1.Queue('deployments', {
    connection: {
        host: shared_1.env.REDIS_HOST,
        port: shared_1.env.REDIS_PORT,
    },
});
//# sourceMappingURL=deploy.queue.js.map