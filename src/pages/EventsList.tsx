import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWordPressEventPages, WordPressPost } from '@/services/wordpress';
import { isNativeApp } from '@/lib/platform';
import { openExternalUrl } from '@/lib/externalBrowser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Grid3x3, List } from 'lucide-react';

export default function EventsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPosts();
  }, [page, search]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { pages: fetchedPosts, totalPages: total } = await getWordPressEventPages({
        page,
        per_page: 9,
        search: search || undefined,
      });
      setPosts(fetchedPosts);
      setTotalPages(total);
    } catch (err) {
      setError('Failed to load event pages. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //   });
  // };

  // const getFeaturedImage = (post: WordPressPost) => {
  //   return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
  // };

  // const getAuthorName = (post: WordPressPost) => {
  //   return post._embedded?.author?.[0]?.name || 'Unknown Author';
  // };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-0">Events</h1>
        <p className="text-muted-foreground text-lg">
          Discover upcoming chamber events and activities
        </p>
      </div>

      {/* Search and View Toggle */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" className="h-10 w-10">
            <Search className="h-4 w-4 mr-0" />
          </Button>
          
          {/* View Mode Toggle */}
          <div className="flex border rounded-md ml-auto h-10">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none h-full"
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none h-full"
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-8">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                {/* <Skeleton className="h-48 w-full mb-4" /> */}
                <Skeleton className="h-6 w-3/4 mb-2" />
                {/* <Skeleton className="h-4 w-1/2" /> */}
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Posts Grid/List */}
      {!loading && posts.length > 0 && (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
            {posts.map((post) => {
              // const featuredImage = getFeaturedImage(post);

              if (viewMode === 'list') {
                return (
                  <Card key={post.id} className="flex flex-row overflow-hidden hover:shadow-lg transition-shadow">
                    {/* {featuredImage && (
                      <div className="w-48 h-full overflow-hidden flex-shrink-0">
                        <img
                          src={featuredImage}
                          alt={stripHtml(post.title.rendered)}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    )} */}
                    <div className="flex flex-col flex-1">
                      <CardHeader>
                        <CardTitle className="line-clamp-2">
                          {stripHtml(post.title.rendered)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-muted-foreground line-clamp-2">
                          {stripHtml(post.excerpt.rendered)}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="default"
                          onClick={async () => {
                            if (isNativeApp()) {
                              await openExternalUrl(`/event-pages/${post.slug}`);
                            } else {
                              navigate(`/event-pages/${post.slug}`);
                            }
                          }}
                        >
                          View Full Details
                        </Button>
                      </CardFooter>
                    </div>
                  </Card>
                );
              }

              return (
                <Card key={post.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  {/* {featuredImage && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={featuredImage}
                        alt={stripHtml(post.title.rendered)}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  )} */}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">
                      {stripHtml(post.title.rendered)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-muted-foreground line-clamp-3">
                      {stripHtml(post.excerpt.rendered)}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={async () => {
                        if (isNativeApp()) {
                          await openExternalUrl(`/event-pages/${post.slug}`);
                        } else {
                          navigate(`/event-pages/${post.slug}`);
                        }
                      }}
                    >
                      View Full Details
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {search ? 'No events found matching your search.' : 'No events available yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
