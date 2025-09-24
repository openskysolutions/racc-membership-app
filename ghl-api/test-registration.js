/**
 * Test script for registration functionality
 * Tests the complete registration flow including database and GoHighLevel integration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistration() {
  console.log('🧪 Testing RACC Membership Registration Flow\n');

  try {
    // Test 1: Get membership tiers
    console.log('1. Testing membership tiers endpoint...');
    const tiersResponse = await axios.get(`${API_BASE_URL}/auth/membership-tiers`);
    console.log('✅ Membership tiers retrieved:', Object.keys(tiersResponse.data.tiers));
    console.log();

    // Test 2: Register new user
    console.log('2. Testing user registration...');
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: `test.user.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      businessName: 'Test Business LLC',
      phone: '+1-555-123-4567',
      website: 'https://testbusiness.com',
      membershipTier: 'standard'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log('✅ User registered successfully!');
    console.log('📧 User email:', registerResponse.data.user.email);
    console.log('🏷️ GHL Contact ID:', registerResponse.data.user.ghlContactId);
    console.log('💰 Membership tier:', registerResponse.data.user.membershipTier);
    console.log('💳 Payment required:', registerResponse.data.payment.required);
    
    if (registerResponse.data.payment.paymentLink) {
      console.log('🔗 Payment link:', registerResponse.data.payment.paymentLink);
    }
    console.log();

    // Test 3: Try to register same user (should fail)
    console.log('3. Testing duplicate registration prevention...');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, testUser);
      console.log('❌ FAILED: Duplicate registration should have been prevented');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate registration correctly prevented');
      } else {
        console.log('⚠️ Unexpected error preventing duplicate:', error.message);
      }
    }
    console.log();

    // Test 4: Test login with pending user
    console.log('4. Testing login with pending user...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('❌ FAILED: Login should have been prevented for pending user');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Login correctly prevented for pending user');
        console.log('📝 User status:', error.response.data.userStatus);
      } else {
        console.log('⚠️ Unexpected error during login:', error.message);
      }
    }
    console.log();

    // Test 5: Simulate payment completion
    console.log('5. Testing payment webhook simulation...');
    try {
      await axios.post(`${API_BASE_URL}/auth/payment-webhook`, {
        contactId: registerResponse.data.user.ghlContactId,
        paymentId: `pay_${Date.now()}`,
        amount: 50.00,
        status: 'completed',
        membershipTier: 'standard'
      });
      console.log('✅ Payment webhook processed successfully');
    } catch (error) {
      console.log('⚠️ Payment webhook error:', error.response?.data || error.message);
    }
    console.log();

    // Test 6: Test login with activated user
    console.log('6. Testing login with activated user...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful for activated user!');
      console.log('👤 User status:', loginResponse.data.user.status);
      console.log('🎫 Session ID:', loginResponse.data.session.sessionId);
    } catch (error) {
      console.log('❌ Login failed for activated user:', error.response?.data || error.message);
    }
    console.log();

    console.log('🎉 Registration flow testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Details:', error.response.data.details || error.response.data.message);
    }
  }
}

// Run the test
if (require.main === module) {
  testRegistration().then(() => {
    console.log('\n📊 Test completed. Check the server logs for detailed GoHighLevel integration logs.');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testRegistration };