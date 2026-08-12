import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  uploadCoverImage, 
  updateBusinessCoverImage,
  updateContactCoverImage, 
  validateCoverImageFile, 
  createImagePreview, 
  revokeImagePreview,
} from '@/services/coverImageUpload';

interface CoverImageUploadProps {
  currentCoverImage?: string;
  contactId: string;
  businessId?: string;   // if provided, saves via PATCH /businesses/:id instead of contact endpoint
  fallbackText: string;
  onCoverImageUpdated: (newCoverImageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  currentCoverImage,
  contactId,
  businessId,
  // fallbackText,
  onCoverImageUpdated,
  size = 'lg',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // const sizeClasses = {
  //   sm: 'h-12 w-12',
  //   md: 'h-16 w-16',
  //   lg: 'h-20 w-20'
  // };

  const buttonSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateCoverImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    const preview = createImagePreview(file);
    setPreviewUrl(preview);

    // Start upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      // Upload to GoHighLevel media storage
      const uploadResult = await uploadCoverImage(file, businessId || contactId);
      
      // Save the new URL: use business endpoint when businessId provided, else legacy contact endpoint
      if (businessId) {
        await updateBusinessCoverImage(businessId, uploadResult.mediaUrl);
      } else {
        await updateContactCoverImage(contactId, uploadResult.mediaUrl);
      }
      
      // Clean up preview
      if (previewUrl) {
        revokeImagePreview(previewUrl);
        setPreviewUrl(null);
      }
      
      // Notify parent component
      onCoverImageUpdated(uploadResult.mediaUrl);
      
    } catch (err: any) {
      console.error('CoverImage upload failed:', err);
      setError(err.message || 'Failed to upload coverImage');
      
      // Clean up preview on error
      if (previewUrl) {
        revokeImagePreview(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleRemovePreview = () => {
    if (previewUrl) {
      revokeImagePreview(previewUrl);
      setPreviewUrl(null);
    }
    setError(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // const displayCoverImage = previewUrl || currentCoverImage;

  return (
    <>
      {/* Camera button — absolute in hero bottom-right corner */}
      <div className="absolute bottom-4 right-4 z-50">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={`relative flex items-center gap-2 rounded-full ${buttonSizeClasses[size]} p-0 shadow-lg border-2 border-white bg-white/20 hover:bg-neutral-500/70 ${!uploading ? 'animate-pulse' : ''}`}
          onClick={handleButtonClick}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="!h-5 !w-5 text-white" />
          )}
          <span className="absolute right-12 text-sm text-white whitespace-nowrap">
            {currentCoverImage ? 'Edit Cover Image' : 'Add Cover Image'}
          </span>
        </Button>

        {/* Remove Preview Button */}
        {previewUrl && !uploading && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-1 -right-1 rounded-full h-6 w-6 p-0 shadow-lg"
            onClick={handleRemovePreview}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Error display — anchored above the button */}
      {error && (
        <div className="absolute bottom-16 right-4 z-50 max-w-xs">
          <Alert variant="destructive" className="p-2">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default CoverImageUpload;