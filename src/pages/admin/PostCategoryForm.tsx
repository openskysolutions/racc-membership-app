import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/admin/ImageUpload';
import { postCategoryService, uploadBlogImage } from '@/services/blogService';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  title: string;
  slug: string;
  img: string;
  description: string;
}

export default function PostCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const imageValue = watch('img');

  useEffect(() => {
    if (id) {
      loadCategory();
    }
  }, [id]);

  async function loadCategory() {
    try {
      const data = await postCategoryService.get(parseInt(id!));
      setValue('title', data.title);
      setValue('slug', data.slug);
      setValue('img', data.img || '');
      setValue('description', data.description || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load category',
        variant: 'destructive',
      });
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (id) {
        await postCategoryService.update(parseInt(id), data);
        toast({ title: 'Success', description: 'Category updated successfully' });
      } else {
        await postCategoryService.create(data);
        toast({ title: 'Success', description: 'Category created successfully' });
      }
      navigate('/admin/post-categories');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/admin/post-categories" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Categories
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit' : 'Create'} Post Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="Enter category title"
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
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to auto-generate from title
              </p>
            </div>

            <ImageUpload
              value={imageValue}
              onChange={(url) => setValue('img', url)}
              onUpload={uploadBlogImage}
              label="Category Image"
            />

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter category description"
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Category' : 'Create Category'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/post-categories')}
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
