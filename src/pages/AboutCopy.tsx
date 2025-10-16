import { useState, useEffect, FC } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { pageContentService, PageContent } from '@/services/aboutUs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Editor from '@/components/PageEditorWrapper';
import DocumentRenderer from '@/components/DocumentRenderer';
import { Edit, AlertTriangle, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';

const AboutCopyPage: FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const slug = 'about-us-copy';

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pageContentService.getPageContent(slug);
      setContent(data);
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newContent: string) => {
    if (!content) return;

    console.log('New content to save:', newContent);

    try {
      setSaving(true);
      const updatedContent = await pageContentService.updatePageContent(slug, content.title, newContent);
      setContent(updatedContent);
      setIsEditing(false);
      toast.success('Content updated successfully!');
    } catch (err) {
      console.error('Error saving content:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <section className="container py-8 max-w-6xl mx-auto px-3 md:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading content...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-8 max-w-6xl mx-auto px-3 md:px-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={loadContent} variant="outline">
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  if (!content) {
    return (
      <section className="container py-8 max-w-6xl mx-auto px-3 md:px-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>No content available.</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <div className="h-full flex flex-col flex-grow">
      {isEditing ? (
        // Full Page Edit Mode
        <div className="w-full h-full flex flex-col flex-grow">
          {/* Edit Mode Header */}
          <div className="px-6 py-4 sticky top-0 z-10">
            <div className="max-w-none mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">Editing: {content?.title}</h1>
              </div>
              {saving && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Saving changes...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Full Page Editor */}
          <Editor
            initialContent={content?.content || ''}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        // Display Mode
        <div>
          {/* Admin Controls */}
          {isAdmin && (
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Version: <span className='font-semibold border-r-1 border-r-muted-foreground pr-2 mr-1'>{content.version}</span> Last modified: <span className='font-semibold'>{new Date(content.lastModified).toLocaleDateString()} </span> 
                  {content.lastModifiedBy && 
                    <>
                      <span>by</span>
                      <span className='font-semibold'> {content.lastModifiedBy}</span>
                    </>
                  }
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant='ghost'
                    size="sm"
                    className='font-semibold'
                    onClick={() => {
                      // TODO: Implement history viewer
                      toast.info('History feature coming soon!');
                    }}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant='ghost'
                    className='font-semibold'
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rendered Page Content */}
          <div className="bg-white">
            <DocumentRenderer 
              content={content.content}
              className="container max-w-6xl mx-auto px-6 py-8"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutCopyPage;