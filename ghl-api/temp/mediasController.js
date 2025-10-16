const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.medias;
async function listMedias(req, res, next) {
    try {
        // No list method available - use fetchMediaContent for specific media
        res.status(405).json({ message: 'List medias method not available. Use fetchMediaContent for specific media.' });
    }
    catch (err) {
        next(err);
    }
}
async function getMediaById(req, res, next) {
    try {
        const result = await svc.fetchMediaContent({ mediaId: req.params.id }, { headers: req.headers });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function createMedia(req, res, next) {
    try {
        const result = await svc.uploadMediaContent({ payload: req.body }, { headers: req.headers });
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
async function updateMedia(req, res, next) {
    try {
        const result = await svc.updateMediaObject({ mediaId: req.params.id, payload: req.body }, { headers: req.headers });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function deleteMedia(req, res, next) {
    try {
        await svc.deleteMediaContent({ mediaId: req.params.id }, { headers: req.headers });
        res.status(204).end();
    }
    catch (err) {
        next(err);
    }
}
// Media Folders
async function createMediaFolder(req, res, next) {
    try {
        const result = await svc.createMediaFolder({ payload: req.body }, { headers: req.headers });
        res.status(201).json(result);
    }
    catch (err) {
        next(err);
    }
}
// Avatar Upload
async function uploadAvatar(req, res, next) {
    try {
        console.log('Avatar upload request received');
        console.log('Body keys:', Object.keys(req.body));
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
        // Convert base64 to buffer
        let fileBuffer;
        if (fileData.startsWith('data:')) {
            const base64Data = fileData.split(',')[1];
            fileBuffer = Buffer.from(base64Data, 'base64');
        }
        else {
            fileBuffer = Buffer.from(fileData, 'base64');
        }
        console.log(`Processing avatar upload for contact ${contactId}, file size: ${fileBuffer.length} bytes`);
        // Try GoHighLevel media upload with correct multipart/form-data format
        const axios = require('axios');
        const FormData = require('form-data');
        const formData = new FormData();
        // Use the correct field names for GoHighLevel API
        formData.append('locationId', locationId);
        formData.append('file', fileBuffer, {
            filename: fileName || `avatar-${contactId}-${Date.now()}.jpg`,
            contentType: mimeType || 'image/jpeg'
        });
        formData.append('hosted', 'true'); // Ensure it's hosted on GHL
        console.log('Uploading to GoHighLevel with FormData...');
        const ghlResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
                'Version': '2021-07-28'
            },
            timeout: 30000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        console.log('GoHighLevel upload successful:', ghlResponse.data);
        // Extract the media URL from the response
        const mediaData = ghlResponse.data;
        const mediaUrl = mediaData.url || mediaData.src || mediaData.mediaUrl;
        const mediaId = mediaData.id || mediaData.mediaId;
        if (!mediaUrl) {
            console.error('No media URL in response:', mediaData);
            throw new Error('Upload succeeded but no media URL returned');
        }
        const response = {
            success: true,
            mediaId: mediaId,
            mediaUrl: mediaUrl,
            message: 'Avatar uploaded successfully to GoHighLevel'
        };
        return res.status(201).json(response);
    }
    catch (err) {
        console.error('Avatar upload error details:', err);
        console.error('Error stack:', err.stack);
        // Provide more specific error information
        let errorMessage = 'Failed to upload avatar to GoHighLevel';
        let statusCode = 500;
        if (err.response) {
            statusCode = err.response.status;
            console.error('GoHighLevel API response:', err.response.data);
            if (err.response.data?.message) {
                if (Array.isArray(err.response.data.message)) {
                    errorMessage = `GoHighLevel API error: ${err.response.data.message.join(', ')}`;
                }
                else {
                    errorMessage = `GoHighLevel API error: ${err.response.data.message}`;
                }
            }
            else {
                errorMessage = `GoHighLevel API error (${statusCode}): ${err.message}`;
            }
        }
        else if (err.request) {
            errorMessage = 'Network error connecting to GoHighLevel API';
        }
        res.status(statusCode).json({
            error: errorMessage,
            details: err.message
        });
    }
}
// Cover Image Upload
async function uploadCoverImage(req, res, next) {
    try {
        console.log('Cover Image upload request received');
        console.log('Body keys:', Object.keys(req.body));
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
        // Convert base64 to buffer
        let fileBuffer;
        if (fileData.startsWith('data:')) {
            const base64Data = fileData.split(',')[1];
            fileBuffer = Buffer.from(base64Data, 'base64');
        }
        else {
            fileBuffer = Buffer.from(fileData, 'base64');
        }
        console.log(`Processing cover image upload for contact ${contactId}, file size: ${fileBuffer.length} bytes`);
        // Try GoHighLevel media upload with correct multipart/form-data format
        const axios = require('axios');
        const FormData = require('form-data');
        const formData = new FormData();
        // Use the correct field names for GoHighLevel API
        formData.append('locationId', locationId);
        formData.append('file', fileBuffer, {
            filename: fileName || `coverImage-${contactId}-${Date.now()}.jpg`,
            contentType: mimeType || 'image/jpeg'
        });
        formData.append('hosted', 'true'); // Ensure it's hosted on GHL
        console.log('Uploading to GoHighLevel with FormData...');
        const ghlResponse = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
                'Version': '2021-07-28'
            },
            timeout: 30000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        console.log('GoHighLevel upload successful:', ghlResponse.data);
        // Extract the media URL from the response
        const mediaData = ghlResponse.data;
        const mediaUrl = mediaData.url || mediaData.src || mediaData.mediaUrl;
        const mediaId = mediaData.id || mediaData.mediaId;
        if (!mediaUrl) {
            console.error('No media URL in response:', mediaData);
            throw new Error('Upload succeeded but no media URL returned');
        }
        const response = {
            success: true,
            mediaId: mediaId,
            mediaUrl: mediaUrl,
            message: 'Cover Image uploaded successfully to GoHighLevel'
        };
        return res.status(201).json(response);
    }
    catch (err) {
        console.error('Cover Image upload error details:', err);
        console.error('Error stack:', err.stack);
        // Provide more specific error information
        let errorMessage = 'Failed to upload cover images to GoHighLevel';
        let statusCode = 500;
        if (err.response) {
            statusCode = err.response.status;
            console.error('GoHighLevel API response:', err.response.data);
            if (err.response.data?.message) {
                if (Array.isArray(err.response.data.message)) {
                    errorMessage = `GoHighLevel API error: ${err.response.data.message.join(', ')}`;
                }
                else {
                    errorMessage = `GoHighLevel API error: ${err.response.data.message}`;
                }
            }
            else {
                errorMessage = `GoHighLevel API error (${statusCode}): ${err.message}`;
            }
        }
        else if (err.request) {
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
    }
    catch (err) {
        next(err);
    }
}
async function bulkDeleteMediaObjects(req, res, next) {
    try {
        const result = await svc.bulkDeleteMediaObjects({ payload: req.body }, { headers: req.headers });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
module.exports = {
    listMedias, getMediaById, createMedia, updateMedia, deleteMedia,
    // Avatar Upload
    uploadAvatar,
    // Cover Image Upload
    uploadCoverImage,
    // Media Folders
    createMediaFolder,
    // Bulk Operations
    bulkUpdateMediaObjects, bulkDeleteMediaObjects
};
