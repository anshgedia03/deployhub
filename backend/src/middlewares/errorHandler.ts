import { Request, Response, NextFunction } from 'express';
import { AppError } from '@deployhub/shared';
import { Logger } from '@deployhub/shared';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    Logger.warn('Backend', err.message);
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  Logger.error('Backend', 'Unhandled server error', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
