import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWordPressPageBySlug, WordPressPost } from '@/services/wordpress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIframeAutoResize } from '@/hooks/useIframeAutoResize';

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<WordPressPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Auto-resize iframes based on content - run when post changes
  useIframeAutoResize(contentRef);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPost = await getWordPressPageBySlug(slug!);
      setPost(fetchedPost);
    } catch (err) {
      setError('Failed to load event page. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFeaturedImage = (post: WordPressPost) => {
    return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
  };

  const getAuthorName = (post: WordPressPost) => {
    return post._embedded?.author?.[0]?.name || 'Unknown Author';
  };

  const getAuthorAvatar = (post: WordPressPost) => {
    return post._embedded?.author?.[0]?.avatar_urls?.['96'] || null;
  };

  const getCategories = (post: WordPressPost) => {
    return post._embedded?.['wp:term']?.[0] || [];
  };

  const getTags = (post: WordPressPost) => {
    return post._embedded?.['wp:term']?.[1] || [];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button asChild variant="ghost" className="mb-8">
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error || 'Event not found'}
        </div>
      </div>
    );
  }

  const featuredImage = getFeaturedImage(post);
  const authorName = getAuthorName(post);
  const authorAvatar = getAuthorAvatar(post);
  const categories = getCategories(post);
  const tags = getTags(post);

  return (
    <div className="container mx-auto px-4 pb-8 max-w-4xl">
      {/* Back Button */}
      <Link to="/events" className='flex items-center h-10'>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Link>

      {/* Featured Image */}
      {featuredImage && (
        <div className="w-full h-96 overflow-hidden rounded-lg mb-8">
          <img
            src={featuredImage}
            alt={stripHtml(post.title.rendered)}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <Badge key={category.id} variant="secondary">
              {category.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Title */}
      {/* <h1
        className="text-4xl md:text-5xl font-bold mb-4"
        dangerouslySetInnerHTML={{ __html: post.title.rendered }}
      /> */}

      {/* Meta Information */}
      {/* <div className="flex items-center gap-6 mb-8 pb-8 border-b">
        <div className="flex items-center gap-2">
          {authorAvatar && (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="flex items-center gap-1 text-sm font-medium">
              <User className="h-3 w-3" />
              {authorName}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDate(post.date)}
            </div>
          </div>
        </div>
      </div> */}

      {/* Content */}
      <div
        ref={contentRef}
        className="wp-content mb-8"
        dangerouslySetInnerHTML={{ __html: post.rendered_content || post.content.rendered }}
      />

      {/* Tags */}
      {tags.length > 0 && (
        <div className="pt-8 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tags:</span>
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
