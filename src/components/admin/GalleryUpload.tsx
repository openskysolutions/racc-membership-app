import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { X, Upload } from 'lucide-react';

interface GalleryUploadProps {
  initialImages?: string[];
  onUpload: (file: File) => Promise<string>;
}

export interface GalleryUploadRef {
  getImages: () => string[];
}

const GalleryUpload = forwardRef<GalleryUploadRef, GalleryUploadProps>(
  ({ initialImages = [], onUpload }, ref) => {
    const [images, setImages] = useState<string[]>(initialImages);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update images when initialImages changes
    useEffect(() => {
      setImages(initialImages);
    }, [initialImages]);

    // Expose getImages method for parent to retrieve current images
    useImperativeHandle(ref, () => ({
      getImages: () => images
    }));

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }

      try {
        const url = await onUpload(file);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    setImages([...images, ...uploadedUrls]);
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }

      try {
        const url = await onUpload(file);
        uploadedUrls.push(url);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    setImages([...images, ...uploadedUrls]);
    setUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          Select multiple images (PNG, JPG, GIF)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {uploading && (
        <p className="text-sm text-blue-600 text-center">Uploading images...</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

GalleryUpload.displayName = 'GalleryUpload';

export default GalleryUpload;
