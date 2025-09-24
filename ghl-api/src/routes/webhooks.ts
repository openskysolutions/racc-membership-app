/**
 * Webhook endpoints for GoHighLevel payment notifications
 */

import { Router, Request, Response } from 'express';
import { ghlService } from '../services/gohighlevel.js';
import { databaseService } from '../services/database.js';

const router = Router();

/**
 * GoHighLevel payment success webhook
 * This endpoint receives notifications when payments are completed
 */
router.post('/ghl/payment/success', async (req: Request, res: Response) => {
  try {
    console.log('🎉 Payment success webhook received:', JSON.stringify(req.body, null, 2));
    
    const { contactId, orderId, amount, currency, membershipTier, paymentId } = req.body;
    
    if (!contactId) {
      return res.status(400).json({ error: 'Missing contactId in webhook payload' });
    }

    // Find the user by GHL contact ID
    const user = await databaseService.getUserByGhlContactId(contactId);
    if (!user) {
      console.error('User not found for GHL contact ID:', contactId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle payment success in GoHighLevel
    await ghlService.handlePaymentSuccess(contactId, {
      orderId,
      amount: amount || 0,
      currency: currency || 'USD',
      membershipTier: membershipTier || user.membershipTier,
      paymentId: paymentId || orderId
    });

    // Update user status to active in database
    await databaseService.updateUserStatus(user.id, 'active');

    console.log(`✅ Payment processed successfully for user ${user.email} (${contactId})`);

    res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      userId: user.id,
      contactId: contactId
    });

  } catch (error: any) {
    console.error('❌ Error processing payment webhook:', error);
    res.status(500).json({ 
      error: 'Payment processing failed', 
      message: error.message 
    });
  }
});

/**
 * GoHighLevel payment failed webhook
 */
router.post('/ghl/payment/failed', async (req: Request, res: Response) => {
  try {
    console.log('❌ Payment failed webhook received:', JSON.stringify(req.body, null, 2));
    
    const { contactId, orderId, reason } = req.body;
    
    if (!contactId) {
      return res.status(400).json({ error: 'Missing contactId in webhook payload' });
    }

    // Find the user by GHL contact ID  
    const user = await databaseService.getUserByGhlContactId(contactId);
    if (!user) {
      console.error('User not found for GHL contact ID:', contactId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the failure
    console.log(`💳 Payment failed for user ${user.email} (${contactId}): ${reason || 'Unknown reason'}`);

    // Optionally update user status or add notes
    // await ghlService.addNote(contactId, `Payment failed: ${reason || 'Unknown reason'}`, 'payment_failure');

    res.json({ 
      success: true, 
      message: 'Payment failure recorded',
      userId: user.id,
      contactId: contactId
    });

  } catch (error: any) {
    console.error('❌ Error processing payment failure webhook:', error);
    res.status(500).json({ 
      error: 'Payment failure processing failed', 
      message: error.message 
    });
  }
});

/**
 * General GoHighLevel webhook endpoint
 * Can handle various types of notifications
 */
router.post('/ghl/webhook', async (req: Request, res: Response) => {
  try {
    console.log('📨 GHL webhook received:', {
      headers: req.headers,
      body: req.body
    });

    const { type, data } = req.body;

    switch (type) {
      case 'payment.completed':
      case 'order.completed':
        // Handle payment success
        if (data?.contactId) {
          const user = await databaseService.getUserByGhlContactId(data.contactId);
          if (user) {
            await ghlService.handlePaymentSuccess(data.contactId, data);
            await databaseService.updateUserStatus(user.id, 'active');
            console.log(`✅ Payment completed for user ${user.email}`);
          }
        }
        break;
        
      case 'payment.failed':
      case 'order.failed':
        // Handle payment failures
        console.log('Payment/order failed:', data);
        break;
        
      case 'subscription.created':
        console.log('Subscription created:', data);
        break;
        
      case 'subscription.cancelled':
        console.log('Subscription cancelled:', data);
        break;
        
      default:
        console.log('Unknown webhook type:', type);
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (error: any) {
    console.error('❌ Error processing GHL webhook:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed', 
      message: error.message 
    });
  }
});

/**
 * Test endpoint to simulate payment success (for development)
 */
router.post('/test/payment-success', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Test endpoint only available in development' });
  }

  try {
    const { contactId, membershipTier = 'standard' } = req.body;
    
    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    // Simulate payment success
    await ghlService.handlePaymentSuccess(contactId, {
      orderId: `test_${Date.now()}`,
      amount: membershipTier === 'premium' ? 100 : 50,
      currency: 'USD',
      membershipTier,
      paymentId: `test_payment_${Date.now()}`
    });

    // Find and activate user
    const user = await databaseService.getUserByGhlContactId(contactId);
    if (user) {
      await databaseService.updateUserStatus(user.id, 'active');
    }

    res.json({ 
      success: true, 
      message: 'Test payment success processed',
      contactId 
    });

  } catch (error: any) {
    console.error('❌ Error processing test payment:', error);
    res.status(500).json({ 
      error: 'Test payment processing failed', 
      message: error.message 
    });
  }
});

export default router;