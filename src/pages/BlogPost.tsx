import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { postService, type Post } from '@/services/blogService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import '@/components/admin/lexical/lexical-editor.css';
import { isNativeApp } from '@/lib/platform';

function cleanHtml(html: string): string {
  // Remove empty tags (tags that only contain whitespace, &nbsp;, or <br>)
  return html
    .replace(/<(h[1-6]|p|div|span)[^>]*>(&nbsp;|\s|<br\s*\/?>)*<\/\1>/gi, '')
    .replace(/<(h[1-6]|p|div|span)[^>]*><\/\1>/gi, '')
    .trim();
}

function makeFormLinksExternal(html: string): string {
  // On mobile, convert relative form links to full external URLs
  // This prevents React Router from treating them as internal navigation
  const isNative = isNativeApp();
  console.log('[makeFormLinksExternal] Running on native app:', isNative);
  console.log('[makeFormLinksExternal] Build timestamp:', new Date().toISOString());
  
  if (!isNative) {
    console.log('[makeFormLinksExternal] Not native, returning original HTML');
    return html;
  }
  
  const baseUrl = 'https://members.richfieldareachamber.com';
  
  // Replace relative /forms/ URLs with full external URLs and add target="_blank"
  let transformedHtml = html.replace(
    /href=["'](\/forms\/[^"']+)["']/gi,
    `href="${baseUrl}$1" target="_blank"`
  );
  
  // Log if any transformations occurred
  const matches = html.match(/href=["']\/forms\/[^"']+["']/gi);
  console.log('[makeFormLinksExternal] Found form links:', matches?.length || 0);
  if (matches) {
    console.log('[makeFormLinksExternal] Original URLs:', matches);
  }
  
  const transformedMatches = transformedHtml.match(/href=["']https:\/\/members\.richfieldareachamber\.com\/forms\/[^"']+["']/gi);
  console.log('[makeFormLinksExternal] Transformed URLs:', transformedMatches);
  
  return transformedHtml;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<{ src: string }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  useEffect(() => {
    if (post && contentRef.current) {
      // Use setTimeout to ensure DOM is fully rendered after dangerouslySetInnerHTML
      setTimeout(() => {
        setupGalleryListeners();
      }, 100);
    }
  }, [post]);

  function setupGalleryListeners() {
    const galleries = contentRef.current?.querySelectorAll('.blog-gallery');
    if (!galleries) return;

    galleries.forEach((gallery) => {
      const images = gallery.querySelectorAll('img');
      images.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.onclick = () => {
          const allImages = Array.from(images).map(i => ({ src: i.src }));
          setGalleryImages(allImages);
          setLightboxIndex(index);
          setLightboxOpen(true);
        };
      });
    });
  }

  async function loadPost() {
    setLoading(true);
    try {
      const data = await postService.getBySlug(slug!);
      setPost(data);

      // Load related posts from same category
      if (data.categoryId) {
        const related = await postService.list({ categoryId: data.categoryId });
        setRelatedPosts(related.filter(p => p.id !== data.id).slice(0, 3));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blog post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading post...</div>;
  }

  if (!post) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-gray-500">Post not found.</p>
        <div className="flex justify-center mt-4">
          <Link to="/blog">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-8 p-0 sm:px-3 md:px-6 lg:px-8">
      <div className="max-w-9xl mx-auto pt-8">
        {/* Back button */}
        {/* <div className="py-4">
          <Link to="/blog" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </div> */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main content */}
          <div className="lg:col-span-3 bg-white p-4 sm:p-3 md:p-4 lg:p-8 rounded-lg shadow-md">
            {/* Main image */}
            {post.mainImage && (
              <div className="h-auto sm:h-96 overflow-hidden rounded-lg mb-8 flex items-start">
                <img
                  src={post.mainImage}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-4 pb-8 border-b">
              {/* Category badge */}
              {post.category && (
                <span className="border border-primary text-primary px-4 py-2 rounded-full text-sm font-semibold">
                  {post.category.title}
                </span>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-4xl font-semibold uppercase mb-0">{post.title}</h1>
            </div>
            {/* Author info */}
            {/* {post.author && (
              <div className="flex items-center gap-4 mb-8 pb-8 border-b">
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-lg">{post.author.name}</p>
                  {post.author.bio && (
                    <p className="text-gray-600 text-sm">{post.author.bio}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{formatDate(post.createdAt)}</p>
                </div>
              </div>
            )} */}

            {/* Post body */}
            <div 
              ref={contentRef}
              className="lexical-blog-content max-w-none mb-8"
              dangerouslySetInnerHTML={{ __html: makeFormLinksExternal(cleanHtml(post.body)) }}
            />

            {/* Galleries */}
            {post.galleries && post.galleries.length > 0 && (
              <div className="mb-8">
                <Accordion type="single" collapsible defaultValue={`gallery-${post.galleries[0].id}`}>
                  {post.galleries.map((gallery) => (
                    <AccordionItem key={gallery.id} value={`gallery-${gallery.id}`}>
                      <AccordionTrigger className="text-2xl font-bold">
                        {gallery.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                          {gallery.images.map((image, index) => (
                            <div
                              key={index}
                              className="relative group cursor-pointer overflow-hidden rounded-lg"
                              onClick={() => {
                                setGalleryImages(gallery.images.map(img => ({ src: img })));
                                setLightboxIndex(index);
                                setLightboxOpen(true);
                              }}
                            >
                              <img
                                src={image}
                                alt={`${gallery.title} ${index + 1}`}
                                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={galleryImages}
              index={lightboxIndex}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author description */}
            {post.author?.description && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">About {post.author.name}</h3>
                  <div className="flex gap-4">
                    <img
                      src={post.author.image}
                      alt={post.author.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <p className="text-gray-600 flex-1">{post.author.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold mb-4">Related Posts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <img
                            src={relatedPost.mainImage}
                            alt={relatedPost.title}
                            className="w-full h-40 object-cover rounded-t-lg"
                          />
                          <div className="p-4">
                            <h4 className="font-bold mb-2 hover:text-primary transition-colors">
                              {relatedPost.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {formatDate(relatedPost.createdAt)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Desktop only */}
          <aside>
            <Card className="sticky top-36">
              <CardContent className="p-6">
                <h3 className="text-3xl font-bold mb-4">Join the Chamber</h3>
                <p className="text-gray-600 mb-6">
                  Become part of a thriving business community. Get access to exclusive networking events, 
                  business resources, and advocacy that helps your business grow and succeed.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Networking opportunities
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Business advocacy
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Marketing exposure
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    Professional development
                  </li>
                </ul>
                <Link to="/join">
                  <Button className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
