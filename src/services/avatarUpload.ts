/**
 * Avatar Upload Service - Handles profile picture uploads
 */

import { api } from './apiClient';

export interface UploadAvatarResponse {
  success: boolean;
  mediaUrl: string;
  mediaId: string;
  message?: string;
}

/**
 * Upload avatar image to GoHighLevel media storage
 * @param file - The image file to upload
 * @param contactId - The GoHighLevel contact ID
 */
export async function uploadAvatar(file: File, contactId: string): Promise<UploadAvatarResponse> {
  try {
    console.log('Uploading avatar for contact:', contactId);
    
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
    const response = await api.post('/medias/upload-avatar', payload);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to upload avatar: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    const data = await response.json();
    console.log('Avatar upload successful:', data);
    
    return {
      success: true,
      mediaUrl: data.mediaUrl,
      mediaId: data.mediaId,
      message: data.message || 'Avatar uploaded successfully'
    };
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Failed to upload avatar: ${error.message}`);
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
 * Update contact avatar URL in GoHighLevel custom field
 * @param contactId - The GoHighLevel contact ID
 * @param avatarUrl - The uploaded avatar URL
 */
export async function updateContactAvatar(contactId: string, avatarUrl: string): Promise<void> {
  try {
    console.log('Updating contact avatar URL:', contactId, avatarUrl);
    
    const response = await api.put(`/members/${contactId}/avatar`, {
      avatarUrl: avatarUrl
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update contact avatar: ${response.statusText} - ${errorData.message || ''}`);
    }
    
    console.log('Contact avatar URL updated successfully');
  } catch (error: any) {
    console.error('Error updating contact avatar:', error);
    throw new Error(`Failed to update contact avatar: ${error.message}`);
  }
}

/**
 * Validate image file for avatar upload
 * @param file - The file to validate
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
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