/**
 * CoverImage Upload Service - Handles profile picture uploads
 */

import { api } from './apiClient';

export interface UploadCoverImageResponse {
  success: boolean;
  mediaUrl: string;
  mediaId: string;
  message?: string;
}

/**
 * Upload coverImage image to GoHighLevel media storage
 * @param file - The image file to upload
 * @param contactId - The GoHighLevel contact ID
 */
export async function uploadCoverImage(file: File, contactId: string): Promise<UploadCoverImageResponse> {
  try {
    // Convert file to base64
    const fileData = await fileToBase64(file);
    
    // Prepare JSON payload
    const payload = {
      contactId: contactId,
      locationId: '5FAB1z0AhuVlEdqOzjVX', // Your GHL location ID
      fileData: fileData,
      fileName: file.name,
      mimeType: file.type
    };
    
    // Upload to GoHighLevel media storage
    const response = await api.post('/medias/upload-coverImage', payload);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to upload coverImage: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      mediaUrl: data.mediaUrl,
      mediaId: data.mediaId,
      message: data.message || 'CoverImage uploaded successfully'
    };
  } catch (error: any) {
    console.error('Error uploading coverImage:', error);
    throw new Error(`Failed to upload coverImage: ${error.message}`);
  }
}

/**
 * Convert File to base64 string
 * @param file - The file to convert
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Update contact coverImage URL in GoHighLevel custom field
 * @param contactId - The GoHighLevel contact ID
 * @param coverImageUrl - The uploaded coverImage URL
 */
export async function updateContactCoverImage(contactId: string, coverImageUrl: string): Promise<void> {
  try {
    console.log('Updating contact coverImage URL:', contactId, coverImageUrl);
    
    const response = await api.put(`/members/${contactId}/coverImage`, {
      coverImageUrl: coverImageUrl
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update contact coverImage: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    console.log('Contact coverImage URL updated successfully');
  } catch (error: any) {
    console.error('Error updating contact coverImage:', error);
    throw new Error(`Failed to update contact coverImage: ${error.message}`);
  }
}

/**
 * Validate image file for coverImage upload
 * @param file - The file to validate
 */
export function validateCoverImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG)'
    };
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }
  
  return { valid: true };
}

/**
 * Create a preview URL for the selected image
 * @param file - The image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL to prevent memory leaks
 * @param previewUrl - The preview URL to revoke
 */
export function revokeImagePreview(previewUrl: string): void {
  URL.revokeObjectURL(previewUrl);
}