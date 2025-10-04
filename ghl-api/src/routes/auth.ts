// Enhanced Auth routes with Database and GoHighLevel Integration

import express from 'express';
import crypto from 'crypto';
import { authSessionService } from '@/services/authSession';
import { databaseService } from '@/services/database';
import { ghlService } from '@/services/gohighlevel';
import { emailService } from '@/services/emailService';

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
      redirectUri 
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
    const user = await databaseService.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Invalid email or password'
      });
    }

    // Check if user has "active" tag in GoHighLevel
    console.log(`🔍 Checking GoHighLevel active status for user: ${email}`);
    const { isActive, contact } = await ghlService.isUserActive(email);
    
    if (!isActive) {
      console.log(`❌ User ${email} does not have 'active' tag in GoHighLevel`);
      return res.status(403).json({
        error: 'access_denied',
        error_description: 'Account not active. Please ensure your membership is current and you have the "active" tag in GoHighLevel.',
        userStatus: 'inactive',
        requiresActivation: true
      });
    }

    console.log(`✅ User ${email} verified as active in GoHighLevel`);

    // Update local database status to match GoHighLevel if needed
    if (user.status !== 'active') {
      try {
        await databaseService.updateUserStatus(user.id!, 'active');
        console.log(`📝 Updated local database status to 'active' for user ${email}`);
      } catch (updateError) {
        console.error('Failed to update user status in database:', updateError);
        // Continue with auth even if database update fails
      }
    }

    // Generate authorization code
    const authCode = crypto.randomBytes(32).toString('base64url');
    
    // Store authorization code with PKCE data
    authorizationCodes.set(authCode, {
      userId: user.id!,
      codeChallenge,
      codeChallengeMethod,
      redirectUri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    console.log(`✅ Authorization code generated for user ${user.email}`);

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

    // Get user data
    const user = await databaseService.getUserById(authData.userId);
    if (!user) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'User not found'
      });
    }

    // Create session and generate tokens
    const accessToken = authSessionService.generateAccessToken(user.id);
    const session = await authSessionService.createSession(user.id!, accessToken, 3600, user); // Pass complete user data
    
    console.log(`✅ Access token generated for user ${user.email}:`, accessToken);
    console.log(`✅ Session created:`, { sessionId: session.id, expiresAt: session.expiresAt });

    res.json({
      access_token: session.token,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
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
    const { code, codeVerifier, code_verifier, email, password, codeChallenge, codeChallengeMethod } = req.body;
    
    // Support both camelCase and snake_case for flexibility
    const verifier = codeVerifier || code_verifier;
    
    console.log('🔍 Session request received:', {
      hasCode: !!code,
      hasCodeVerifier: !!verifier,
      hasEmail: !!email,
      hasPassword: !!password,
      hasCodeChallenge: !!codeChallenge
    });
    
    // If no code but has email/password/codeChallenge, do the full flow
    if (!code && email && password && codeChallenge && verifier) {
      console.log('🔄 No code provided, performing full PKCE flow...');
      
      // Step 1: Authenticate and get authorization code
      const user = await databaseService.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({
          error: 'invalid_grant',
          error_description: 'Invalid email or password'
        });
      }

      // Check if user has "active" tag in GoHighLevel
      console.log(`🔍 Checking GoHighLevel active status for user: ${email}`);
      const { isActive, contact } = await ghlService.isUserActive(email);
      
      if (!isActive) {
        console.log(`❌ User ${email} does not have 'active' tag in GoHighLevel`);
        return res.status(403).json({
          error: 'access_denied',
          error_description: 'Account not active. Please ensure your membership is current and you have the "active" tag in GoHighLevel.',
          userStatus: 'inactive',
          requiresActivation: true
        });
      }

      console.log(`✅ User ${email} verified as active in GoHighLevel`);

      // Update local database status to match GoHighLevel if needed
      if (user.status !== 'active') {
        try {
          await databaseService.updateUserStatus(user.id!, 'active');
          console.log(`📝 Updated local database status to 'active' for user ${email}`);
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

      // Create session directly (skip authorization code step)
      const accessToken = authSessionService.generateAccessToken(user.id);
      const session = await authSessionService.createSession(user.id!, accessToken, 3600);
      
      console.log(`✅ Direct session created for user ${user.email}`);

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

    // Get user data
    const user = await databaseService.getUserById(authData.userId);
    if (!user) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'User not found'
      });
    }

    // Create session and generate tokens
    const accessToken = authSessionService.generateAccessToken(user.id);
    const session = await authSessionService.createSession(user.id!, accessToken, 3600); // 1 hour
    
    console.log(`✅ Session created for user ${user.email} via /session endpoint`);

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
    const user = await databaseService.getUserById(session.memberId);
    if (!user) {
      return res.status(401).json({
        error: 'user_not_found',
        error_description: 'User associated with session not found'
      });
    }

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
    
    console.log(`🔍 Profile request - Token received:`, token);
    
    // Check if session exists and is valid
    const session = await authSessionService.getSessionByToken(token);
    
    console.log(`🔍 Session lookup result:`, session ? { id: session.id, expiresAt: session.expiresAt } : 'null');
    
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

    // Get user data
    const user = await databaseService.getUserById(session.memberId);
    if (!user) {
      return res.status(401).json({
        error: 'user_not_found',
        error_description: 'User associated with session not found'
      });
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
      role: user.role,
      status: user.status,
      membershipTier: user.membershipTier,
      emailVerified: user.emailVerified,
      ghlContactId: user.ghlContactId,
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
        console.log(`✅ Session invalidated for user: ${session.memberId}`);
      }
    } catch (sessionError) {
      // If session doesn't exist or is already invalid, that's fine for logout
      console.log('Session not found or already invalid during logout');
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

    // Create GoHighLevel contact first
    let ghlContactId;
    try {
      console.log('🔍 Starting GHL contact creation process...');
      ghlContactId = await ghlService.createContact({
        firstName,
        lastName,
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

    // Create user in database
    let user;
    try {
      user = await databaseService.createUser({
        firstName,
        lastName,
        email,
        passwordHash: password, // This will be hashed in the service
        businessName,
        phone,
        website,
        role: 'member',
        status: 'pending',
        emailVerified: false,
        ghlContactId,
        paymentStatus: 'pending',
        membershipTier
      });
    } catch (dbError) {
      console.error('Failed to create user in database:', dbError);
      
      // Try to clean up GHL contact if database creation failed
      try {
        // Note: GoHighLevel doesn't have a direct delete API, so we'll tag as failed
        await ghlService.updateContactTags(ghlContactId, ['registration-failed'], 'add');
      } catch (cleanupError) {
        console.error('Failed to cleanup GHL contact:', cleanupError);
      }
      
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

    // Return registration success response
    res.status(201).json({
      message: 'Registration successful',
      user: {
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
        ghlContactId: user.ghlContactId
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
    const user = await databaseService.verifyPassword(email, password);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Account not active',
        message: 'Please complete your registration and payment',
        userStatus: user.status
      });
    }

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
      const users = await databaseService.getAllUsers(1000); // Get all users for search
      const user = users.find(u => u.ghlContactId === contactId);
      
      if (!user) {
        console.error(`User not found for contact ID: ${contactId}`);
        return res.status(404).json({
          error: 'User not found for contact'
        });
      }

      // Update user payment status
      await databaseService.updateUserPaymentStatus(user.id, 'completed', membershipTier);
      await databaseService.updateUserStatus(user.id, 'active');

      // Activate member in GoHighLevel
      await ghlService.handlePaymentSuccess(contactId, {
        paymentId,
        amount,
        membershipTier: membershipTier || user.membershipTier
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

    // Find the user in database
    const user = await databaseService.getUserById(parseInt(userId));
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

    // Send confirmation email
    try {
      const emailSent = await emailService.sendConfirmationCode(email, confirmationCode);
      
      if (!emailSent) {
        // Email sending failed, but we'll still return success to prevent information leakage
        console.error(`Failed to send confirmation email to ${email}`);
      } else {
        console.log(`✅ Confirmation email sent successfully to ${email}`);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue anyway - don't fail the request due to email issues
    }
    
    // In development mode, also log the code for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log(`📧 [DEV] Confirmation code for ${email}: ${confirmationCode}`);
    }
    
    res.json({
      message: 'Confirmation code sent successfully',
      ...(isDevelopment && { code: confirmationCode }) // Only include in development
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
          source: 'RACC Existing Member Registration',
          tags: ['prospect', 'existing-member-registration', `tier-${membershipTier}`],
          customFields: {
            'Business Name': businessName || '',
            'Registration Date': new Date().toISOString(),
            'Member Status': 'pending-payment',
            'Membership Tier': membershipTier,
            'Registration Type': 'existing-member'
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
          'existing-member-registration',
          `tier-${membershipTier}`,
          'prospect'
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
            'Registration Date': new Date().toISOString(),
            'Member Status': 'pending-payment',
            'Membership Tier': membershipTier,
            'Registration Type': 'existing-member'
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
        firstName,
        lastName,
        email,
        passwordHash: password, // This will be hashed in the service
        businessName,
        phone,
        website,
        role: 'member',
        status: 'pending',
        emailVerified: false,
        ghlContactId,
        paymentStatus: 'pending',
        membershipTier
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

    // Return registration success response
    res.status(201).json({
      message: 'Registration successful',
      registrationType: isExistingContact ? 'existing-contact' : 'new-contact',
      user: {
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
        ghlContactId: user.ghlContactId
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
    const connectionTest = await emailService.testConnection();
    
    if (!connectionTest) {
      return res.status(500).json({
        error: 'Email service not configured',
        message: 'Please check your email environment variables'
      });
    }

    res.json({
      message: 'Email service is configured correctly',
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      fromEmail: process.env.EMAIL_FROM || 'noreply@racc.com'
    });

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      error: 'Email service test failed',
      message: error.message
    });
  }
});

export default router;