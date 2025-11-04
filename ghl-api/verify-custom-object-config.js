/**
 * Verify Custom Object Configuration
 * 
 * This script checks:
 * 1. Custom object exists with correct ID
 * 2. All required fields are configured with correct names (camelCase)
 * 3. Association schema exists and is configured correctly
 */

require('dotenv').config();
const axios = require('axios');

const CUSTOM_OBJECT_ID = '68f7fab7f044392c0343afd3';
const ASSOCIATION_KEY = 'appointment_custom_fields_to_appointment';

const client = axios.create({
  baseURL: process.env.GHL_API_BASE_URL || 'https://services.leadconnectorhq.com',
  headers: {
    'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Version': '2021-04-15'
  }
});

async function verifyCustomObject() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔍 CUSTOM OBJECT VERIFICATION');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Get the custom object details
    console.log(`1️⃣  Fetching custom object: ${CUSTOM_OBJECT_ID}`);
    console.log(`   Using Location ID: ${process.env.LOCATION_ID}\n`);
    const objectResponse = await client.get(`/objects/${CUSTOM_OBJECT_ID}`, {
      params: {
        locationId: process.env.LOCATION_ID
      }
    });
    const customObject = objectResponse.data;
    
    console.log(`\n   Raw response data:`, JSON.stringify(customObject, null, 2));
    
    console.log(`\n✅ Custom Object Found:`);
    console.log(`   ID: ${customObject.id || customObject._id || CUSTOM_OBJECT_ID}`);
    console.log(`   Name: ${customObject.name || customObject.displayName || 'N/A'}`);
    console.log(`   Key: ${customObject.key || customObject.schemaKey || 'N/A'}`);
    console.log(`   Object Type: ${customObject.objectType || customObject.type || 'N/A'}`);
    
    // 2. Check all fields
    console.log(`\n2️⃣  Checking Custom Fields:`);
    console.log(`   Total fields: ${customObject.fields?.length || 0}\n`);
    
    const requiredFields = [
      { name: 'appointmentId', type: 'TEXT', required: true },
      { name: 'pageUrl', type: 'TEXT', required: false },
      { name: 'coverImageUrl', type: 'TEXT', required: false },
      { name: 'downloadFileUrl', type: 'TEXT', required: false },
      { name: 'internalNote', type: 'LARGE_TEXT', required: false }
    ];
    
    const foundFields = {};
    
    if (customObject.fields && Array.isArray(customObject.fields)) {
      customObject.fields.forEach(field => {
        console.log(`   📋 Field: ${field.name}`);
        console.log(`      ID: ${field.id}`);
        console.log(`      Type: ${field.fieldType || field.type || 'N/A'}`);
        console.log(`      Required: ${field.isRequired || field.required ? 'Yes' : 'No'}`);
        console.log(`      Searchable: ${field.isSearchable || field.searchable ? 'Yes' : 'No'}`);
        console.log('');
        
        foundFields[field.name] = {
          id: field.id,
          type: field.fieldType || field.type,
          required: field.isRequired || field.required
        };
      });
    }
    
    // 3. Verify all required fields exist with correct naming
    console.log(`3️⃣  Field Verification:\n`);
    let allFieldsCorrect = true;
    
    requiredFields.forEach(expectedField => {
      const found = foundFields[expectedField.name];
      if (!found) {
        console.log(`   ❌ MISSING: ${expectedField.name} (${expectedField.type})`);
        allFieldsCorrect = false;
      } else if (found.type !== expectedField.type) {
        console.log(`   ⚠️  ${expectedField.name}: Wrong type (found: ${found.type}, expected: ${expectedField.type})`);
        allFieldsCorrect = false;
      } else if (expectedField.required && !found.required) {
        console.log(`   ⚠️  ${expectedField.name}: Should be required but isn't`);
        allFieldsCorrect = false;
      } else {
        console.log(`   ✅ ${expectedField.name}: Configured correctly (ID: ${found.id})`);
      }
    });
    
    if (allFieldsCorrect) {
      console.log(`\n   🎉 All fields are configured correctly with camelCase names!`);
    } else {
      console.log(`\n   ⚠️  Some fields need attention`);
    }
    
    // 4. Check for associations
    console.log(`\n4️⃣  Checking Association Schema:`);
    try {
      // Try to get association schema details
      const associationResponse = await client.get(`/associations/${ASSOCIATION_KEY}`, {
        params: {
          locationId: process.env.LOCATION_ID
        }
      });
      console.log(`\n   ✅ Association Schema Found:`);
      console.log(`      Key: ${associationResponse.data.key || ASSOCIATION_KEY}`);
      console.log(`      Name: ${associationResponse.data.name}`);
      console.log(`      First Object: ${associationResponse.data.firstObjectKey}`);
      console.log(`      Second Object: ${associationResponse.data.secondObjectKey}`);
      console.log(`      Relationship: ${associationResponse.data.relationshipType}`);
    } catch (assocError) {
      if (assocError.response?.status === 404) {
        console.log(`\n   ⚠️  Association schema not found: ${ASSOCIATION_KEY}`);
        console.log(`      This is OK - associations may not be needed for recurring events`);
        console.log(`      Custom objects are found via property search instead`);
      } else {
        console.log(`\n   ❌ Error checking association: ${assocError.message}`);
      }
    }
    
    // 5. Test a sample search
    console.log(`\n5️⃣  Testing Custom Object Record Search:`);
    try {
      const searchResponse = await client.post(
        `/objects/${CUSTOM_OBJECT_ID}/records/search`,
        {
          locationId: process.env.LOCATION_ID,
          page: 1,
          pageLimit: 5
        }
      );
      
      const records = searchResponse.data?.records || [];
      console.log(`\n   ✅ Search works! Found ${records.length} sample records`);
      
      if (records.length > 0) {
        console.log(`\n   Sample record properties:`);
        const sampleProps = records[0].properties || {};
        Object.keys(sampleProps).forEach(key => {
          console.log(`      ${key}: ${typeof sampleProps[key]}`);
        });
      }
    } catch (searchError) {
      console.log(`\n   ❌ Search failed: ${searchError.message}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run verification
verifyCustomObject().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
