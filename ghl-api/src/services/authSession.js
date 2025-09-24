// AuthSession service - implements Better Auth PKCE token exchange and session management
// Follows OAuth 2.1/OIDC Authorization Code with PKCE flow

const { databaseService } = require('./database');

/**
 * Service for managing authentication sessions using Better Auth PKCE
 * Implements OAuth 2.1/OIDC Authorization Code with PKCE flow
 */
class AuthSessionService {
  constructor() {
    this.pkceChallenge = new Map(); // Temporary PKCE challenge storage
    // Initialize database on startup
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      await databaseService.initialize();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  /**
   * Generate authorization code for PKCE flow
   */
  generateAuthorizationCode() {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Store PKCE challenge temporarily
   */
  async storePKCEChallenge(authorizationCode, codeChallenge, email) {
    const challenge = {
      codeChallenge,
      email,
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    
    this.pkceChallenge.set(authorizationCode, challenge);
    
    // Auto-cleanup expired challenges
    setTimeout(() => {
      this.pkceChallenge.delete(authorizationCode);
    }, 10 * 60 * 1000);
  }

  /**
   * Verify PKCE code verifier against stored challenge
   */
  async verifyCodeChallenge(authorizationCode, codeVerifier) {
    const stored = this.pkceChallenge.get(authorizationCode);
    
    if (!stored) {
      throw new Error('Invalid or expired authorization code');
    }

    if (Date.now() > stored.expiresAt) {
      this.pkceChallenge.delete(authorizationCode);
      throw new Error('Authorization code expired');
    }

    // Generate challenge from verifier and compare
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const challenge = hash.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (challenge !== stored.codeChallenge) {
      throw new Error('Invalid code verifier');
    }

    return stored.email; // Return associated email for member lookup
  }

  /**
   * Create a new authentication session after PKCE token exchange
   */
  async createSession(userId, accessToken, expiresIn) {
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();
    
    try {
      // Store session in database
      await databaseService.createSession(userId, sessionId, accessToken, expiresAt);
      
      const session = {
        id: sessionId,
        userId,
        token: accessToken,
        expiresAt,
        createdAt: new Date().toISOString()
      };

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to create authentication session');
    }
  }

  /**
   * Validate and retrieve session by ID
   */
  async getSession(sessionId) {
    try {
      const session = await databaseService.getSessionBySessionId(sessionId);
      
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date(session.expiresAt) <= new Date()) {
        await databaseService.deleteSession(sessionId);
        return null;
      }

      return {
        id: session.sessionId,
        userId: session.userId,
        token: session.accessToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt
      };
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  /**
   * Exchange PKCE authorization code for session
   */
  async exchangeCodeForSession(authorizationCode, codeVerifier) {
    try {
      // 1. Verify PKCE challenge
      const email = await this.verifyCodeChallenge(authorizationCode, codeVerifier);
      
      // 2. Clean up used authorization code
      this.pkceChallenge.delete(authorizationCode);
      
      // 3. Fetch user from database using email
      const user = await databaseService.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      
      // 4. Create session
      const session = await this.createSession(user.id, 'mock_token', 3600); // 1 hour
      
      return {
        session,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          status: user.status
        }
      };
    } catch (error) {
      console.error('Failed to exchange code for session:', error);
      throw error;
    }
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(sessionId) {
    try {
      await databaseService.deleteSession(sessionId);
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Get member ID from session
   */
  async getMemberIdFromSession(sessionId) {
    const session = await this.getSession(sessionId);
    return session?.memberId || null;
  }

  // Private helper methods
  
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateState(state) {
    // TODO: Implement state validation logic
    return state && state.length > 10;
  }

  validateNonce(nonce) {
    // TODO: Implement nonce validation logic
    return nonce && nonce.length > 10;
  }

  async exchangeCodeForTokens(code, codeVerifier) {
    // TODO: Implement actual OIDC token endpoint call
    throw new Error('OIDC token exchange not implemented - requires Better Auth configuration');
  }

  async validateIdToken(idToken, expectedNonce) {
    // TODO: Implement ID token validation
    throw new Error('ID token validation not implemented - requires Better Auth configuration');
  }
}

// Singleton instance
const authSessionService = new AuthSessionService();
module.exports = { authSessionService };
