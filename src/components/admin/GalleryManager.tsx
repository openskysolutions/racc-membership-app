import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import GalleryUpload, { type GalleryUploadRef } from './GalleryUpload';
import { type Gallery } from '@/services/blogService';

interface GalleryManagerProps {
  galleries: Gallery[];
  onAdd: (title: string, images: string[]) => Promise<void>;
  onUpdate: (id: string, title: string, images: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (galleries: Gallery[]) => void;
  onUpload: (file: File) => Promise<string>;
}

export default function GalleryManager({ galleries, onAdd, onUpdate, onDelete, onReorder, onUpload }: GalleryManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [galleryToDelete, setGalleryToDelete] = useState<{ id: string; title: string } | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const galleryUploadRef = useRef<GalleryUploadRef>(null);

  // Galleries are already ordered by displayOrder from the backend

  const handleOpenDialog = (gallery?: Gallery) => {
    if (gallery) {
      setEditingGallery(gallery);
      setTitle(gallery.title);
    } else {
      setEditingGallery(null);
      setTitle('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGallery(null);
    setTitle('');
  };

  const handleSave = async () => {
    const images = galleryUploadRef.current?.getImages() || [];
    
    if (!title.trim() || images.length === 0) {
      return;
    }

    setLoading(true);
    try {
      if (editingGallery) {
        await onUpdate(editingGallery.id, title, images);
      } else {
        await onAdd(title, images);
      }
      handleCloseDialog();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (gallery: Gallery) => {
    setGalleryToDelete({ id: gallery.id, title: gallery.title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (galleryToDelete) {
      setLoading(true);
      try {
        await onDelete(galleryToDelete.id);
        setDeleteDialogOpen(false);
        setGalleryToDelete(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newGalleries = [...galleries];
    const [draggedGallery] = newGalleries.splice(draggedIndex, 1);
    newGalleries.splice(dropIndex, 0, draggedGallery);

    onReorder(newGalleries);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Galleries</h3>
        <Button type="button" onClick={() => handleOpenDialog()} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Gallery
        </Button>
      </div>

      {galleries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No galleries yet. Click "Add Gallery" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {galleries.map((gallery, index) => (
            <Card 
              key={gallery.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${
                dragOverIndex === index ? 'border-blue-500 border-2' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <CardTitle className="text-base">{gallery.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(gallery)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(gallery)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {gallery.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                  {gallery.images.length > 4 && (
                    <div className="flex items-center justify-center bg-muted rounded text-sm text-muted-foreground">
                      +{gallery.images.length - 4} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGallery ? 'Edit Gallery' : 'Add Gallery'}</DialogTitle>
            <DialogDescription>
              {editingGallery ? 'Update the gallery title and images.' : 'Create a new gallery with a title and images.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="gallery-title">Gallery Title</Label>
              <Input
                id="gallery-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Event Photos, Product Showcase"
              />
            </div>
            <div>
              <Label>Images</Label>
              <GalleryUpload
                ref={galleryUploadRef}
                initialImages={editingGallery?.images || []}
                onUpload={onUpload}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : editingGallery ? 'Update Gallery' : 'Add Gallery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <DialogHeader>
            <AlertDialogTitle>Delete Gallery</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the gallery "{galleryToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </DialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
