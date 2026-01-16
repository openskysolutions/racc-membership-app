// Enhanced Auth routes with Database and GoHighLevel Integration

import express from 'express';
import crypto from 'crypto';
import { authSessionService } from '@/services/authSession';
import { databaseService } from '@/services/database';
import { ghlService } from '@/services/gohighlevel';
import { emailService } from '@/services/emailService';
import { enrichUserWithGhlData } from '@/services/userEnrichment';

const router = express.Router();

// Global type declarations for temporary storage
declare global {
  var confirmationCodes: Map<string, {
    email: string;
    code: string;
    expiresAt: number;
  }> | undefined;
}

// Store for authorization codes (in production, use Redis or database)
const authorizationCodes = new Map<string, {
  userId: number;
  codeChallenge: string;
  codeChallengeMethod: string;
  redirectUri?: string;
  remember?: boolean; // Remember me preference
  expiresAt: Date;
}>();

/**
 * POST /auth/authorize
 * PKCE OAuth 2.0 Authorization endpoint
 */
router.post('/authorize', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      codeChallenge, 
      codeChallengeMethod = 'S256',
      redirectUri,
      remember = false
    } = req.body;

    // Validate required parameters
    if (!email || !password || !codeChallenge) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: email, password, code_challenge'
      });
    }

    // Validate code challenge method
    if (codeChallengeMethod !== 'S256') {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Only S256 code challenge method is supported'
      });
    }

    // Authenticate user - first check database, then verify active status in GoHighLevel
    const dbUser = await databaseService.verifyPassword(email, password);
    if (!dbUser) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Invalid email or password'
      });
    }

    // Check if user has "active" tag and valid renewal date in GoHighLevel
    const { isActive, contact, reason } = await ghlService.isUserActive(email);
    
    if (!isActive) {
      const errorMessage = reason || 'Account not active. Please contact support to ensure your membership is current.';
      return res.status(403).json({
        error: 'access_denied',
        error_description: errorMessage,
        userStatus: 'inactive',
        requiresActivation: true,
        reason: reason
      });
    }

    // Check for admin role based on HighLevel tags
    const userRole = await ghlService.getUserRole(email);
    
    // Update local database role if it differs from HighLevel tags
    if (dbUser.role !== userRole) {
      try {
        await databaseService.updateUser(dbUser.id!, { role: userRole });
        dbUser.role = userRole; // Update the user object for the response
      } catch (updateError) {
        console.error('Failed to update user role in database:', updateError);
        // Continue with auth even if database update fails
      }
    }

    // Update local database status to match GoHighLevel if needed
    if (dbUser.status !== 'active') {
      try {
        await databaseService.updateUserStatus(dbUser.id!, 'active');
      } catch (updateError) {
        console.error('Failed to update user status in database:', updateError);
        // Continue with auth even if database update fails
      }
    }

    // Enrich user with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

    // Generate authorization code
    const authCode = crypto.randomBytes(32).toString('base64url');
    
    // Store authorization code with PKCE data
    authorizationCodes.set(authCode, {
      userId: dbUser.id!,
      codeChallenge,
      codeChallengeMethod,
      redirectUri,
      remember, // Store remember preference
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    res.json({
      code: authCode,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        membershipTier: user.membershipTier,
        status: user.status
      }
    });

  } catch (error: any) {
    console.error('Authorization error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during authorization'
    });
  }
});

/**
 * POST /auth/token
 * PKCE OAuth 2.0 Token endpoint
 */
router.post('/token', async (req, res) => {
  try {
    const { 
      grant_type,
      code,
      code_verifier,
      redirect_uri 
    } = req.body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported'
      });
    }

    // Validate required parameters
    if (!code || !code_verifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters: code, code_verifier'
      });
    }

    // Get authorization code data
    const authData = authorizationCodes.get(code);
    if (!authData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      });
    }

    // Check expiration
    if (authData.expiresAt < new Date()) {
      authorizationCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code expired'
      });
    }

    // Verify PKCE code challenge
    const codeChallenge = crypto
      .createHash('sha256')
      .update(code_verifier)
      .digest('base64url');

    if (codeChallenge !== authData.codeChallenge) {
      authorizationCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid code verifier'
      });
    }

    // Code is valid, remove it (one-time use)
    authorizationCodes.delete(code);

    // Get user data from database (auth fields only)
    const dbUser = await databaseService.getUserById(authData.userId);
    if (!dbUser) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'User not found'
      });
    }

    // Enrich with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

    // Determine expiration time based on remember preference
    // Remember me: 30 days, otherwise: 1 hour
    const expiresIn = authData.remember ? (30 * 24 * 3600) : 3600;

    // Create session and generate tokens
    const accessToken = authSessionService.generateAccessToken(user.id);
    const session = await authSessionService.createSession(user.id!, accessToken, expiresIn, user); // Pass complete user data
    
    res.json({
      access_token: session.token,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        phone: user.phone,
        membershipTier: user.membershipTier,
        status: user.status,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during token generation'
    });
  }
});

/**
 * POST /auth/session  
 * Convenience endpoint that combines token exchange with session creation
 * Alternative to the standard /token endpoint for easier frontend integration
 */
router.post('/session', async (req, res) => {
  try {
    const { code, codeVerifier, code_verifier, email, password, codeChallenge, codeChallengeMethod, remember } = req.body;
    
    // Support both camelCase and snake_case for flexibility
    const verifier = codeVerifier || code_verifier;
    
    // If no code but has email/password/codeChallenge, do the full flow
    if (!code && email && password && codeChallenge && verifier) {
      // Step 1: Authenticate and get authorization code
      const dbUser = await databaseService.verifyPassword(email, password);
      if (!dbUser) {
        return res.status(401).json({
          error: 'invalid_grant',
          error_description: 'Invalid email or password'
        });
      }

      // Check if user has "active" tag and valid renewal date in GoHighLevel
      const { isActive, contact, reason } = await ghlService.isUserActive(email);
      
      if (!isActive) {
        const errorMessage = reason || 'Account not active. Please contact support to ensure your membership is current.';
        return res.status(403).json({
          error: 'access_denied',
          error_description: errorMessage,
          userStatus: 'inactive',
          requiresActivation: true,
          reason: reason
        });
      }

      // Update local database status to match GoHighLevel if needed
      if (dbUser.status !== 'active') {
        try {
          await databaseService.updateUserStatus(dbUser.id!, 'active');
        } catch (updateError) {
          console.error('Failed to update user status in database:', updateError);
          // Continue with auth even if database update fails
        }
      }

      // Verify the code challenge matches the code verifier
      const computedChallenge = crypto
        .createHash('sha256')
        .update(verifier)
        .digest('base64url');

      if (computedChallenge !== codeChallenge) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Code challenge does not match code verifier'
        });
      }

      // Determine expiration time based on remember preference
      const expiresIn = remember ? (30 * 24 * 3600) : 3600;

      // Enrich user with profile data from GoHighLevel
      const user = await enrichUserWithGhlData(dbUser);

      // Create session directly (skip authorization code step)
      const accessToken = authSessionService.generateAccessToken(dbUser.id);
      const session = await authSessionService.createSession(dbUser.id!, accessToken, expiresIn);
      
      return res.json({
        success: true,
        session: {
          sessionId: session.id,
          accessToken: session.token,
          expiresAt: session.expiresAt
        },
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          businessName: user.businessName,
          phone: user.phone,
          membershipTier: user.membershipTier,
          status: user.status,
          role: user.role
        }
      });
    }
    
    // Original flow: requires both code and verifier
    if (!code || !verifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters. Provide either: (1) code + codeVerifier, or (2) email + password + codeChallenge + codeVerifier'
      });
    }

    // Get authorization code data
    const authData = authorizationCodes.get(code);
    if (!authData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      });
    }

    // Check expiration
    if (authData.expiresAt < new Date()) {
      authorizationCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code expired'
      });
    }

    // Verify PKCE code challenge
    const computedChallengeFromCode = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');

    if (computedChallengeFromCode !== authData.codeChallenge) {
      authorizationCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid code verifier'
      });
    }

    // Code is valid, remove it (one-time use)
    authorizationCodes.delete(code);

    // Get user data from database (auth fields only)
    const dbUser = await databaseService.getUserById(authData.userId);
    if (!dbUser) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'User not found'
      });
    }

    // Enrich user with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

    // Determine expiration time based on remember preference from authData
    const expiresIn = authData.remember ? (30 * 24 * 3600) : 3600;

    // Create session and generate tokens
    const accessToken = authSessionService.generateAccessToken(dbUser.id);
    const session = await authSessionService.createSession(dbUser.id!, accessToken, expiresIn);
    
    res.json({
      success: true,
      session: {
        sessionId: session.id,
        accessToken: session.token,
        expiresAt: session.expiresAt
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        phone: user.phone,
        membershipTier: user.membershipTier,
        status: user.status,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Session creation error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during session creation'
    });
  }
});

/**
 * POST /auth/check-session
 * Validate if the current session/token is still valid
 */
router.post('/check-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check if session exists and is valid
    const session = await authSessionService.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Session not found or expired'
      });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({
        error: 'token_expired',
        error_description: 'Session has expired'
      });
    }

    // Session is valid, return user info
    const dbUser = await databaseService.getUserById(session.memberId);
    if (!dbUser) {
      return res.status(401).json({
        error: 'user_not_found',
        error_description: 'User associated with session not found'
      });
    }

    // Enrich user with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        phone: user.phone,
        membershipTier: user.membershipTier,
        status: user.status,
        role: user.role
      },
      session: {
        sessionId: session.id,
        expiresAt: session.expiresAt
      }
    });

  } catch (error: any) {
    console.error('Session check error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error during session validation'
    });
  }
});

/**
 * GET /auth/profile
 * Get current user profile using Bearer token authentication
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check if session exists and is valid
    const session = await authSessionService.getSessionByToken(token);
    
    if (!session) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Session not found or expired'
      });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({
        error: 'token_expired',
        error_description: 'Session has expired'
      });
    }

    // Get user data from database (auth fields only)
    const dbUser = await databaseService.getUserById(session.memberId);
    if (!dbUser) {
      return res.status(401).json({
        error: 'user_not_found',
        error_description: 'User associated with session not found'
      });
    }

    // Enrich user with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

    // Check HighLevel tags to sync role (but don't fail auth if this fails)
    let currentRole = user.role;
    try {
      const newRole = await ghlService.getUserRole(user.email);
      
      // Update role if it changed
      if (dbUser.role !== newRole) {
        await databaseService.updateUser(dbUser.id!, { role: newRole });
        currentRole = newRole;
      }
    } catch (roleUpdateError) {
      console.error('Failed to sync role from HighLevel, using database role:', roleUpdateError);
      // Continue with existing role from database
    }

    res.json({
      id: user.id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      phone: user.phone,
      website: user.website,
      role: currentRole, // Use the synced role
      status: user.status,
      membershipTier: user.membershipTier,
      emailVerified: user.emailVerified,
      ghlContactId: user.ghlContactId,
      avatarUrl: user.avatarUrl,
      tags: user.tags || [], // Include tags from GoHighLevel
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error while fetching profile'
    });
  }
});

/**
 * GET /auth/validate
 * Lightweight endpoint to check if token is valid without fetching full profile
 * Returns 200 with { valid: true/false } - never returns errors
 */
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    // No token provided
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ valid: false, reason: 'no_token' });
    }

    const token = authHeader.substring(7);
    
    // Check if session exists and is valid
    const session = await authSessionService.getSessionByToken(token);
    
    if (!session) {
      return res.json({ valid: false, reason: 'session_not_found' });
    }

    // Check if session is expired
    if (new Date(session.expiresAt) <= new Date()) {
      return res.json({ valid: false, reason: 'session_expired' });
    }

    // Session is valid
    return res.json({ 
      valid: true,
      expiresAt: session.expiresAt 
    });

  } catch (error: any) {
    console.error('Validation error:', error);
    // Even on error, return clean response
    return res.json({ valid: false, reason: 'validation_error' });
  }
});

/**
 * POST /auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Even if no valid token, consider logout successful (cleanup local storage)
      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Try to find and invalidate the session
    try {
      const session = await authSessionService.getSessionByToken(token);
      
      if (session) {
        // Invalidate the session
        await authSessionService.invalidateSession(session.id);
      }
    } catch (sessionError) {
      // If session doesn't exist or is already invalid, that's fine for logout
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    console.error('Logout error:', error);
    // Even if there's an error, we should return success for logout
    // The client will clear local storage regardless
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
});

// Membership tier configurations
const MEMBERSHIP_TIERS = {
  standard: {
    name: 'Standard Membership',
    price: 50.00,
    currency: 'USD',
    description: 'Access to basic member benefits and networking events'
  },
  premium: {
    name: 'Premium Membership',
    price: 100.00,
    currency: 'USD',
    description: 'Full access to all member benefits, premium events, and business resources'
  },
  corporate: {
    name: 'Corporate Membership',
    price: 200.00,
    currency: 'USD',
    description: 'Corporate package with multiple member access and premium business services'
  }
};

/**
 * GET /auth/membership-tiers
 * Get available membership tiers
 */
router.get('/membership-tiers', (req, res) => {
  res.json({
    tiers: MEMBERSHIP_TIERS
  });
});

/**
 * POST /auth/register
 * Enhanced user registration with database and GoHighLevel integration
 */
router.post('/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      businessName, 
      phone, 
      website,
      membershipTier = 'standard'
    } = req.body;

    // Validate required fields - only email and password are required
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email and password are required'
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
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Validate membership tier
    if (!MEMBERSHIP_TIERS[membershipTier]) {
      return res.status(400).json({
        error: 'Invalid membership tier',
        availableTiers: Object.keys(MEMBERSHIP_TIERS)
      });
    }

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // Create GoHighLevel contact first - TEMPORARILY COMMENTED OUT
    let ghlContactId = null;
    /*
    try {
      console.log('🔍 Starting GHL contact creation process...');
      ghlContactId = await ghlService.createContact({
        firstName: firstName || 'New',
        lastName: lastName || 'Member',
        email,
        phone,
        website,
        businessName,
        source: 'RACC Membership Registration',
        tags: ['prospect', 'new-registration', `tier-${membershipTier}`],
        customFields: {
          'Business Name': businessName || '',
          'Registration Date': new Date().toISOString(),
          'Member Status': 'pending-payment',
          'Membership Tier': membershipTier
        }
      });
      console.log('✅ GHL contact created successfully:', ghlContactId);
    } catch (ghlError) {
      console.error('❌ Failed to create GHL contact - DETAILED ERROR:', ghlError);
      console.error('Error stack:', ghlError.stack);
      return res.status(500).json({
        error: 'Failed to create contact in CRM',
        message: 'Please try again later or contact support',
        debug: process.env.NODE_ENV === 'development' ? ghlError.message : undefined
      });
    }
    */

    // Create user in database
    let user;
    try {
      user = await databaseService.createUser({
        email,
        passwordHash: password, // This will be hashed in the service
        role: 'member',
        status: 'pending',
        emailVerified: false,
        ghlContactId
      });
    } catch (dbError) {
      console.error('Failed to create user in database:', dbError);
      
      // Try to clean up GHL contact if database creation failed - COMMENTED OUT
      /*
      try {
        // Note: GoHighLevel doesn't have a direct delete API, so we'll tag as failed
        await ghlService.updateContactTags(ghlContactId, ['registration-failed'], 'add');
      } catch (cleanupError) {
        console.error('Failed to cleanup GHL contact:', cleanupError);
      }
      */
      
      return res.status(500).json({
        error: 'Failed to create user account',
        message: 'Please try again later or contact support'
      });
    }

    // Create payment link
    const tierConfig = MEMBERSHIP_TIERS[membershipTier];
    let paymentLink = null;
    
    // TODO: Commented out payment link creation since GHL contact creation is disabled
    /*
    try {
      paymentLink = await ghlService.createPaymentLink({
        contactId: ghlContactId,
        amount: tierConfig.price,
        currency: tierConfig.currency,
        description: tierConfig.description,
        membershipTier,
        successUrl: `${process.env.FRONTEND_URL}/auth/payment-success`,
        cancelUrl: `${process.env.FRONTEND_URL}/auth/payment-cancelled`
      });
    } catch (paymentError) {
      console.error('Failed to create payment link:', paymentError);
      // Continue without payment link for now
      paymentLink = null;
    }
    */

    // Enrich user with profile data from GoHighLevel
    const enrichedUser = await enrichUserWithGhlData(user);

    // Return registration success response
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: enrichedUser.id,
        firstName: enrichedUser.firstName,
        lastName: enrichedUser.lastName,
        email: enrichedUser.email,
        businessName: enrichedUser.businessName,
        phone: enrichedUser.phone,
        website: enrichedUser.website,
        role: enrichedUser.role,
        status: enrichedUser.status,
        membershipTier: enrichedUser.membershipTier,
        ghlContactId: enrichedUser.ghlContactId
      },
      payment: {
        required: true,
        tier: tierConfig,
        paymentLink
      },
      nextSteps: [
        'Complete payment to activate your membership',
        'Check your email for verification instructions',
        'Access member portal after activation'
      ]
    });

    console.log(`Successfully registered user: ${email} with GHL contact: ${ghlContactId}`);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during registration'
    });
  }
});

/**
 * POST /auth/login
 * Enhanced login with database authentication
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email and password are required'
      });
    }

    // Verify user credentials
    const dbUser = await databaseService.verifyPassword(email, password);
    if (!dbUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (dbUser.status !== 'active') {
      return res.status(403).json({
        error: 'Account not active',
        message: 'Please complete your registration and payment',
        userStatus: dbUser.status
      });
    }

    // Enrich user with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

    // Create session
    const session = await authSessionService.createSession(user.id, 'access_token', 3600);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        businessName: user.businessName,
        role: user.role,
        status: user.status,
        membershipTier: user.membershipTier
      },
      session: {
        sessionId: session.id,
        expiresAt: session.expiresAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during login'
    });
  }
});

/**
 * POST /auth/payment-webhook
 * Handle payment completion webhook from GoHighLevel
 */
router.post('/payment-webhook', async (req, res) => {
  try {
    const { contactId, paymentId, amount, status, membershipTier } = req.body;

    if (status === 'completed' || status === 'success') {
      // Find user by GHL contact ID
      const user = await databaseService.getUserByGhlContactId(contactId);
      
      if (!user) {
        console.error(`User not found for contact ID: ${contactId}`);
        return res.status(404).json({
          error: 'User not found for contact'
        });
      }

      // Update user status to active (payment status is now tracked in GHL)
      await databaseService.updateUserStatus(user.id, 'active');

      // Activate member in GoHighLevel
      await ghlService.handlePaymentSuccess(contactId, {
        paymentId,
        amount,
        membershipTier: membershipTier
      });

      console.log(`Payment completed for user ${user.email} (${contactId})`);

      res.json({
        message: 'Payment processed successfully',
        userId: user.id,
        status: 'active'
      });
    } else {
      res.json({
        message: 'Payment status received',
        status
      });
    }

  } catch (error) {
    console.error('Payment webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process payment webhook'
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

    // Find the user in database (auth fields only)
    const dbUser = await databaseService.getUserById(parseInt(userId));
    if (!dbUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Enrich user with profile data from GoHighLevel
    const user = await enrichUserWithGhlData(dbUser);

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
      membershipTier: user.membershipTier,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile'
    });
  }
});

/**
 * POST /auth/verify-contact
 * Verify if a contact exists in GoHighLevel
 */
router.post('/verify-contact', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if user already exists in our database
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Account already exists',
        message: 'An account with this email address already exists. Please sign in instead.'
      });
    }

    // Search for contact in GoHighLevel with improved error handling
    let contact = null;
    let hasGhlError = false;
    
    try {
      contact = await ghlService.findContactByEmail(email);
    } catch (ghlError) {
      console.error('Error searching GoHighLevel:', ghlError);
      hasGhlError = true;
      // Log the error but don't expose it to prevent information leakage
      console.error('GoHighLevel API error during contact verification:', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email in logs
        error: ghlError.message,
        timestamp: new Date().toISOString()
      });
    }

    // If there was a GoHighLevel error, return a generic server error
    if (hasGhlError) {
      return res.status(500).json({
        error: 'Service temporarily unavailable',
        message: 'Unable to verify contact at this time. Please try again in a few moments.'
      });
    }

    // If contact exists, check if they have active membership and valid renewal date
    if (contact) {
      const { isActive, reason } = await ghlService.isUserActive(email);
      
      if (!isActive) {
        return res.status(403).json({
          error: 'access_denied',
          error_description: reason || 'Account is not active'
        });
      }
    }

    const result = {
      exists: !!contact,
      contact: contact ? {
        id: contact.id,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email,
        phone: contact.phone || '',
        businessName: contact.customFields?.['Business Name'] || contact.businessName || '',
        website: contact.website || ''
      } : null
    };

    res.json(result);

  } catch (error) {
    console.error('Contact verification error:', error);
    res.status(500).json({
      error: 'Service temporarily unavailable',
      message: 'Unable to verify contact at this time. Please try again in a few moments.'
    });
  }
});

/**
 * POST /auth/send-confirmation
 * Send email confirmation code
 */
router.post('/send-confirmation', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Generate 6-digit confirmation code
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code temporarily (in production, use Redis or similar)
    // For now, we'll store it in memory with expiration
    const confirmationData = {
      email,
      code: confirmationCode,
      expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    
    // In a real implementation, you'd store this in Redis or a database
    // For demo purposes, we'll store in a temporary in-memory store
    global.confirmationCodes = global.confirmationCodes || new Map();
    global.confirmationCodes.set(email, confirmationData);

    // Send confirmation email with timeout
    let emailSent = false;
    try {
      console.log(`📤 Attempting to send confirmation email to ${email}...`);
      
      // Add a timeout wrapper to prevent hanging (reduced to 15 seconds)
      const emailPromise = emailService.sendConfirmationCode(email, confirmationCode);
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout after 15 seconds')), 15000)
      );
      
      emailSent = await Promise.race([emailPromise, timeoutPromise]);
      
      if (!emailSent) {
        console.error(`❌ Email service returned false for ${email}`);
        console.error('   This usually means:');
        console.error('   - Email transporter not initialized (check EMAIL_* env vars)');
        console.error('   - SMTP connection failed');
        console.error('   - Invalid credentials');
      } else {
        console.log(`✅ Confirmation email sent successfully to ${email}`);
      }
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
      console.error(`❌ Email sending error for ${email}:`, errorMessage);
      if (errorMessage.includes('timeout')) {
        console.error('   SMTP server not responding - check SMTP_HOST and firewall');
      }
    }
    
    // In development mode, also log the code for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log(`📧 [DEV] Confirmation code for ${email}: ${confirmationCode}`);
      console.log(`📧 [DEV] Email sent status: ${emailSent}`);
    }
    
    // Always return success to prevent email enumeration attacks
    // But in development, include debug info
    res.json({
      message: 'Confirmation code sent successfully',
      ...(isDevelopment && { 
        code: confirmationCode,
        emailSent: emailSent,
        debug: {
          provider: process.env.EMAIL_PROVIDER || 'smtp',
          host: process.env.SMTP_HOST || 'not set',
          hasCredentials: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
        }
      })
    });

  } catch (error) {
    console.error('Send confirmation error:', error);
    res.status(500).json({
      error: 'Failed to send confirmation code',
      message: 'Please try again later'
    });
  }
});

/**
 * POST /auth/verify-confirmation
 * Verify email confirmation code
 */
router.post('/verify-confirmation', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email and code are required'
      });
    }

    // Retrieve stored confirmation data
    const confirmationData = global.confirmationCodes?.get(email);
    
    if (!confirmationData) {
      return res.status(400).json({
        error: 'Invalid or expired code',
        message: 'Please request a new confirmation code'
      });
    }

    // Check if code has expired
    if (Date.now() > confirmationData.expiresAt) {
      global.confirmationCodes.delete(email);
      return res.status(400).json({
        error: 'Code expired',
        message: 'Please request a new confirmation code'
      });
    }

    // Verify the code
    if (confirmationData.code !== code) {
      return res.status(400).json({
        error: 'Invalid code',
        message: 'Please check your code and try again'
      });
    }

    // Code is valid - remove it from storage
    global.confirmationCodes.delete(email);

    res.json({
      message: 'Email confirmed successfully'
    });

  } catch (error) {
    console.error('Verify confirmation error:', error);
    res.status(500).json({
      error: 'Failed to verify confirmation code',
      message: 'Please try again later'
    });
  }
});

/**
 * POST /auth/register-existing
 * Registration for users with existing GoHighLevel contacts
 */
router.post('/register-existing', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      businessName, 
      phone, 
      website,
      existingContactId,
      isExistingContact = false,
      membershipTier = 'standard'
    } = req.body;

    // Validate required fields (only email and password are required)
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email and password are required'
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
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists in our database
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email address already exists'
      });
    }

    // If registering with an existing contact, verify they have active membership
    if (isExistingContact && existingContactId) {
      const { isActive, reason } = await ghlService.isUserActive(email);
      
      if (!isActive) {
        return res.status(403).json({
          error: 'access_denied',
          error_description: reason || 'Account is not active'
        });
      }
    }

    let ghlContactId = existingContactId;

    // If no existing contact, create one in GoHighLevel
    if (!isExistingContact || !existingContactId) {
      try {
        console.log('🔍 Creating new GHL contact for existing member registration...');
        ghlContactId = await ghlService.createContact({
          firstName,
          lastName,
          email,
          phone,
          website,
          businessName,
          source: 'RAC Membership App Registration',
          tags: ['registered'],
          customFields: {
            'Business Name': businessName || '',
            'Registration Date': new Date().toISOString()
          }
        });
        console.log('✅ New GHL contact created:', ghlContactId);
      } catch (ghlError) {
        console.error('❌ Failed to create GHL contact:', ghlError);
        return res.status(500).json({
          error: 'Failed to create contact in CRM',
          message: 'Please try again later or contact support'
        });
      }
    } else {
      // Update existing contact with registration info
      try {
        console.log('🔄 Updating existing GHL contact:', existingContactId);
        await ghlService.updateContactTags(existingContactId, [
          'registered'
        ], 'add');
        
        // Update contact custom fields
        await ghlService.updateContact(existingContactId, {
          firstName,
          lastName,
          phone,
          website,
          businessName,
          customFields: {
            'Business Name': businessName || '',
            'Registration Date': new Date().toISOString()
          }
        });
        console.log('✅ Existing GHL contact updated');
      } catch (ghlError) {
        console.error('❌ Failed to update existing GHL contact:', ghlError);
        // Continue with registration even if GHL update fails
      }
    }

    // Create user in database
    let user;
    try {
      user = await databaseService.createUser({
        email,
        passwordHash: password, // This will be hashed in the service
        role: 'member',
        status: 'pending',
        emailVerified: false,
        ghlContactId
      });
    } catch (dbError) {
      console.error('Failed to create user in database:', dbError);
      return res.status(500).json({
        error: 'Failed to create user account',
        message: 'Please try again later or contact support'
      });
    }

    // Create payment link
    const tierConfig = MEMBERSHIP_TIERS[membershipTier];
    let paymentLink;
    
    try {
      paymentLink = await ghlService.createPaymentLink({
        contactId: ghlContactId,
        amount: tierConfig.price,
        currency: tierConfig.currency,
        description: tierConfig.description,
        membershipTier,
        successUrl: `${process.env.FRONTEND_URL}/auth/payment-success`,
        cancelUrl: `${process.env.FRONTEND_URL}/auth/payment-cancelled`
      });
    } catch (paymentError) {
      console.error('Failed to create payment link:', paymentError);
      // Continue without payment link for now
      paymentLink = null;
    }

    // Enrich user with profile data from GoHighLevel
    const enrichedUser = await enrichUserWithGhlData(user);

    // Return registration success response
    res.status(201).json({
      message: 'Registration successful',
      registrationType: isExistingContact ? 'existing-contact' : 'new-contact',
      user: {
        id: enrichedUser.id,
        firstName: enrichedUser.firstName,
        lastName: enrichedUser.lastName,
        email: enrichedUser.email,
        businessName: enrichedUser.businessName,
        phone: enrichedUser.phone,
        website: enrichedUser.website,
        role: enrichedUser.role,
        status: enrichedUser.status,
        membershipTier: enrichedUser.membershipTier,
        ghlContactId: enrichedUser.ghlContactId
      },
      payment: {
        required: true,
        amount: tierConfig.price,
        currency: tierConfig.currency,
        description: tierConfig.description,
        link: paymentLink
      },
      nextSteps: [
        'Complete payment to activate membership',
        'Check email for payment confirmation',
        'Access member portal after payment verification'
      ]
    });

    console.log(`Successfully registered existing member: ${email} with GHL contact: ${ghlContactId}`);

  } catch (error) {
    console.error('Existing member registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Please try again later or contact support'
    });
  }
});

/**
 * GET /auth/test-email
 * Test email service configuration
 */
router.get('/test-email', async (req, res) => {
  try {
    console.log('🔍 Testing email service configuration...');
    
    // Check environment variables
    const envCheck = {
      EMAIL_PROVIDER: !!process.env.EMAIL_PROVIDER,
      EMAIL_FROM: !!process.env.EMAIL_FROM,
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SENDGRID_API_KEY: !!process.env.SENDGRID_API_KEY,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
    };
    
    console.log('Environment variables status:', envCheck);
    
    const connectionTest = await emailService.testConnection();
    
    if (!connectionTest) {
      console.error('❌ Email connection test failed');
      return res.status(500).json({
        error: 'Email service not configured',
        message: 'Please check your email environment variables',
        debug: {
          provider: process.env.EMAIL_PROVIDER || 'not set',
          envVariables: envCheck,
          suggestion: 'Check that SMTP_HOST, SMTP_USER, and SMTP_PASS are set correctly'
        }
      });
    }

    console.log('✅ Email connection test passed');
    res.json({
      message: 'Email service is configured correctly',
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      fromEmail: process.env.EMAIL_FROM || 'noreply@racc.com',
      config: {
        host: process.env.SMTP_HOST || 'not set',
        port: process.env.SMTP_PORT || 'not set',
        hasCredentials: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Email test error:', errorMessage);
    res.status(500).json({
      error: 'Email service test failed',
      message: errorMessage,
      hint: 'Check server logs for detailed error information'
    });
  }
});

/**
 * POST /auth/forgot-password
 * Send password reset email
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Check if user exists
    const user = await databaseService.getUserByEmail(email);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        message: 'If an account exists with that email, a password reset link has been sent'
      });
    }

    // Generate reset token (cryptographically secure random string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await databaseService.updateUser(user.id!, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: resetTokenExpiry
    });

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Hi ${user.firstName || 'there'},</p>
        <p>We received a request to reset your password for your Richfield Area Chamber of Commerce account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Richfield Area Chamber of Commerce<br>
          This is an automated email, please do not reply.
        </p>
      </div>
    `;

    const emailText = `
Reset Your Password

Hi ${user.firstName || 'there'},

We received a request to reset your password for your Richfield Area Chamber of Commerce account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

Richfield Area Chamber of Commerce
This is an automated email, please do not reply.
    `;

    const emailSent = await emailService.sendEmail({
      to: email,
      subject: 'Reset Your Password - RACC',
      html: emailHtml,
      text: emailText
    });

    if (!emailSent) {
      console.error('Failed to send password reset email');
      return res.status(500).json({
        error: 'Failed to send email',
        message: 'Unable to send password reset email. Please try again later.'
      });
    }

    console.log(`Password reset email sent to: ${email}`);
    res.json({
      message: 'If an account exists with that email, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

/**
 * POST /auth/reset-password
 * Reset password using token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Token and password are required'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find user by reset token
    const user = await databaseService.getUserByResetToken(token);
    
    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Check if token has expired
    if (user.passwordResetTokenExpiry && new Date() > user.passwordResetTokenExpiry) {
      return res.status(400).json({
        error: 'Token expired',
        message: 'Password reset token has expired. Please request a new one.'
      });
    }

    // Update password and clear reset token
    await databaseService.updateUserPassword(user.id!, password);
    await databaseService.updateUser(user.id!, {
      passwordResetToken: null,
      passwordResetTokenExpiry: null
    });

    console.log(`Password reset successful for user: ${user.email}`);
    
    res.json({
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

/**
 * POST /auth/change-password
 * Change password for authenticated user
 */
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Please sign in to change your password'
      });
    }

    const token = authHeader.substring(7);
    const session = await authSessionService.getSessionByToken(token);

    if (!session || new Date() > new Date(session.expiresAt)) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session expired. Please sign in again.'
      });
    }

    // Use memberId from session (not userId)
    const userId = session.memberId || session.userId;
    const user = await databaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find your account'
      });
    }

    // Verify current password
    const isValid = await databaseService.verifyPassword(user.email, currentPassword);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Current password is incorrect'
      });
    }

    // Update to new password
    await databaseService.updateUserPassword(user.id!, newPassword);

    console.log(`Password changed successfully for user: ${user.email}`);
    
    res.json({
      message: 'Password has been changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

export default router;