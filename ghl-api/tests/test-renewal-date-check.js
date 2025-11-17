/**
 * Test script to verify renewal date checking logic
 * Tests the isUserActive method with different renewal date scenarios
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = 'http://localhost:3000/api';

// Helper to print colored output
const log = (message, color = 'white') => {
  const colors = {
    red: chalk.red,
    green: chalk.green,
    yellow: chalk.yellow,
    blue: chalk.blue,
    cyan: chalk.cyan,
    white: chalk.white
  };
  console.log(colors[color](message));
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logInfo = (message) => log(`ℹ️  ${message}`, 'cyan');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logStep = (step, message) => log(`\n📍 Step ${step}: ${message}`, 'blue');

/**
 * Test login with different renewal date scenarios
 */
async function testRenewalDateCheck() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 Testing Renewal Date Check Logic', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  const testCases = [
    {
      name: 'Valid Renewal - Within 13 months',
      email: 'valid-renewal@test.com',
      password: 'testpass123',
      description: 'User with renewal date less than 13 months ago'
    },
    {
      name: 'Expired Renewal - Over 13 months',
      email: 'expired-renewal@test.com',
      password: 'testpass123',
      description: 'User with renewal date more than 13 months ago'
    },
    {
      name: 'No Renewal Date',
      email: 'no-renewal@test.com',
      password: 'testpass123',
      description: 'User without a renewal date set'
    },
    {
      name: 'Active Tag But Expired',
      email: 'active-but-expired@test.com',
      password: 'testpass123',
      description: 'User with active tag but expired renewal date'
    }
  ];

  logInfo('Note: These tests require actual GoHighLevel contacts with appropriate data');
  logInfo('In development mode, all checks will pass (mock responses)');
  logInfo('');

  for (const testCase of testCases) {
    logStep('Test', testCase.name);
    logInfo(`Description: ${testCase.description}`);
    logInfo(`Email: ${testCase.email}`);

    try {
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Try to authorize
      logInfo('Attempting authorization...');
      const authResponse = await axios.post(`${BASE_URL}/auth/authorize`, {
        email: testCase.email,
        password: testCase.password,
        codeChallenge: codeChallenge,
        codeChallengeMethod: 'S256',
        remember: false
      });

      if (authResponse.status === 200) {
        logSuccess('Authorization successful - User is active with valid renewal');
        logInfo(`User ID: ${authResponse.data.user?.id}`);
        logInfo(`Email: ${authResponse.data.user?.email}`);
      }

    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 403) {
          logWarning('Authorization denied - Account not active');
          logInfo(`Error: ${data.error}`);
          logInfo(`Description: ${data.error_description}`);
          if (data.reason) {
            logInfo(`Reason: ${data.reason}`);
          }
        } else if (status === 401) {
          logError('Invalid credentials');
          logInfo(`Error: ${data.error_description || data.error}`);
        } else {
          logError(`Unexpected error (${status}): ${data.error_description || data.error}`);
        }
      } else {
        logError(`Network error: ${error.message}`);
      }
    }
  }

  log('\n' + '='.repeat(60), 'cyan');
  log('🏁 Test Complete', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
}

/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  require('crypto').randomFillSync(array);
  return Buffer.from(array)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generate a code challenge from the verifier
 */
async function generateCodeChallenge(verifier) {
  const hash = require('crypto')
    .createHash('sha256')
    .update(verifier)
    .digest('base64');
  
  return hash
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// Run the test
testRenewalDateCheck().catch(error => {
  logError('Fatal error running tests:');
  console.error(error);
  process.exit(1);
});
