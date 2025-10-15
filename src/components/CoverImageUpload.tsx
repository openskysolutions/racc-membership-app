import React, { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  uploadCoverImage, 
  updateContactCoverImage, 
  validateCoverImageFile, 
  createImagePreview, 
  revokeImagePreview,
} from '@/services/coverImageUpload';

interface CoverImageUploadProps {
  currentCoverImage?: string;
  contactId: string;
  fallbackText: string;
  onCoverImageUpdated: (newCoverImageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const CoverImageUpload: React.FC<CoverImageUploadProps> = ({
  currentCoverImage,
  contactId,
  fallbackText,
  onCoverImageUpdated,
  size = 'lg',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

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
      const uploadResult = await uploadCoverImage(file, contactId);
      
      // Update contact with new coverImage URL
      await updateContactCoverImage(contactId, uploadResult.mediaUrl);
      
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

  const displayCoverImage = previewUrl || currentCoverImage;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* CoverImage with Upload Button */}
      <div className="relative">
        <img src={displayCoverImage} alt={fallbackText} className={`rounded ${sizeClasses[size]} object-cover`} />
        
        {/* Upload Button Overlay */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={`absolute -bottom-1 -right-1 rounded-full ${buttonSizeClasses[size]} p-0 shadow-lg border-2 border-background`}
          onClick={handleButtonClick}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
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

      {/* Upload Instructions */}
      {!previewUrl && !uploading && (
        <div className="text-center">
          {/* <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled}
            className="text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload Photo
          </Button> */}
          {/* <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG (max 5MB)
          </p> */}
        </div>
      )}

      {/* Loading State */}
      {uploading && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Uploading coverImage...
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-sm">
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CoverImageUpload;