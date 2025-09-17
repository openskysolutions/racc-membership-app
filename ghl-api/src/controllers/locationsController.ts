const { HighLevel } = require('@gohighlevel/api-client');
// Add timeout configuration to prevent network timeouts
const client = new HighLevel({ 
  privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN,
  timeout: 10000 // Reduce timeout to 10 seconds for faster feedback
});
const svc = client.locations;

// Add more detailed error handling and logging
async function listLocations(req, res, next) {
  try {
    console.log('Attempting to list locations...');
    const result = await svc.searchLocations({ 
      limit: req.query.limit || 20, 
      skip: req.query.skip || 0 
    });
    console.log('Locations result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in listLocations:', {
      message: err.message,
      statusCode: err.statusCode,
      response: err.response?.data
    });
    
    // Handle specific error types
    if (err.message && err.message.includes("Token's user type mismatch") || err.statusCode === 401) {
      return res.status(403).json({
        error: "Access Denied",
        message: "Your Private Integration Token doesn't have permission to access the locations endpoint. This is a common limitation for certain token types.",
        suggestion: "Contact your GoHighLevel administrator to upgrade your token permissions, or use an OAuth token instead.",
        originalError: err.message
      });
    }
    
    // Handle network errors
    if (err.message && err.message.includes("Network error")) {
      return res.status(503).json({
        error: "Service Unavailable", 
        message: "Unable to connect to GoHighLevel API. This could be a temporary network issue.",
        suggestion: "Please try again in a few moments."
      });
    }
    
    next(err); 
  }
}

async function getLocationById(req, res, next) {
  try {
    const result = await svc.getLocation({ locationId: req.params.id });
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getLocationById:', {
      message: err.message,
      statusCode: err.statusCode,
      response: err.response?.data,
      locationId: req.params.id
    });
    
    // Handle specific error types
    if (err.message && err.message.includes("Token's user type mismatch") || err.statusCode === 401) {
      return res.status(403).json({
        error: "Access Denied",
        message: `Your Private Integration Token doesn't have permission to access location ${req.params.id}. This is a common limitation for certain token types.`,
        suggestion: "Contact your GoHighLevel administrator to upgrade your token permissions, or use an OAuth token instead.",
        requestedLocationId: req.params.id,
        originalError: err.message
      });
    }
    
    // Handle network errors
    if (err.message && err.message.includes("Network error")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Unable to connect to GoHighLevel API. This could be a temporary network issue.",
        suggestion: "Please try again in a few moments.",
        requestedLocationId: req.params.id
      });
    }
    
    // For any other errors, pass them to the error handler
    next(err); 
  }
}

async function createLocation(req, res, next) {
  try {
    console.log('Attempting to create location...');
    const result = await svc.createLocation({ payload: req.body });
    console.log('Create location result:', result);
    res.status(201).json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in createLocation:', {
      message: err.message,
      statusCode: err.statusCode,
      response: err.response?.data
    });
    
    if (err.message && err.message.includes("Token's user type mismatch") || err.statusCode === 401) {
      return res.status(403).json({
        error: "Access Denied",
        message: "Your Private Integration Token doesn't have permission to create locations.",
        suggestion: "Contact your GoHighLevel administrator to upgrade your token permissions, or use an OAuth token instead.",
        originalError: err.message
      });
    }
    
    if (err.message && err.message.includes("Network error")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Unable to connect to GoHighLevel API. This could be a temporary network issue.",
        suggestion: "Please try again in a few moments."
      });
    }
    
    next(err); 
  }
}

async function updateLocation(req, res, next) {
  try {
    console.log('Attempting to update location:', req.params.id);
    const result = await svc.putLocation({ locationId: req.params.id, payload: req.body });
    console.log('Update location result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in updateLocation:', {
      message: err.message,
      statusCode: err.statusCode,
      response: err.response?.data,
      locationId: req.params.id
    });
    
    if (err.message && err.message.includes("Token's user type mismatch") || err.statusCode === 401) {
      return res.status(403).json({
        error: "Access Denied",
        message: `Your Private Integration Token doesn't have permission to update location ${req.params.id}.`,
        suggestion: "Contact your GoHighLevel administrator to upgrade your token permissions, or use an OAuth token instead.",
        requestedLocationId: req.params.id,
        originalError: err.message
      });
    }
    
    if (err.message && err.message.includes("Network error")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Unable to connect to GoHighLevel API. This could be a temporary network issue.",
        suggestion: "Please try again in a few moments.",
        requestedLocationId: req.params.id
      });
    }
    
    next(err); 
  }
}

async function deleteLocation(req, res, next) {
  try {
    console.log('Attempting to delete location:', req.params.id);
    await svc.deleteLocation({ locationId: req.params.id });
    console.log('Successfully deleted location:', req.params.id);
    res.status(204).end();
  } catch (err) { 
    console.error('GoHighLevel API Error in deleteLocation:', {
      message: err.message,
      statusCode: err.statusCode,
      response: err.response?.data,
      locationId: req.params.id
    });
    
    if (err.message && err.message.includes("Token's user type mismatch") || err.statusCode === 401) {
      return res.status(403).json({
        error: "Access Denied",
        message: `Your Private Integration Token doesn't have permission to delete location ${req.params.id}.`,
        suggestion: "Contact your GoHighLevel administrator to upgrade your token permissions, or use an OAuth token instead.",
        requestedLocationId: req.params.id,
        originalError: err.message
      });
    }
    
    if (err.message && err.message.includes("Network error")) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Unable to connect to GoHighLevel API. This could be a temporary network issue.",
        suggestion: "Please try again in a few moments.",
        requestedLocationId: req.params.id
      });
    }
    
    next(err); 
  }
}

// Location Tags
async function getLocationTags(req, res, next) {
  try {
    console.log('Attempting to get location tags...');
    const result = await svc.getLocationTags({ locationId: req.query.locationId || process.env.LOCATION_ID });
    console.log('Location tags result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getLocationTags:', err.message);
    next(err); 
  }
}

async function createTag(req, res, next) {
  try {
    console.log('Attempting to create tag...');
    const result = await svc.createTag({ payload: req.body });
    console.log('Create tag result:', result);
    res.status(201).json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in createTag:', err.message);
    next(err); 
  }
}

async function getTagById(req, res, next) {
  try {
    console.log('Attempting to get tag:', req.params.id);
    const result = await svc.getTagById({ tagId: req.params.id });
    console.log('Tag result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getTagById:', err.message);
    next(err); 
  }
}

async function updateTag(req, res, next) {
  try {
    console.log('Attempting to update tag:', req.params.id);
    const result = await svc.updateTag({ tagId: req.params.id, payload: req.body });
    console.log('Update tag result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in updateTag:', err.message);
    next(err); 
  }
}

async function deleteTag(req, res, next) {
  try {
    console.log('Attempting to delete tag:', req.params.id);
    await svc.deleteTag({ tagId: req.params.id });
    console.log('Successfully deleted tag:', req.params.id);
    res.status(204).end();
  } catch (err) { 
    console.error('GoHighLevel API Error in deleteTag:', err.message);
    next(err); 
  }
}

// Task Search
async function taskSearch(req, res, next) {
  try {
    console.log('Attempting to search tasks...');
    const result = await svc.taskSearch({ locationId: req.query.locationId || process.env.LOCATION_ID });
    console.log('Task search result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in taskSearch:', err.message);
    next(err); 
  }
}

// Location Custom Fields
async function getCustomFields(req, res, next) {
  try {
    console.log('Attempting to get custom fields...');
    const result = await svc.getCustomFields({ locationId: req.query.locationId || process.env.LOCATION_ID });
    console.log('Custom fields result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getCustomFields:', err.message);
    next(err); 
  }
}

async function createCustomField(req, res, next) {
  try {
    console.log('Attempting to create custom field...');
    const result = await svc.createCustomField({ payload: req.body });
    console.log('Create custom field result:', result);
    res.status(201).json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in createCustomField:', err.message);
    next(err); 
  }
}

async function getCustomField(req, res, next) {
  try {
    console.log('Attempting to get custom field:', req.params.id);
    const result = await svc.getCustomField({ customFieldId: req.params.id });
    console.log('Custom field result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getCustomField:', err.message);
    next(err); 
  }
}

async function updateCustomField(req, res, next) {
  try {
    console.log('Attempting to update custom field:', req.params.id);
    const result = await svc.updateCustomField({ customFieldId: req.params.id, payload: req.body });
    console.log('Update custom field result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in updateCustomField:', err.message);
    next(err); 
  }
}

async function deleteCustomField(req, res, next) {
  try {
    console.log('Attempting to delete custom field:', req.params.id);
    await svc.deleteCustomField({ customFieldId: req.params.id });
    console.log('Successfully deleted custom field:', req.params.id);
    res.status(204).end();
  } catch (err) { 
    console.error('GoHighLevel API Error in deleteCustomField:', err.message);
    next(err); 
  }
}

async function uploadFileCustomFields(req, res, next) {
  try {
    console.log('Attempting to upload file for custom fields...');
    const result = await svc.uploadFileCustomFields({ payload: req.body });
    console.log('Upload file result:', result);
    res.status(201).json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in uploadFileCustomFields:', err.message);
    next(err); 
  }
}

// Custom Values
async function getCustomValues(req, res, next) {
  try {
    console.log('Attempting to get custom values...');
    const result = await svc.getCustomValues({ locationId: req.query.locationId || process.env.LOCATION_ID });
    console.log('Custom values result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getCustomValues:', err.message);
    next(err); 
  }
}

async function createCustomValue(req, res, next) {
  try {
    console.log('Attempting to create custom value...');
    const result = await svc.createCustomValue({ payload: req.body });
    console.log('Create custom value result:', result);
    res.status(201).json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in createCustomValue:', err.message);
    next(err); 
  }
}

async function getCustomValue(req, res, next) {
  try {
    console.log('Attempting to get custom value:', req.params.id);
    const result = await svc.getCustomValue({ customValueId: req.params.id });
    console.log('Custom value result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getCustomValue:', err.message);
    next(err); 
  }
}

async function updateCustomValue(req, res, next) {
  try {
    console.log('Attempting to update custom value:', req.params.id);
    const result = await svc.updateCustomValue({ customValueId: req.params.id, payload: req.body });
    console.log('Update custom value result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in updateCustomValue:', err.message);
    next(err); 
  }
}

async function deleteCustomValue(req, res, next) {
  try {
    console.log('Attempting to delete custom value:', req.params.id);
    await svc.deleteCustomValue({ customValueId: req.params.id });
    console.log('Successfully deleted custom value:', req.params.id);
    res.status(204).end();
  } catch (err) { 
    console.error('GoHighLevel API Error in deleteCustomValue:', err.message);
    next(err); 
  }
}

// Timezones
async function getTimezones(req, res, next) {
  try {
    console.log('Attempting to get timezones...');
    const result = await svc.getTimezones();
    console.log('Timezones result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getTimezones:', err.message);
    next(err); 
  }
}

// Email/SMS Templates
async function getAllOrEmailSmsTemplates(req, res, next) {
  try {
    console.log('Attempting to get email/SMS templates...');
    const result = await svc.gETAllOrEmailSmsTemplates({ locationId: req.query.locationId || process.env.LOCATION_ID });
    console.log('Templates result:', result);
    res.json(result);
  } catch (err) { 
    console.error('GoHighLevel API Error in getAllOrEmailSmsTemplates:', err.message);
    next(err); 
  }
}

async function deleteAnEmailSmsTemplate(req, res, next) {
  try {
    console.log('Attempting to delete email/SMS template:', req.params.id);
    await svc.dELETEAnEmailSmsTemplate({ templateId: req.params.id });
    console.log('Successfully deleted template:', req.params.id);
    res.status(204).end();
  } catch (err) { 
    console.error('GoHighLevel API Error in deleteAnEmailSmsTemplate:', err.message);
    next(err); 
  }
}

// Add a test endpoint that we know works
async function testConnection(req, res, next) {
  try {
    // Use calendars endpoint since we know it works with your token
    const calendarsClient = new HighLevel({ 
      privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN,
      timeout: 10000
    });
    
    const result = await calendarsClient.contacts.getContacts({ 
      locationId: req.query.locationId || process.env.LOCATION_ID 
    });
    
    res.json({
      status: "success",
      message: "GoHighLevel API connection is working",
      calendarsFound: result?.contacts?.length || 0,
      locationId: req.query.locationId || process.env.LOCATION_ID,
      tokenType: "Private Integration Token"
    });
  } catch (err) {
    console.error('Test connection error:', err.message);
    res.status(500).json({
      status: "error",
      message: "Failed to connect to GoHighLevel API",
      error: err.message,
      suggestion: "Check your token permissions and network connectivity"
    });
  }
}

module.exports = { 
  listLocations, getLocationById, createLocation, updateLocation, deleteLocation,
  // Tags
  getLocationTags, createTag, getTagById, updateTag, deleteTag,
  // Task Search
  taskSearch,
  // Custom Fields
  getCustomFields, createCustomField, getCustomField, updateCustomField, deleteCustomField, uploadFileCustomFields,
  // Custom Values
  getCustomValues, createCustomValue, getCustomValue, updateCustomValue, deleteCustomValue,
  // Timezones
  getTimezones,
  // Templates
  getAllOrEmailSmsTemplates, deleteAnEmailSmsTemplate,
  // Test endpoint
  testConnection
};