/**
 * Initialize required custom fields for the RACC membership system
 */

const { HighLevel } = require('@gohighlevel/api-client');

async function initializeCustomFields() {
  try {
    console.log('🔧 Initializing custom fields...');
    
    const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
    const customFieldsService = client.customFields;
    
    // Get existing custom fields
    const existingFields = await customFieldsService.getCustomFieldsByObjectKey({ 
      objectKey: 'contact' 
    });
    
    const existingFieldNames = existingFields.customFields?.map(field => field.name) || [];
    console.log('📋 Existing custom fields:', existingFieldNames);
    
    // Define required custom fields for avatar functionality
    const requiredFields = [
      {
        name: 'avatar_url',
        dataType: 'TEXT',
        fieldKey: 'avatar_url',
        label: 'Avatar URL',
        placeholder: 'https://...',
        isRequired: false,
        objectKey: 'contact'
      },
      {
        name: 'profile_photo',
        dataType: 'TEXT',
        fieldKey: 'profile_photo', 
        label: 'Profile Photo URL',
        placeholder: 'https://...',
        isRequired: false,
        objectKey: 'contact'
      }
    ];
    
    // Create missing custom fields
    for (const field of requiredFields) {
      if (!existingFieldNames.includes(field.name)) {
        try {
          console.log(`➕ Creating custom field: ${field.name}`);
          const result = await customFieldsService.createCustomField({ 
            payload: field 
          });
          console.log(`✅ Created custom field: ${field.name} (ID: ${result.id})`);
        } catch (error) {
          console.warn(`⚠️  Failed to create custom field ${field.name}:`, error.message);
          // Don't throw - the field might already exist with a different name
        }
      } else {
        console.log(`✅ Custom field already exists: ${field.name}`);
      }
    }
    
    console.log('🔧 Custom fields initialization complete');
    
  } catch (error) {
    console.error('❌ Failed to initialize custom fields:', error.message);
    // Don't throw - this is not critical for startup
  }
}

module.exports = { initializeCustomFields };