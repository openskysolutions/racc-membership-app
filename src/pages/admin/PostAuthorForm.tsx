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
import { postAuthorService, uploadBlogImage } from '@/services/blogService';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  slug: string;
  image: string;
  bio: string;
  description: string;
}

export default function PostAuthorForm() {
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

  const imageValue = watch('image');

  useEffect(() => {
    if (id) {
      loadAuthor();
    }
  }, [id]);

  async function loadAuthor() {
    try {
      const data = await postAuthorService.get(parseInt(id!));
      setValue('name', data.name);
      setValue('slug', data.slug);
      setValue('image', data.image);
      setValue('bio', data.bio || '');
      setValue('description', data.description || '');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load author',
        variant: 'destructive',
      });
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!data.image) {
      toast({
        title: 'Error',
        description: 'Author image is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await postAuthorService.update(parseInt(id), data);
        toast({ title: 'Success', description: 'Author updated successfully' });
      } else {
        await postAuthorService.create(data);
        toast({ title: 'Success', description: 'Author created successfully' });
      }
      navigate('/admin/post-authors');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save author',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/admin/post-authors" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Authors
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit' : 'Create'} Post Author</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
                placeholder="Enter author name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="auto-generated-from-name"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to auto-generate from name
              </p>
            </div>

            <ImageUpload
              value={imageValue}
              onChange={(url) => setValue('image', url)}
              onUpload={uploadBlogImage}
              label="Author Image *"
              required
            />

            <div>
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea
                id="bio"
                {...register('bio')}
                placeholder="Enter a short bio (1-2 sentences)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter full author description"
                rows={6}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Author' : 'Create Author'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/post-authors')}
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
