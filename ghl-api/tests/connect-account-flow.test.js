/**
 * Connect Account Flow Tests
 * 
 * Tests the complete connect account flow including:
 * 1. Email verification against GoHighLevel contacts
 * 2. Confirmation code email sending
 * 3. Code verification
 * 4. Registration completion
 * 5. Email notifications throughout the process
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
// Don't set a default email - force user to provide one
const TEST_EMAIL = process.env.TEST_EMAIL || null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper to print colored output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Helper to prompt user input
function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Helper to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ConnectAccountFlowTest {
  constructor() {
    this.testEmail = TEST_EMAIL;
    this.confirmationCode = null;
    this.contactId = null;
    this.registrationData = {
      firstName: 'Test',
      lastName: 'User',
      businessName: 'Test Business Inc.',
      phone: '555-123-4567',
      website: 'https://testbusiness.com',
      password: 'TestPassword123!',
      membershipTier: 'standard'
    };
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async runTest(testName, testFn) {
    try {
      log(`\n▶️  Running: ${testName}`, 'blue');
      await testFn();
      this.results.passed++;
      this.results.details.push({ test: testName, status: 'PASSED' });
      logSuccess(`PASSED: ${testName}`);
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ 
        test: testName, 
        status: 'FAILED', 
        error: error.message,
        details: error.response?.data 
      });
      logError(`FAILED: ${testName}`);
      logError(`Error: ${error.message}`);
      if (error.response?.data) {
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  }

  async testEmailService() {
    logStep(0, 'Testing Email Service Configuration');
    
    const response = await axios.get(`${BASE_URL}/auth/test-email`);
    
    if (response.status === 200) {
      logSuccess('Email service is configured');
      logInfo(`Provider: ${response.data.provider}`);
      logInfo(`From Email: ${response.data.fromEmail}`);
    } else {
      throw new Error('Email service not properly configured');
    }
  }

  async testVerifyContact() {
    logStep(1, 'Verify Contact in GoHighLevel');
    
    logInfo(`Testing with email: ${this.testEmail}`);
    
    const response = await axios.post(`${BASE_URL}/auth/verify-contact`, {
      email: this.testEmail
    });

    if (response.status === 200) {
      const { exists, contact } = response.data;
      
      if (exists && contact) {
        logSuccess(`Contact found in GoHighLevel!`);
        logInfo(`Contact ID: ${contact.id}`);
        logInfo(`Email: ${contact.email}`);
        this.contactId = contact.id;
      } else {
        logWarning('Contact not found in GoHighLevel');
        logInfo('The system will allow registration as a new contact');
      }
    } else {
      throw new Error('Failed to verify contact');
    }
  }

  async testSendConfirmation() {
    logStep(2, 'Send Confirmation Code Email');
    
    const response = await axios.post(`${BASE_URL}/auth/send-confirmation`, {
      email: this.testEmail
    });

    if (response.status === 200) {
      logSuccess('Confirmation code sent successfully');
      
      // In development mode, the code is returned in the response
      if (response.data.code) {
        this.confirmationCode = response.data.code;
        logInfo(`Confirmation code (dev mode): ${this.confirmationCode}`);
      } else {
        logInfo('✉️  Check your email for the confirmation code');
      }
    } else {
      throw new Error('Failed to send confirmation code');
    }
  }

  async testVerifyConfirmation(code) {
    logStep(3, 'Verify Confirmation Code');
    
    const codeToVerify = code || this.confirmationCode;
    
    if (!codeToVerify) {
      throw new Error('No confirmation code available');
    }

    logInfo(`Verifying code: ${codeToVerify}`);
    
    const response = await axios.post(`${BASE_URL}/auth/verify-confirmation`, {
      email: this.testEmail,
      code: codeToVerify
    });

    if (response.status === 200) {
      logSuccess('Confirmation code verified successfully');
    } else {
      throw new Error('Failed to verify confirmation code');
    }
  }

  async testRegisterExisting() {
    logStep(4, 'Complete Registration');
    
    const registrationPayload = {
      ...this.registrationData,
      email: this.testEmail,
      confirmPassword: this.registrationData.password,
      existingContactId: this.contactId,
      isExistingContact: !!this.contactId
    };

    logInfo(`Registration type: ${this.contactId ? 'Existing Contact' : 'New Contact'}`);
    
    const response = await axios.post(`${BASE_URL}/auth/register-existing`, registrationPayload);

    if (response.status === 201) {
      logSuccess('Registration completed successfully!');
      logInfo(`User ID: ${response.data.user.id}`);
      logInfo(`Status: ${response.data.user.status}`);
      logInfo(`Membership Tier: ${response.data.user.membershipTier}`);
      
      if (response.data.payment) {
        log('\n💳 Payment Information:', 'yellow');
        logInfo(`Amount: ${response.data.payment.currency} $${response.data.payment.amount}`);
        logInfo(`Description: ${response.data.payment.description}`);
        if (response.data.payment.link) {
          logInfo(`Payment Link: ${response.data.payment.link}`);
        }
      }

      if (response.data.nextSteps) {
        log('\n📋 Next Steps:', 'cyan');
        response.data.nextSteps.forEach((step, index) => {
          logInfo(`${index + 1}. ${step}`);
        });
      }
    } else {
      throw new Error('Registration failed');
    }
  }

  async testInvalidEmail() {
    logStep(5, 'Test Invalid Email Format');
    
    try {
      await axios.post(`${BASE_URL}/auth/verify-contact`, {
        email: 'invalid-email'
      });
      throw new Error('Should have rejected invalid email');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Invalid email correctly rejected');
      } else {
        throw error;
      }
    }
  }

  async testInvalidConfirmationCode() {
    logStep(6, 'Test Invalid Confirmation Code');
    
    try {
      await axios.post(`${BASE_URL}/auth/verify-confirmation`, {
        email: this.testEmail,
        code: '000000' // Invalid code
      });
      throw new Error('Should have rejected invalid code');
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('Invalid confirmation code correctly rejected');
      } else {
        throw error;
      }
    }
  }

  async testDuplicateRegistration() {
    logStep(7, 'Test Duplicate Registration Prevention');
    
    try {
      const registrationPayload = {
        ...this.registrationData,
        email: this.testEmail,
        confirmPassword: this.registrationData.password,
        existingContactId: this.contactId,
        isExistingContact: !!this.contactId
      };

      await axios.post(`${BASE_URL}/auth/register-existing`, registrationPayload);
      throw new Error('Should have rejected duplicate registration');
    } catch (error) {
      if (error.response?.status === 409) {
        logSuccess('Duplicate registration correctly prevented');
      } else {
        throw error;
      }
    }
  }

  async testEmailRateLimiting() {
    logStep(8, 'Test Email Rate Limiting (Multiple Requests)');
    
    logInfo('Sending multiple confirmation code requests...');
    logWarning('Note: This will send 3 emails to your test address');
    
    // Use the test email instead of invalid @example.com addresses to avoid bounces
    const requests = Array(3).fill(null).map(() => 
      axios.post(`${BASE_URL}/auth/send-confirmation`, {
        email: this.testEmail
      })
    );

    const responses = await Promise.allSettled(requests);
    const successCount = responses.filter(r => r.status === 'fulfilled').length;
    
    logInfo(`${successCount}/3 requests succeeded`);
    logSuccess('Rate limiting test completed');
    
    if (successCount === 3) {
      logInfo('✉️  You will receive 3 confirmation emails (rate limiting test)');
    }
  }

  printSummary() {
    logSection('TEST SUMMARY');
    
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    logSuccess(`Passed: ${this.results.passed}`);
    
    if (this.results.failed > 0) {
      logError(`Failed: ${this.results.failed}`);
    }
    
    if (this.results.warnings > 0) {
      logWarning(`Warnings: ${this.results.warnings}`);
    }

    console.log('\n' + '-'.repeat(80) + '\n');
    
    log('Detailed Results:', 'bright');
    this.results.details.forEach((detail, index) => {
      const statusColor = detail.status === 'PASSED' ? 'green' : 'red';
      console.log(`${index + 1}. ${detail.test}: `, '');
      log(detail.status, statusColor);
      if (detail.error) {
        logError(`   Error: ${detail.error}`);
      }
    });

    console.log('\n' + '='.repeat(80) + '\n');

    // Overall result
    if (this.results.failed === 0) {
      logSuccess('🎉 ALL TESTS PASSED! 🎉');
      return 0;
    } else {
      logError(`⚠️  ${this.results.failed} TEST(S) FAILED`);
      return 1;
    }
  }

  async runInteractiveFlow() {
    logSection('INTERACTIVE CONNECT ACCOUNT FLOW TEST');
    
    log('This test will walk through the complete connect account flow.', 'cyan');
    log('You will be able to manually verify emails at each step.\n', 'cyan');

    try {
      // Step 0: Test email service
      await this.runTest('Email Service Configuration', () => this.testEmailService());
      await sleep(1000);

      // Always prompt for email address (don't use default)
      log('\n⚠️  Important: You will receive a real email to this address!', 'yellow');
      log('Please use a valid email address you can access.\n', 'yellow');
      
      this.testEmail = await promptUser('Enter email address to test: ');
      
      // Validate email format before proceeding
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.testEmail)) {
        logError('Invalid email format. Please run the test again with a valid email.');
        return 1;
      }
      
      logSuccess(`Using email: ${this.testEmail}\n`);

      // Step 1: Verify contact
      await this.runTest('Verify Contact in GoHighLevel', () => this.testVerifyContact());
      await sleep(1000);

      // Step 2: Send confirmation
      await this.runTest('Send Confirmation Email', () => this.testSendConfirmation());
      
      // If code wasn't returned (production mode), prompt user
      if (!this.confirmationCode) {
        log('\n📧 Check your email for the confirmation code.', 'yellow');
        this.confirmationCode = await promptUser('Enter the 6-digit confirmation code: ');
      }
      
      await sleep(1000);

      // Step 3: Verify confirmation
      await this.runTest('Verify Confirmation Code', () => this.testVerifyConfirmation(this.confirmationCode));
      await sleep(1000);

      // Step 4: Complete registration
      log('\n📝 Completing registration with the following details:', 'cyan');
      console.log(JSON.stringify(this.registrationData, null, 2));
      
      const continueRegistration = await promptUser('\nProceed with registration? (y/n): ');
      if (continueRegistration.toLowerCase() === 'y') {
        await this.runTest('Complete Registration', () => this.testRegisterExisting());
      } else {
        logWarning('Registration skipped by user');
      }

      return this.printSummary();

    } catch (error) {
      logError(`Fatal error during interactive flow: ${error.message}`);
      console.error(error);
      return 1;
    }
  }

  async runAutomatedTests() {
    logSection('AUTOMATED CONNECT ACCOUNT FLOW TESTS');

    // Check if email is provided via environment variable
    if (!TEST_EMAIL) {
      logError('TEST_EMAIL environment variable is required for automated tests');
      logInfo('Usage: TEST_EMAIL=your@email.com node connect-account-flow.test.js automated');
      return 1;
    }

    this.testEmail = TEST_EMAIL;
    logInfo(`Using email from environment: ${this.testEmail}\n`);

    try {
      // Step 0: Test email service
      await this.runTest('Email Service Configuration', () => this.testEmailService());
      await sleep(500);

      // Step 1: Test invalid email
      await this.runTest('Invalid Email Validation', () => this.testInvalidEmail());
      await sleep(500);

      // Step 2: Verify contact
      await this.runTest('Contact Verification', () => this.testVerifyContact());
      await sleep(500);

      // Step 3: Send confirmation
      await this.runTest('Send Confirmation Email', () => this.testSendConfirmation());
      await sleep(500);

      // Step 4: Test invalid confirmation code
      await this.runTest('Invalid Confirmation Code', () => this.testInvalidConfirmationCode());
      await sleep(500);

      // Step 5: Verify valid confirmation code
      if (this.confirmationCode) {
        await this.runTest('Valid Confirmation Code', () => this.testVerifyConfirmation(this.confirmationCode));
        await sleep(500);

        // Step 6: Complete registration
        await this.runTest('Complete Registration', () => this.testRegisterExisting());
        await sleep(500);

        // Step 7: Test duplicate registration
        await this.runTest('Duplicate Registration Prevention', () => this.testDuplicateRegistration());
        await sleep(500);
      } else {
        logWarning('Skipping confirmation and registration tests (code not available in production mode)');
        logInfo('To test full flow: Set NODE_ENV=development in ghl-api/.env or use interactive mode');
        this.results.warnings++;
      }

      // Step 8: Test rate limiting
      await this.runTest('Email Rate Limiting', () => this.testEmailRateLimiting());

      return this.printSummary();

    } catch (error) {
      logError(`Fatal error during automated tests: ${error.message}`);
      console.error(error);
      return 1;
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'interactive';

  log('\n🚀 Connect Account Flow Test Suite', 'bright');
  log(`Base URL: ${BASE_URL}`, 'cyan');
  log(`Mode: ${mode}\n`, 'cyan');

  const tester = new ConnectAccountFlowTest();

  if (mode === 'interactive') {
    return await tester.runInteractiveFlow();
  } else if (mode === 'automated') {
    return await tester.runAutomatedTests();
  } else {
    logError(`Unknown mode: ${mode}`);
    logInfo('Usage: node connect-account-flow.test.js [interactive|automated]');
    return 1;
  }
}

// Run the tests
if (require.main === module) {
  main()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      logError('Unhandled error:');
      console.error(error);
      process.exit(1);
    });
}

module.exports = ConnectAccountFlowTest;
