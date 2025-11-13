/**
 * Authentication Middleware for RACC Membership Portal
 * Validates Better Auth PKCE tokens and enforces role-based access
 */

import { Request, Response, NextFunction } from 'express';
import { authSessionService } from '@/services/authSession';

// Type extensions are automatically available through tsconfig.json

/**
 * Middleware to require authentication via Bearer token
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please provide a valid Bearer token'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Validate token with AuthSessionService
    const session = await authSessionService.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        details: 'Please log in again'
      });
    }
    
    // Attach user info to request
    req.user = session.user;
    req.session = session;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      details: 'Invalid token'
    });
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'Please log in first'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        details: `Requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole(['admin'])(req, res, next);
}

/**
 * Middleware to require moderator or admin role
 */
export function requireModerator(req: Request, res: Response, next: NextFunction) {
  return requireRole(['admin', 'moderator', 'content-manager'])(req, res, next);
}

/**
 * Middleware to require board member or admin role
 */
export function requireBoardMember(req: Request, res: Response, next: NextFunction) {
  return requireRole(['admin', 'moderator', 'board_member'])(req, res, next);
}

/**
 * Optional authentication - continues without error if no token provided
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await authSessionService.getSessionByToken(token);
      
      if (session) {
        req.user = session.user;
        req.session = session;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication on error
    console.warn('Optional auth error:', error);
    next();
  }
}
