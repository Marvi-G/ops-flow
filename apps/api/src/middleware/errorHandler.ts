import type { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../infrastructure/errors.js';
import { getLogger } from '../infrastructure/logger/index.js';
import { sendError } from '../infrastructure/response.js';
import { getConfig } from '../config/index.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const logger = getLogger();
  const config = getConfig();

  // Log error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      {
        err,
        requestId: req.headers['x-request-id'],
        path: req.path,
        method: req.method,
      },
      'Operational error'
    );
  } else {
    logger.error(
      {
        err,
        requestId: req.headers['x-request-id'],
        path: req.path,
        method: req.method,
      },
      'Unhandled error'
    );
  }

  // Handle validation errors
  if (err instanceof ValidationError) {
    sendError(res, 422, 'VALIDATION_ERROR', err.message, err.errors);
    return;
  }

  // Handle known application errors
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code || 'ERROR', err.message);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', 'Resource already exists');
      return;
    }
    if (prismaErr.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Resource not found');
      return;
    }
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = config.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  sendError(res, statusCode, 'INTERNAL_ERROR', message);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`);
}
