// Quick test to debug the registration issue
const axios = require('axios');

async function debugRegistration() {
  try {
    console.log('Testing registration with detailed logging...');
    
    const testUser = {
      firstName: 'Debug',
      lastName: 'Test',
      email: `debug.${Date.now()}@example.com`,
      password: 'TestPassword123!',
      membershipTier: 'standard'
    };
    
    console.log('Sending request with data:', JSON.stringify(testUser, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/auth/register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status < 600; // Don't throw for any HTTP status
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Request error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}

debugRegistration();