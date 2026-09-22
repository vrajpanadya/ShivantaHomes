import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';

export function notFound(req: Request, res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === 'object') {
    const e = err as { name?: string; message?: string; code?: number; errors?: Record<string, { message?: string }> };
    if (e.name === 'ZodError') {
      statusCode = 400;
      message = 'Validation failed';
      details = e.message;
    } else if (e.name === 'MongoServerError' && e.code === 11000) {
      statusCode = 409;
      message = 'Duplicate value for a unique field';
    } else if (e.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier';
    } else if (e.name === 'MulterError') {
      statusCode = 400;
      message = e.message ?? 'Upload error';
    } else if (e.name === 'TokenExpiredError' || e.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Session expired — please sign in again';
    } else if (e.message) {
      message = e.message ?? message;
    }
  }

  if (isProduction && statusCode === 500) message = 'Internal server error';
  if (statusCode === 500) console.error('[error]', err);

  res.status(statusCode).json({ success: false, message, ...(details ? { details } : {}) });
}
