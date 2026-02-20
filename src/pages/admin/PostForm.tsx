import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/admin/ImageUpload';
import LexicalEditor from '@/components/admin/LexicalEditor';
import GalleryManager from '@/components/admin/GalleryManager';
import { postService, postCategoryService, uploadBlogImage, galleryService, type PostCategory, type Gallery } from '@/services/blogService';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';

interface FormData {
  title: string;
  slug: string;
  categoryId: number;
  tags: string;
  mainImage: string;
  metadata: string;
  body: string;
  published: boolean;
}

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const imageValue = watch('mainImage');
  const bodyValue = watch('body');
  const categoryIdValue = watch('categoryId');
  const publishedValue = watch('published');

  useEffect(() => {
    loadCategories();
    if (id) {
      loadPost();
    }
  }, [id]);

  async function loadCategories() {
    try {
      const categoriesData = await postCategoryService.list();
      setCategories(categoriesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  }

  async function loadPost() {
    try {
      const data = await postService.get(id!);
      console.log('Loaded post data:', { id, title: data.title, bodyLength: data.body?.length, body: data.body?.substring(0, 100) });
      setValue('title', data.title);
      setValue('slug', data.slug);
      setValue('categoryId', data.categoryId);
      setValue('tags', data.tags?.join(', ') || '');
      setValue('mainImage', data.mainImage);
      setValue('metadata', data.metadata || '');
      setValue('body', data.body);
      setValue('published', data.published || false);
      console.log('Set body value to:', data.body?.substring(0, 100));
      
      // Load galleries if they exist
      if (data.galleries) {
        setGalleries(data.galleries);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load post',
        variant: 'destructive',
      });
    }
  }

  async function handleAddGallery(title: string, images: string[]) {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Please save the post first before adding galleries',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newGallery = await galleryService.create(id, { title, images });
      setGalleries([...galleries, newGallery]);
      toast({ title: 'Success', description: 'Gallery added successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add gallery',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateGallery(galleryId: string, title: string, images: string[]) {
    try {
      const updatedGallery = await galleryService.update(galleryId, { title, images });
      setGalleries(galleries.map(g => g.id === galleryId ? updatedGallery : g));
      toast({ title: 'Success', description: 'Gallery updated successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update gallery',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteGallery(galleryId: string) {
    try {
      await galleryService.delete(galleryId);
      setGalleries(galleries.filter(g => g.id !== galleryId));
      toast({ title: 'Success', description: 'Gallery deleted successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete gallery',
        variant: 'destructive',
      });
    }
  }
  function handleReorderGalleries(reorderedGalleries: Gallery[]) {
    setGalleries(reorderedGalleries);
    
    // Persist the order to the backend
    if (id) {
      const galleryIds = reorderedGalleries.map(g => g.id);
      galleryService.reorder(id, galleryIds).catch((error) => {
        console.error('Failed to persist gallery order:', error);
        toast({
          title: 'Warning',
          description: 'Gallery reordered locally but failed to save to server',
          variant: 'destructive',
        });
      });
    }
  }
  const onSubmit = async (data: FormData) => {
    if (!data.body) {
      toast({
        title: 'Error',
        description: 'Post body is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const postData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      };

      if (id) {
        await postService.update(id, postData);
        toast({ title: 'Success', description: 'Post updated successfully' });
      } else {
        const newPost = await postService.create(postData);
        toast({ title: 'Success', description: 'Post created successfully' });
        // Navigate to edit the newly created post
        navigate(`/admin/posts/${newPost.id}`);
      }
      
      // Notify navbar and other components that posts have been updated
      window.dispatchEvent(new CustomEvent('postsUpdated'));
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Link to="/admin/posts" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Posts
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit' : 'Create'} Blog Post</CardTitle>
          {user && (
            <p className="text-sm text-muted-foreground">
              Author: {user.name}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4'>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Enter post title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="auto-generated-from-title"
                />
                <p className="text-sm text-gray-500 mb-1">
                  Leave empty to auto-generate from title
                </p>
              </div>

              <div>
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={categoryIdValue?.toString()}
                  onValueChange={(value) => setValue('categoryId', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-sm text-red-600 mb-1">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-sm text-gray-500 mb-1">
                  Comma-separated list of tags
                </p>
              </div>

              <ImageUpload
                value={imageValue}
                onChange={(url) => setValue('mainImage', url)}
                onUpload={uploadBlogImage}
                label="Main Image"
                required={false}
              />

              <div>
                <Label htmlFor="metadata">SEO Metadata</Label>
                <Textarea
                  id="metadata"
                  {...register('metadata')}
                  placeholder="Enter SEO description, keywords, etc."
                  rows={5}
                />
              </div>
            </div>
            <div>
              <Label>Post Body *</Label>
              <LexicalEditor
                key={id || 'new'}
                value={bodyValue || ''}
                onChange={(html: string) => setValue('body', html)}
              />
              {errors.body && (
                <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>
              )}
            </div>

            {id && (
              <div>
                <GalleryManager
                  galleries={galleries}
                  onAdd={handleAddGallery}
                  onUpdate={handleUpdateGallery}
                  onDelete={handleDeleteGallery}
                  onReorder={handleReorderGalleries}
                  onUpload={uploadBlogImage}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={publishedValue}
                onCheckedChange={(checked) => setValue('published', checked as boolean)}
              />
              <Label htmlFor="published" className="cursor-pointer">
                Published (visible to public)
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Post' : 'Create Post'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/posts')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
