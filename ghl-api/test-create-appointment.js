const { HighLevel } = require('@gohighlevel/api-client');
require('dotenv').config();

const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.calendars;

async function testCreateAppointment() {
  console.log('🧪 Testing appointment creation...\n');
  
  // Based on working API docs example - locationId MUST be in payload!
  const testPayload = {
    calendarId: '9XpDcFHv3SmCUuHeuOOg',
    locationId: process.env.LOCATION_ID, // KEY: This must be in the payload!
    contactId: 'tV0WwIdAlyvMLrd7mF7l',
    title: 'Test Event via Script',
    description: 'This is a test event created via test script',
    startTime: '2025-11-30T17:00:00.000Z',
    endTime: '2025-11-30T18:00:00.000Z',
    appointmentStatus: 'confirmed',
    address: 'Test Location',
    toNotify: false,
    ignoreDateRange: false,
    ignoreFreeSlotValidation: true,
    selectedTimezone: 'America/Denver'
  };
  
  console.log('📝 Payload being sent:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n');
  
  try {
    console.log('🚀 Test 1: Calling SDK with { payload: ... } wrapper\n');
    try {
      const result1 = await svc.createAppointment({ payload: testPayload });
      console.log('✅ SUCCESS with payload wrapper!');
      console.log(JSON.stringify(result1, null, 2));
      return;
    } catch (err1) {
      console.log('❌ Failed with payload wrapper:', err1.message);
    }
    
    console.log('\n🚀 Test 2: Calling SDK WITHOUT payload wrapper (direct data)\n');
    const result = await svc.createAppointment(testPayload);
    
    console.log('✅ SUCCESS! Appointment created:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ ERROR creating appointment:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Status code:', error.statusCode);
    
    if (error.response) {
      console.error('\n📄 Response data:');
      console.error(JSON.stringify(error.response, null, 2));
    }
    
    if (error.request) {
      console.error('\n📤 Request details:');
      console.error('URL:', error.request.path);
      console.error('Method:', error.request.method);
      console.error('Headers:', error.request._header);
    }
  }
}

testCreateAppointment();
