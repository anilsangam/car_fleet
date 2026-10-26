import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Always log detailed diagnostics on server terminal
  console.error('[SERVER ERROR]', err);

  // 1. Zod Validation Errors
  if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
    const formattedErrors: Record<string, string> = {};
    const issues = err.errors || err.issues || [];
    issues.forEach((e: any) => {
      const path = (e.path && e.path.join('.')) || 'root';
      if (!formattedErrors[path]) {
        formattedErrors[path] = e.message;
      }
    });

    return res.status(400).json({
      success: false,
      message: 'Please correct the highlighted fields.',
      error: 'Please correct the highlighted fields.',
      errors: formattedErrors,
    });
  }

  // 2. Mongoose Schema Validation Errors
  if (err.name === 'ValidationError') {
    const formattedErrors: Record<string, string> = {};
    if (err.errors) {
      Object.keys(err.errors).forEach((key) => {
        formattedErrors[key] = err.errors[key].message;
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Please correct the highlighted fields.',
      error: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // 3. MongoDB Duplicate Key (Unique Index Violation, e.g. registrationNumber, phone, email)
  if (err.code === 11000 || err.name === 'MongoServerError' && err.message?.includes('E11000')) {
    const keyPattern = err.keyPattern || err.keyValue || {};
    const field = Object.keys(keyPattern)[0] || 'registrationNumber';

    const fieldDescriptions: Record<string, string> = {
      registrationNumber: 'This registration number is already in use.',
      phone: 'This mobile number is already registered.',
      email: 'This email address is already in use.',
      licenseNumber: 'This driver license number is already in use.',
    };

    const specificMessage =
      fieldDescriptions[field] || `A record with this ${field} already exists.`;

    return res.status(409).json({
      success: false,
      message: specificMessage,
      error: specificMessage,
      errors: {
        [field]: specificMessage,
      },
    });
  }

  // 4. Mongoose Cast Error (Invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for field: ${err.path}`,
      error: `Invalid format for field: ${err.path}`,
      errors: {
        [err.path]: 'Invalid identifier or data type.',
      },
    });
  }

  // 5. Explicit HTTP Status Errors or Generic Internal Errors
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const isClientError = statusCode >= 400 && statusCode < 500;

  const publicMessage = isClientError || env.NODE_ENV === 'development'
    ? (err.message || 'An error occurred processing your request.')
    : 'An unexpected internal error occurred. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message: publicMessage,
    error: publicMessage,
    errors: err.errors || undefined,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
