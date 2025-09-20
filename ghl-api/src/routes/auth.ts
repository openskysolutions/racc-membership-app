// Auth routes - Better Auth PKCE session management

import express from 'express';
import { authSessionService } from '@/services/authSession';

const router = express.Router();

// Simple in-memory user store (in production, this would be a database)
interface RegisteredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // In production, this would be hashed
  businessName?: string;
  phone?: string;
  website?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

const registeredUsers: Map<string, RegisteredUser> = new Map();

/**
 * POST /auth/register
 * User registration endpoint
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, businessName, phone, website } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'firstName, lastName, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists (for now, check demo users)
    const existingUsers = [
      'admin@racc.com', 'member@racc.com', 'moderator@racc.com', 'demo@racc.com'
    ];
    
    if (existingUsers.includes(email.toLowerCase())) {
      return res.status(409).json({
        error: 'User already exists',
        details: 'An account with this email address already exists'
      });
    }

    // Check if user already exists
    const existingUser = Array.from(registeredUsers.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        details: 'An account with this email already exists'
      });
    }

    // In a real implementation, this would:
    // 1. Hash the password with bcrypt
    // 2. Store user data in database
    // 3. Send verification email
    // 4. Generate proper user ID
    
    // For now, create a user object and store it
    const newUser: RegisteredUser = {
      id: `user_${Date.now()}`,
      firstName,
      lastName,
      email,
      password, // In production, hash this with bcrypt
      businessName,
      phone,
      website,
      role: 'member',
      status: 'active',
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    // Store the user
    registeredUsers.set(newUser.id, newUser);

    // For demo purposes, we'll just return success
    // In production, this would store in database and send verification email
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        businessName: newUser.businessName,
        role: newUser.role,
        status: newUser.status,
        emailVerified: newUser.emailVerified
      },
      nextStep: 'login'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      details: 'An internal server error occurred'
    });
  }
});

/**
 * GET /auth/profile/:userId
 * Get user profile information
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = registeredUsers.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Return user profile (without password)
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      businessName: user.businessName,
      phone: user.phone,
      website: user.website,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: 'An internal server error occurred'
    });
  }
});

/**
 * PUT /auth/profile/:userId
 * Update user profile information
 */
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, businessName, phone, website } = req.body;

    // Find the user
    const user = registeredUsers.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'firstName and lastName are required'
      });
    }

    // Update user profile (email cannot be changed for now)
    const updatedUser: RegisteredUser = {
      ...user,
      firstName,
      lastName,
      businessName: businessName || user.businessName,
      phone: phone || user.phone,
      website: website || user.website
    };

    // Store the updated user
    registeredUsers.set(userId, updatedUser);

    // Return updated profile (without password)
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        businessName: updatedUser.businessName,
        phone: updatedUser.phone,
        website: updatedUser.website,
        role: updatedUser.role,
        status: updatedUser.status,
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      details: 'An internal server error occurred'
    });
  }
});

/**
 * POST /auth/authorize
 * PKCE authorization request (step 1)
 */
router.post('/authorize', async (req, res) => {
  try {
    const { email, password, codeChallenge, codeChallengeMethod } = req.body;

    // Validate required parameters
    if (!email || !password || !codeChallenge || codeChallengeMethod !== 'S256') {
      return res.status(400).json({
        error: 'Missing or invalid required parameters',
        details: 'email, password, codeChallenge (S256) are required'
      });
    }

    // Check demo users first
    const demoUsers = [
      { email: 'admin@racc.com', password: 'admin123', role: 'admin', name: 'RACC Administrator' },
      { email: 'member@racc.com', password: 'member123', role: 'member', name: 'John Doe' },
      { email: 'moderator@racc.com', password: 'mod123', role: 'moderator', name: 'Jane Smith' },
      { email: 'demo@racc.com', password: 'demo123', role: 'member', name: 'Demo User' }
    ];

    let user = demoUsers.find(u => u.email === email && u.password === password);
    
    // If not found in demo users, check registered users
    if (!user) {
      const registeredUser = Array.from(registeredUsers.values()).find(u => u.email === email && u.password === password);
      if (registeredUser) {
        user = {
          email: registeredUser.email,
          password: registeredUser.password,
          role: registeredUser.role,
          name: `${registeredUser.firstName} ${registeredUser.lastName}`
        };
      }
    }
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Generate authorization code
    const authorizationCode = authSessionService.generateAuthorizationCode();
    
    // Store challenge temporarily for later verification (includes user info)
    await authSessionService.storePKCEChallenge(authorizationCode, codeChallenge, email, user);

    res.status(200).json({
      authorizationCode,
      expiresIn: 600 // 10 minutes
    });

  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      error: 'Authorization failed',
      details: error.message
    });
  }
});

/**
 * POST /auth/session
 * Exchange PKCE authorization code for session (step 2)
 */
router.post('/session', async (req, res) => {
  try {
    const { code, code_verifier } = req.body;

    // Validate required parameters
    if (!code || !code_verifier) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'code and code_verifier are required'
      });
    }

    // Exchange code for session
    const result = await authSessionService.exchangeCodeForSession(
      code,
      code_verifier
    );

    console.log('Session result:', JSON.stringify(result, null, 2));
    console.log('Session token:', result.session.token);

    // Return session and user info with explicit token handling
    const responseData = {
      sessionId: result.session.id,
      session: {
        id: result.session.id,
        memberId: result.session.memberId,
        token: result.session.token,
        expiresAt: result.session.expiresAt
      },
      user: result.user
    };

    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error('Auth session error:', error);
    
    if (error.message.includes('Invalid code') || error.message.includes('Invalid verifier')) {
      return res.status(400).json({
        error: 'Invalid PKCE parameters',
        details: error.message
      });
    }

    if (error.message.includes('not implemented')) {
      return res.status(501).json({
        error: 'Authentication not configured',
        details: 'Better Auth PKCE integration not yet implemented'
      });
    }

    res.status(500).json({
      error: 'Authentication failed',
      details: 'Please try again'
    });
  }
});

/**
 * GET /auth/session/:sessionId
 * Validate session and get member info
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await authSessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found or expired'
      });
    }

    res.json({
      sessionId: session.id,
      memberId: session.memberId,
      expiresAt: session.expiresAt,
      valid: true
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      error: 'Session validation failed'
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile from session
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const session = await authSessionService.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired session'
      });
    }

    // Return user profile (in real implementation, fetch from database)
    res.json({
      id: session.memberId,
      name: session.user?.name || 'Demo User',
      email: session.user?.email || 'demo@racc.com',
      role: session.user?.role || 'member',
      status: 'active'
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

/**
 * POST /auth/check-session
 * Check if session is valid
 */
router.post('/check-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }

    const token = authHeader.substring(7);
    const session = await authSessionService.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({ valid: false });
    }

    res.json({ 
      valid: true,
      expiresAt: session.expiresAt 
    });

  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ valid: false });
  }
});

/**
 * DELETE /auth/session/:sessionId
 * Invalidate session (logout)
 */
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    await authSessionService.invalidateSession(sessionId);

    res.status(204).send(); // No content

  } catch (error) {
    console.error('Session invalidation error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh session (extend expiration)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'sessionId is required'
      });
    }

    const session = await authSessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found or expired'
      });
    }

    // In a real implementation, this would refresh the token with the OIDC provider
    // For now, just return the existing session
    res.json({
      sessionId: session.id,
      memberId: session.memberId,
      expiresAt: session.expiresAt
    });

  } catch (error) {
    console.error('Session refresh error:', error);
    res.status(500).json({
      error: 'Session refresh failed'
    });
  }
});

/**
 * GET /auth/validate
 * Validate session from Authorization header
 */
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const sessionId = authHeader.substring(7); // Remove 'Bearer '
    const session = await authSessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired session'
      });
    }

    res.json({
      valid: true,
      sessionId: session.id,
      memberId: session.memberId,
      expiresAt: session.expiresAt
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      error: 'Session validation failed'
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile using session
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const sessionId = authHeader.substring(7); // Remove 'Bearer '
    const session = await authSessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired session'
      });
    }

    // TODO: Fetch actual user profile from member database
    // For now, return mock user data
    const user = {
      id: session.memberId,
      name: 'Test Member',
      email: 'test@example.com',
      role: 'member',
      status: 'active'
    };

    res.json(user);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Profile fetch failed'
    });
  }
});

/**
 * POST /auth/logout
 * Logout using session from Authorization header
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const sessionId = authHeader.substring(7); // Remove 'Bearer '
    await authSessionService.invalidateSession(sessionId);

    res.status(204).send(); // No content

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
});

export default router;
