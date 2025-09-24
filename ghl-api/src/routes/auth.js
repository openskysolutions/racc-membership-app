// Auth routes - Better Auth PKCE session management

const express = require('express');
const { authSessionService } = require('@/services/authSession.js');

const router = express.Router();

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

    // TODO: Validate credentials against member database
    // For now, simulate a simple check
    if (!email.includes('@') || password.length < 6) {
      return res.status(401).json({
        error: 'Invalid credentials',
        details: 'Authentication failed'
      });
    }

    // Generate authorization code
    const authorizationCode = authSessionService.generateAuthorizationCode();
    
    // Store challenge temporarily for later verification
    await authSessionService.storePKCEChallenge(authorizationCode, codeChallenge, email);

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
    const { authorizationCode, codeVerifier } = req.body;

    // Validate required parameters
    if (!authorizationCode || !codeVerifier) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'authorizationCode and codeVerifier are required'
      });
    }

    // Exchange code for session
    const result = await authSessionService.exchangeCodeForSession(
      authorizationCode,
      codeVerifier
    );

    // Return session and user info
    res.status(201).json({
      session: {
        id: result.session.id,
        memberId: result.session.memberId,
        expiresAt: result.session.expiresAt
      },
      user: result.user
    });

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
 * DELETE /auth/session/:sessionId
 * Logout - invalidate session
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

module.exports = router;
