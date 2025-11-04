/**
 * Script to list all custom objects in your GoHighLevel account
 * This will help us find the correct custom object ID for appointment custom fields
 */

require('dotenv').config();
const axios = require('axios');

const PRIVATE_TOKEN = process.env.PRIVATE_INTEGRATION_TOKEN;
const LOCATION_ID = process.env.LOCATION_ID;
const BASE_URL = 'https://services.leadconnectorhq.com';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${PRIVATE_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
  }
});

async function listCustomObjects() {
  console.log('🔍 Listing all custom objects in your GoHighLevel account...\n');
  
  try {
    const response = await client.get('/objects/', {
      params: { locationId: LOCATION_ID }
    });
    
    const objects = response.data.objects || response.data || [];
    
    if (objects.length === 0) {
      console.log('❌ No custom objects found in your account.');
      console.log('   You need to create a custom object in GoHighLevel:');
      console.log('   Settings → Custom Objects → Create Object');
      console.log('   Name: Appointment Custom Fields');
      console.log('   Key: appointment_custom_fields\n');
      return;
    }
    
    console.log(`✅ Found ${objects.length} custom object(s):\n`);
    
    objects.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.labels?.singular || obj.name || 'Unnamed Object'}`);
      console.log(`   ID: ${obj.id}`);
      console.log(`   Key: ${obj.key || 'N/A'}`);
      if (obj.fields && obj.fields.length > 0) {
        console.log(`   Fields:`);
        obj.fields.forEach(field => {
          console.log(`     - ${field.name} (${field.type}) [id: ${field.id}]`);
        });
      }
      console.log('');
    });
    
    // Look for event/appointment custom fields object
    const eventObj = objects.find(obj => 
      obj.key?.includes('event') || 
      obj.key?.includes('appointment') ||
      obj.labels?.singular?.toLowerCase().includes('event') ||
      obj.labels?.singular?.toLowerCase().includes('appointment')
    );
    
    if (eventObj) {
      console.log('🎯 Found event/appointment-related custom object:');
      console.log(`   Name: ${eventObj.labels?.singular || eventObj.name}`);
      console.log(`   ID: ${eventObj.id}`);
      console.log(`   Key: ${eventObj.key}`);
      console.log(`\n   📋 Copy these values to ghl-api/src/services/gohighlevel.ts:`);
      console.log(`   APPOINTMENT_CUSTOM_OBJECT_ID = '${eventObj.id}'`);
      if (eventObj.fields && eventObj.fields.length > 0) {
        console.log(`\n   Field IDs (if you need them):`);
        eventObj.fields.forEach(field => {
          console.log(`   ${field.name}: '${field.id}'`);
        });
      }
      console.log('');
    } else {
      console.log('⚠️  No appointment-related custom object found.');
      console.log('   You may need to create one in GoHighLevel UI first.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to list custom objects:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

listCustomObjects();
