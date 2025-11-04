/**
 * Request/Response Logging Middleware for RACC Membership Portal
 * Provides structured logging for API requests and responses
 */

import { Request, Response, NextFunction } from 'express';

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  ip: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

/**
 * Middleware to log incoming requests and outgoing responses
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Create base log entry
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    ip: req.ip || req.connection.remoteAddress || 'unknown'
  };
  
  // Log the incoming request
  console.log('📥 Request:', JSON.stringify({
    ...logEntry,
    body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined
  }));
  
  // Override res.end to capture response data
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    // Log the outgoing response
    console.log('📤 Response:', JSON.stringify({
      ...logEntry,
      duration,
      statusCode: res.statusCode,
      contentLength: res.get('content-length') || 0
    }));
    
    // Call the original end method
    return originalEnd(...args);
  } as any;
  
  next();
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'auth', 'key'];
  const fileDataFields = ['fileData', 'file', 'image', 'avatar', 'coverImage'];
  
  // Redact sensitive fields
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Truncate file data fields (they're too large)
  for (const field of fileDataFields) {
    if (sanitized[field] && typeof sanitized[field] === 'string' && sanitized[field].length > 100) {
      sanitized[field] = `[FILE_DATA: ${sanitized[field].substring(0, 50)}... (${sanitized[field].length} bytes)]`;
    }
  }
  
  return sanitized;
}

/**
 * Middleware to log errors with structured format
 */
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };
  
  console.error('❌ Error:', JSON.stringify(errorEntry));
  
  next(err);
}