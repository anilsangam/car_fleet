import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Unhandled Application Error:', err);

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const message = err.message || 'An unexpected internal error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

