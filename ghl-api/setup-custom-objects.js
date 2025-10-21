/**
 * One-time setup script to set up appointment association
 * 
 * IMPORTANT: Fields must be added manually via GoHighLevel UI
 * Go to Settings → Custom Objects → Appointment Custom Fields → Add Field
 * 
 * Add these fields:
 * 1. appointmentId (TEXT, required)
 * 2. pageUrl (TEXT)
 * 3. coverImageUrl (TEXT)
 * 4. downloadFileUrl (TEXT)
 * 5. internalNote (LARGE_TEXT)
 * 
 * Object ID: 68f7fab7f044392c0343afd3
 */

require('dotenv').config();
const axios = require('axios');

const PRIVATE_TOKEN = process.env.PRIVATE_INTEGRATION_TOKEN;
const LOCATION_ID = process.env.LOCATION_ID;
const BASE_URL = 'https://services.leadconnectorhq.com';
const CUSTOM_OBJECT_ID = '68f7fab7f044392c0343afd3';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${PRIVATE_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
  }
});

async function setup() {
  console.log('🚀 Setting up Custom Object Association...\n');
  console.log(`Custom Object ID: ${CUSTOM_OBJECT_ID}\n`);
  
  console.log('⚠️  NOTE: Fields must be added manually via GoHighLevel UI');
  console.log('   Settings → Custom Objects → Appointment Custom Fields → Add Field\n');
  console.log('   Required fields:');
  console.log('   1. appointmentId (TEXT, required)');
  console.log('   2. pageUrl (TEXT)');
  console.log('   3. coverImageUrl (TEXT)');
  console.log('   4. downloadFileUrl (TEXT)');
  console.log('   5. internalNote (LARGE_TEXT)\n');

  try {
    // Get current schema to verify it exists
    console.log('📋 Verifying custom object exists...');
    const currentSchema = await client.get(`/objects/${CUSTOM_OBJECT_ID}`, {
      params: { locationId: LOCATION_ID }
    });
    
    console.log('✅ Custom object verified');
    console.log(`   Name: ${currentSchema.data.object.labels.singular}`);
    console.log(`   Current fields: ${currentSchema.data.fields.map(f => f.name).join(', ')}\n`);
    
    // Set up association with appointments via API
    console.log('🔗 Creating association with appointments...');
    
    const associationPayload = {
      firstObjectKey: 'custom_objects.appointment_custom_fields',
      secondObjectKey: 'appointment',
      firstObjectToSecondObjectCardinality: 'ONE_TO_ONE', // One custom field record to one appointment
      secondObjectToFirstObjectCardinality: 'ONE_TO_ONE', // One appointment to one custom field record
      firstObjectToSecondObjectMaxLimit: 2, // Min is 2
      secondObjectToFirstObjectMaxLimit: 1, // Must be exactly 1
      firstObjectLabel: 'Related Appointment',
      key: 'appointment_custom_fields_to_appointment',
      locationId: LOCATION_ID
    };

    try {
      const response = await client.post('/associations/', associationPayload);
      console.log('✅ Association created successfully!');
      console.log(`   Association ID: ${response.data.id}`);
      console.log(`   Key: ${response.data.key}\n`);
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 409) {
        console.log('⚠️  Association may already exist');
        console.log('   Error:', error.response?.data?.message || error.message);
        console.log('');
      } else {
        console.error('Failed to create association:', error.response?.data || error.message);
        // Don't throw - continue anyway
      }
    }
    
    console.log('🎉 Custom object is ready!\n');
    console.log('📝 Next steps:');
    console.log('   1. Add the required fields via GoHighLevel UI (see above)');
    console.log('   2. Test creating an event with custom fields');
    console.log('   3. Verify the custom object record is created and linked to the appointment\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

setup();
