import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uploadBlogImage } from '@/services/blogService';
import { toast } from 'sonner';

interface InsertImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (src: string, altText: string) => void;
}

export default function InsertImageDialog({ isOpen, onClose, onInsert }: InsertImageDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Create preview for display only
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUploadedImage(result);
      };
      reader.readAsDataURL(file);

      // Upload the actual file to storage
      setUploading(true);
      try {
        const url = await uploadBlogImage(file);
        setUploadedImageUrl(url);
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
        setUploadedImage('');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleInsert = () => {
    const src = activeTab === 'upload' ? uploadedImageUrl : imageUrl;
    if (src) {
      onInsert(src, altText || 'Image');
      handleClose();
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setAltText('');
    setUploadedImage('');
    setUploadedImageUrl('');
    setUploading(false);
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const canInsert = activeTab === 'upload' 
    ? uploadedImageUrl && !uploading
    : imageUrl;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image from your computer or paste a URL
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Choose Image</Label>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            
            {uploadedImage && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md p-2 bg-gray-50">
                  <img
                    src={uploadedImage}
                    alt="Preview"
                    className="max-h-[200px] mx-auto object-contain"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="alt-text-upload">Alt Text (optional)</Label>
              <Input
                id="alt-text-upload"
                type="text"
                placeholder="Describe the image..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            
            {imageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md p-2 bg-gray-50">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-[200px] mx-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="alt-text-url">Alt Text (optional)</Label>
              <Input
                id="alt-text-url"
                type="text"
                placeholder="Describe the image..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleInsert}
            disabled={canInsert ? false : true}
          >
            {uploading ? 'Uploading...' : 'Insert Image'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
