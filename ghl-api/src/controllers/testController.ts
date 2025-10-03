const { HighLevel } = require('@gohighlevel/api-client');

async function testGHLConnection(req, res, next) {
  try {
    console.log('Testing GoHighLevel connection...');
    console.log('PRIVATE_INTEGRATION_TOKEN:', process.env.PRIVATE_INTEGRATION_TOKEN ? 'SET' : 'NOT SET');
    console.log('LOCATION_ID:', process.env.LOCATION_ID);
    
    const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
    const contactsService = client.contacts;
    
    // Try to get contacts - this is a simpler API call
    console.log('Attempting to fetch contacts...');
    const result = await contactsService.getContacts({ 
      locationId: process.env.LOCATION_ID,
      limit: 1 
    });
    
    console.log('GoHighLevel connection successful:', result);
    res.json({ 
      success: true, 
      message: 'GoHighLevel connection working',
      contactCount: result?.contacts?.length || 0
    });
  } catch (err) {
    console.error('GoHighLevel connection test failed:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'GoHighLevel connection failed',
      details: err.message 
    });
  }
}

module.exports = { testGHLConnection };