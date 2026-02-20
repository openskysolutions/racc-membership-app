import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { postService, postCategoryService, type Post, type PostCategory } from '@/services/blogService';
import { useToast } from '@/hooks/use-toast';

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, []);

  async function loadPosts() {
    try {
      // Admin page should show all posts including unpublished
      const data = await postService.list({ includeUnpublished: true });
      setPosts(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await postCategoryService.list();
      setCategories(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string, title: string) {
    setPostToDelete({ id, title });
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!postToDelete) return;

    try {
      await postService.delete(postToDelete.id);
      toast({ title: 'Success', description: 'Post deleted successfully' });
      
      // Notify navbar and other components that posts have been updated
      window.dispatchEvent(new CustomEvent('postsUpdated'));
      
      loadPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete post',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  }

  async function handleDeleteCategory(id: number, title: string) {
    setCategoryToDelete({ id, title });
    setDeleteCategoryDialogOpen(true);
  }

  async function confirmDeleteCategory() {
    if (!categoryToDelete) return;

    try {
      await postCategoryService.delete(categoryToDelete.id);
      toast({ title: 'Success', description: 'Category deleted successfully' });
      loadCategories();
      loadPosts(); // Reload posts as they may reference this category
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Management</h1>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                All Posts
                <Link to="/admin/posts/new" className="hidden md:block">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Post
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className='px-0 pb-0'>
              {posts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No posts yet. Create your first one!</p>
              ) : (
                <div>
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-start gap-3 p-4 border-t hover:bg-gray-50 transition-colors"
                    >
                      {/* Post Image */}
                      <img
                        src={post.mainImage || '/images/blog-post-placeholder.svg'}
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/images/blog-post-placeholder.svg') {
                            target.src = '/images/blog-post-placeholder.svg';
                          }
                        }}
                      />
                      
                      {/* Content Section */}
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="font-medium text-base mb-1">{post.title}</div>
                        
                        {/* Slug (hidden on mobile) */}
                        <div className="text-sm text-gray-500 mb-2 hidden sm:block">{post.slug}</div>
                        
                        {/* Category and Date - Mobile only */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 md:hidden">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Category:</span>
                            {post.category?.title || 'Uncategorized'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Date:</span>
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Category and Date - Desktop only */}
                      <div className="hidden md:flex flex-col gap-1 text-sm text-gray-600 flex-shrink-0 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Category:</span>
                          <span>{post.category?.title || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Date:</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="hidden md:flex flex-col gap- flex-shrink-0">
                        <Link to={`/admin/posts/${post.id}/edit`}>
                          <Button 
                            variant="ghost" 
                            className='h-8 w-8 hover:bg-gray-200 hover:text-gray-900'
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          className='h-8 w-8 text-red-700 hover:text-red-900 hover:bg-red-100'
                          onClick={() => handleDelete(post.id, post.title)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                All Categories
                <Link to="/admin/post-categories/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className='px-0 pb-0'>
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No categories yet. Create your first one!</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Title</th>
                        <th className="text-left py-3 px-4 hidden sm:table-cell">Slug</th>
                        <th className="text-center py-3 px-4">Posts</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {category.img && (
                                <img
                                  src={category.img}
                                  alt={category.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div>
                                <span className="font-medium">{category.title}</span>
                                <div className="text-sm text-gray-500 sm:hidden">{category.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">{category.slug}</td>
                          <td className="py-3 px-4 text-center">
                            {category._count?.posts || 0}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Link to={`/admin/post-categories/${category.id}/edit`}>
                                <Button 
                                  variant="ghost" 
                                  className='h-8 w-8 hover:bg-gray-200 hover:text-gray-900'
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                className='h-8 w-8 text-red-700 hover:text-red-900 hover:bg-red-100'
                                onClick={() => handleDeleteCategory(category.id, category.title)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Post Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
