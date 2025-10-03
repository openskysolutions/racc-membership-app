const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.medias;

async function listMedias(req, res, next) {
  try {
    // No list method available - use fetchMediaContent for specific media
    res.status(405).json({ message: 'List medias method not available. Use fetchMediaContent for specific media.' });
  } catch (err) { next(err); }
}

async function getMediaById(req, res, next) {
  try {
    const result = await svc.fetchMediaContent({ mediaId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createMedia(req, res, next) {
  try {
    const result = await svc.uploadMediaContent({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateMedia(req, res, next) {
  try {
    const result = await svc.updateMediaObject({ mediaId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteMedia(req, res, next) {
  try {
    await svc.deleteMediaContent({ mediaId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Media Folders
async function createMediaFolder(req, res, next) {
  try {
    const result = await svc.createMediaFolder({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// Avatar Upload
async function uploadAvatar(req, res, next) {
  try {
    console.log('Avatar upload request received');
    console.log('Body:', req.body);
    console.log('Environment check:');
    console.log('PRIVATE_INTEGRATION_TOKEN:', process.env.PRIVATE_INTEGRATION_TOKEN ? 'SET' : 'NOT SET');
    console.log('LOCATION_ID:', process.env.LOCATION_ID);
    
    const { contactId, locationId = process.env.LOCATION_ID, fileData, fileName, mimeType } = req.body;
    
    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }
    
    if (!fileData) {
      return res.status(400).json({ error: 'File data is required' });
    }
    
    // Convert base64 to buffer if needed
    let fileBuffer;
    if (fileData.startsWith('data:')) {
      // Handle data URL
      const base64Data = fileData.split(',')[1];
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Assume it's already base64 encoded
      fileBuffer = Buffer.from(fileData, 'base64');
    }
    
    console.log(`Processing avatar upload for contact ${contactId}, file size: ${fileBuffer.length} bytes`);
    
    // Upload to GoHighLevel - try using the SDK method first
    console.log('Attempting GoHighLevel SDK upload...');
    
    try {
      // Try the SDK method first
      const result = await svc.uploadMediaContent({
        locationId: locationId,
        file: fileBuffer,
        fileName: fileName || `avatar-${contactId}-${Date.now()}.jpg`,
        fileType: mimeType || 'image/jpeg',
        altAttribute: `Profile photo for contact ${contactId}`,
        hosted: true
      });
      
      console.log('GoHighLevel SDK upload successful:', result);
      
      const response = {
        success: true,
        mediaId: result.id,
        mediaUrl: result.url || result.src,
        message: 'Avatar uploaded successfully to GoHighLevel via SDK'
      };
      
      return res.status(201).json(response);
      
    } catch (sdkError) {
      console.warn('GoHighLevel SDK failed, trying direct API call:', sdkError.message);
      
      // Fallback to direct API call with corrected format
      const axios = require('axios');
      const FormData = require('form-data');
      
      const formData = new FormData();
      
      // According to GoHighLevel API docs, the required fields are:
      formData.append('locationId', locationId);
      formData.append('file', fileBuffer, {
        filename: fileName || `avatar-${contactId}-${Date.now()}.jpg`,
        contentType: mimeType || 'image/jpeg'
      });
      
      // Optional fields
      formData.append('altAttribute', `Profile photo for contact ${contactId}`);
      
      console.log('Uploading to GoHighLevel media storage via direct API...');
      console.log('LocationId:', locationId);
      
      const ghlResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
          'Version': '2021-07-28'
        },
        timeout: 30000
      });
      
      console.log('GoHighLevel direct API upload successful:', ghlResponse.data);
      
      const response = {
        success: true,
        mediaId: ghlResponse.data.id,
        mediaUrl: ghlResponse.data.url || ghlResponse.data.src,
        message: 'Avatar uploaded successfully to GoHighLevel via direct API'
      };
      
      return res.status(201).json(response);
    }
    
  } catch (err) { 
    console.error('Avatar upload error details:', err);
    console.error('Error stack:', err.stack);
    
    // Provide more specific error information
    let errorMessage = 'Failed to upload avatar to GoHighLevel';
    let statusCode = 500;
    
    if (err.response) {
      // GoHighLevel API responded with an error
      statusCode = err.response.status;
      errorMessage = `GoHighLevel API error (${statusCode}): ${err.response.data?.message || err.message}`;
      console.error('GoHighLevel API response:', err.response.data);
    } else if (err.request) {
      // Network error
      errorMessage = 'Network error connecting to GoHighLevel API';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: err.message 
    });
  }
}

// Bulk Operations
async function bulkUpdateMediaObjects(req, res, next) {
  try {
    const result = await svc.bulkUpdateMediaObjects({ payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function bulkDeleteMediaObjects(req, res, next) {
  try {
    const result = await svc.bulkDeleteMediaObjects({ payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { 
  listMedias, getMediaById, createMedia, updateMedia, deleteMedia,
  // Avatar Upload
  uploadAvatar,
  // Media Folders
  createMediaFolder,
  // Bulk Operations
  bulkUpdateMediaObjects, bulkDeleteMediaObjects
};