/**
 * Error Handling Middleware for RACC Membership Portal
 * Provides consistent error responses and logging
 */

import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code || `HTTP_${statusCode}`;
    this.details = details;
  }
}

/**
 * Create standardized error responses
 */
export function createError(message: string, statusCode: number = 500, code?: string, details?: any): APIError {
  return new APIError(message, statusCode, code, details);
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, details?: any): APIError {
  return new APIError(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Authorization error helper
 */
export function createAuthError(message: string = 'Unauthorized'): APIError {
  return new APIError(message, 401, 'AUTH_ERROR');
}

/**
 * Forbidden error helper
 */
export function createForbiddenError(message: string = 'Forbidden'): APIError {
  return new APIError(message, 403, 'FORBIDDEN_ERROR');
}

/**
 * Not found error helper
 */
export function createNotFoundError(message: string = 'Resource not found'): APIError {
  return new APIError(message, 404, 'NOT_FOUND_ERROR');
}

/**
 * Conflict error helper
 */
export function createConflictError(message: string, details?: any): APIError {
  return new APIError(message, 409, 'CONFLICT_ERROR', details);
}

/**
 * Rate limit error helper
 */
export function createRateLimitError(message: string = 'Rate limit exceeded'): APIError {
  return new APIError(message, 429, 'RATE_LIMIT_ERROR');
}

/**
 * Main error handling middleware
 */
export function errorHandler(err: ApiError, req: Request, res: Response, next: NextFunction) {
  // Default error values
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.details || err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid resource ID format';
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
    details = 'A resource with this identifier already exists';
  }

  // Log error for debugging (but not in production for sensitive data)
  if (statusCode >= 500) {
    console.error('🚨 Server Error:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      ip: req.ip || req.connection.remoteAddress,
      error: {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }
    });
  } else if (statusCode >= 400) {
    console.warn('⚠️ Client Error:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      userId: req.user?.id,
      statusCode,
      code,
      message
    });
  }

  // Send error response
  const errorResponse: any = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };

  // Include details in non-production environments or for client errors
  if (details && (process.env.NODE_ENV !== 'production' || statusCode < 500)) {
    errorResponse.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = createNotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Async error wrapper - catches async errors and passes them to error middleware
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}