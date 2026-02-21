import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const message = err?.message || 'Internal Server Error';
  logger.error(message);

  const statusCode = err?.statusCode || err?.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    error: isDev ? message : 'Internal Server Error',
    ...(isDev && err?.stack ? { stack: err.stack } : {})
  });
}

export default errorHandler;
