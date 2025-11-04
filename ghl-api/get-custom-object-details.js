/**
 * Script to get detailed information about a specific custom object
 */

require('dotenv').config();
const axios = require('axios');

const PRIVATE_TOKEN = process.env.PRIVATE_INTEGRATION_TOKEN;
const LOCATION_ID = process.env.LOCATION_ID;
const BASE_URL = 'https://services.leadconnectorhq.com';
const CUSTOM_OBJECT_ID = '68f7fab7f044392c0343afd3'; // Event Custom Fields

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${PRIVATE_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
  }
});

async function getObjectDetails() {
  console.log('🔍 Getting detailed schema for Event Custom Fields object...\n');
  
  try {
    const response = await client.get(`/objects/${CUSTOM_OBJECT_ID}`, {
      params: { locationId: LOCATION_ID }
    });
    
    console.log('✅ Custom Object Details:\n');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.fields && response.data.fields.length > 0) {
      console.log('\n📋 Field Summary:');
      response.data.fields.forEach(field => {
        console.log(`  ${field.name}:`);
        console.log(`    ID: ${field.id}`);
        console.log(`    Type: ${field.type}`);
        console.log(`    Required: ${field.required || false}`);
      });
    } else {
      console.log('\n⚠️  No fields found. You need to add fields in GoHighLevel UI:');
      console.log('   Settings → Custom Objects → Event Custom Fields → Add Fields');
      console.log('\n   Required fields:');
      console.log('   - appointmentid (TEXT, required)');
      console.log('   - pageurl (TEXT)');
      console.log('   - coverimageurl (TEXT)');
      console.log('   - downloadfileurl (TEXT)');
      console.log('   - internalnote (LARGE_TEXT)');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to get object details:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

getObjectDetails();
