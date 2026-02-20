/**
 * Enhanced Registration Route with Database and GoHighLevel Integration
 * Implements PKCE OAuth 2.0 flow with proper user management
 */

import express from 'express';
import { databaseService } from '@/services/database';
import { ghlService } from '@/services/gohighlevel';
import { authSessionService } from '@/services/authSession';

const router = express.Router();

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
 * POST /api/auth/register
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
    } catch (ghlError) {
      console.error('Failed to create GHL contact:', ghlError);
      return res.status(500).json({
        error: 'Failed to create contact in CRM',
        message: 'Please try again later or contact support'
      });
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
        ghlContactId,
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
 * POST /api/auth/verify-email
 * Email verification endpoint
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'email and verificationCode are required'
      });
    }

    // TODO: Implement actual email verification logic
    // For now, mark as verified
    const user = await databaseService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Update user as email verified
    await databaseService.updateUserStatus(user.id, 'verified');

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        status: 'verified'
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to verify email'
    });
  }
});

/**
 * POST /api/auth/payment-webhook
 * Handle payment completion webhook from GoHighLevel
 */
// router.post('/payment-webhook', async (req, res) => {
//   try {
//     const { contactId, paymentId, amount, status, membershipTier } = req.body;

//     if (status === 'completed' || status === 'success') {
//       // Find user by GHL contact ID
//       const users = await databaseService.getAllUsers(1000); // Get all users for search
//       const user = users.find(u => u.ghlContactId === contactId);
      
//       if (!user) {
//         console.error(`User not found for contact ID: ${contactId}`);
//         return res.status(404).json({
//           error: 'User not found for contact'
//         });
//       }

//       // Update user payment status
//       await databaseService.updateUserPaymentStatus(user.id, 'completed', membershipTier);
//       await databaseService.updateUserStatus(user.id, 'active');

//       // Activate member in GoHighLevel
//       await ghlService.handlePaymentSuccess(contactId, {
//         paymentId,
//         amount,
//         membershipTier: membershipTier || user.membershipTier
//       });

//       console.log(`Payment completed for user ${user.email} (${contactId})`);

//       res.json({
//         message: 'Payment processed successfully',
//         userId: user.id,
//         status: 'active'
//       });
//     } else {
//       res.json({
//         message: 'Payment status received',
//         status
//       });
//     }

//   } catch (error) {
//     console.error('Payment webhook error:', error);
//     res.status(500).json({
//       error: 'Internal server error',
//       message: 'Failed to process payment webhook'
//     });
//   }
// });

/**
 * GET /api/auth/membership-tiers
 * Get available membership tiers
 */
router.get('/membership-tiers', (req, res) => {
  res.json({
    tiers: MEMBERSHIP_TIERS
  });
});

/**
 * POST /api/auth/login
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
    const session = await authSessionService.createSession(user.id, 'access_token', 24 * 3600);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
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

export default router;