import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { postAuthorService, type PostAuthor } from '@/services/blogService';
import { useToast } from '@/hooks/use-toast';

export default function PostAuthors() {
  const [authors, setAuthors] = useState<PostAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAuthors();
  }, []);

  async function loadAuthors() {
    try {
      const data = await postAuthorService.list();
      setAuthors(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load authors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await postAuthorService.delete(id);
      toast({ title: 'Success', description: 'Author deleted successfully' });
      loadAuthors();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete author',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Post Authors</h1>
        <Link to="/admin/post-authors/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Author
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Authors</CardTitle>
        </CardHeader>
        <CardContent>
          {authors.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No authors yet. Create your first one!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Author</th>
                    <th className="text-left py-3 px-4">Slug</th>
                    <th className="text-center py-3 px-4">Posts</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((author) => (
                    <tr key={author.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={author.image}
                            alt={author.name}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                          <div>
                            <div className="font-medium">{author.name}</div>
                            {author.bio && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {author.bio}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{author.slug}</td>
                      <td className="py-3 px-4 text-center">
                        {author._count?.posts || 0}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Link to={`/admin/post-authors/${author.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(author.id, author.name)}
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
    </div>
  );
}
