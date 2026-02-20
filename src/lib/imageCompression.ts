/**
 * Image Compression Utility
 * Automatically compresses images before upload to reduce file size
 * while maintaining acceptable quality
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

/**
 * Compress an image file to reduce size before upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions = {
    maxSizeMB: 4, // Target 4MB (leaves room before 5MB limit)
    maxWidthOrHeight: 2048, // Reasonable max dimension for web/mobile
    useWebWorker: true, // Use web worker for better performance
    fileType: file.type, // Preserve original file type
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    // If file is already under 4MB, return as-is (no compression needed)
    if (file.size <= 4 * 1024 * 1024) {
      console.log('File is already under 4MB, skipping compression');
      return file;
    }

    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1), '% reduction');
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, throw error so user knows
    throw new Error('Failed to compress image. Please try a different image or reduce the file size manually.');
  }
}

/**
 * Validate if file is an image
 * @param file - File to validate
 * @returns true if file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
}

/**
 * Get human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
