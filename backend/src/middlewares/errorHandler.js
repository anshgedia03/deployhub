"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const shared_1 = require("@deployhub/shared");
const shared_2 = require("@deployhub/shared");
const errorHandler = (err, req, res, next) => {
    if (err instanceof shared_1.AppError) {
        shared_2.Logger.warn('Backend', err.message);
        res.status(err.statusCode).json({
            status: 'error',
            error: err.message,
            message: err.message,
        });
        return;
    }
    shared_2.Logger.error('Backend', 'Unhandled server error', err);
    res.status(500).json({
        status: 'error',
        error: err.message || 'Internal server error',
        message: err.message || 'Internal server error',
        stack: err.stack,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map