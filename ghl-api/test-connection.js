const { HighLevel } = require('@gohighlevel/api-client');
require('dotenv').config();

async function testConnection() {
  console.log('Testing GoHighLevel API Connection...');
  console.log('Token present:', !!process.env.PRIVATE_INTEGRATION_TOKEN);
  console.log('Token starts with:', process.env.PRIVATE_INTEGRATION_TOKEN?.substring(0, 10) + '...');
  
  const client = new HighLevel({ 
    privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN,
    timeout: 15000
  });

  // Test multiple endpoints to see which ones work
  const endpoints = [
    {
      name: 'Contacts',
      test: () => client.contacts.searchContacts({ locationId: process.env.LOCATION_ID, limit: 1 })
    },
    {
      name: 'Opportunities', 
      test: () => client.opportunities.searchOpportunity({ limit: 1 })
    },
    {
      name: 'Calendars',
      test: () => client.calendars.getCalendars({ locationId: process.env.LOCATION_ID })
    },
    {
      name: 'Users',
      test: () => client.users.getUser({ userId: 'test' }) // This will likely fail but shows different error
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing ${endpoint.name}...`);
      const result = await endpoint.test();
      console.log(`✅ ${endpoint.name} - SUCCESS`);
      if (result?.contacts) console.log(`  Found ${result.contacts.length} contacts`);
      if (result?.opportunities) console.log(`  Found ${result.opportunities.length} opportunities`);
      if (result?.calendars) console.log(`  Found ${result.calendars.length} calendars`);
    } catch (error) {
      console.log(`❌ ${endpoint.name} - FAILED: ${error.message}`);
      if (error.statusCode) console.log(`  Status: ${error.statusCode}`);
    }
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = testConnection;