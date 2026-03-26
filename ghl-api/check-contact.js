const axios = require('axios');

const contactId = 'lfEjcsGKvQDrPtnNmm2o';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;

if (!apiKey) {
  console.error('GHL_API_KEY not found');
  process.exit(1);
}

const client = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json'
  }
});

client.get(`/contacts/${contactId}`)
  .then(response => {
    const contact = response.data.contact;
    console.log('\n=================================');
    console.log('Contact Details');
    console.log('=================================');
    console.log('ID:', contact.id);
    console.log('Name:', contact.firstName, contact.lastName);
    console.log('Business:', contact.businessName || contact.companyName || 'N/A');
    console.log('Email:', contact.email);
    console.log('\nTags:', JSON.stringify(contact.tags, null, 2));
    console.log('\nDate Added:', contact.dateAdded);
    console.log('=================================\n');
    
    // Check if they have the required tags
    const hasActiveTag = contact.tags && contact.tags.includes('active');
    const hasMembershipTag = contact.tags && contact.tags.some(tag => 
      tag.toLowerCase().includes('membership') || 
      tag.toLowerCase() === 'elite' ||
      tag.toLowerCase() === 'enhanced' ||
      tag.toLowerCase() === 'basic'
    );
    
    console.log('Has "active" tag:', hasActiveTag);
    console.log('Has membership package tag:', hasMembershipTag);
    
    if (!hasActiveTag) {
      console.log('\n⚠️  ISSUE: Missing "active" tag');
    }
    if (!hasMembershipTag) {
      console.log('\n⚠️  ISSUE: Missing membership package tag');
    }
  })
  .catch(error => {
    console.error('Error fetching contact:', error.response?.data || error.message);
    process.exit(1);
  });
