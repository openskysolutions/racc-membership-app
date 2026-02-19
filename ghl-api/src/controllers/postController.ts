import { Request, Response } from 'express';
import { generateSlug } from '@/utils/slugGenerate';
import { prisma } from '@/lib/prisma';

/**
 * GET /posts
 * List all posts with filtering and pagination
 */
export async function listPosts(req: Request, res: Response) {
  try {
    const { categoryId, authorId, tag, limit, skip, includeUnpublished } = req.query;
    const user = (req as any).user;
    const isAdmin = user?.role === 'admin';

    const where: any = {};
    // Only show unpublished posts if explicitly requested AND user is admin
    // Default behavior: show only published posts (even for admins)
    const shouldIncludeUnpublished = includeUnpublished === 'true' && isAdmin;
    if (!shouldIncludeUnpublished) {
      where.published = true;
    }
    
    if (categoryId) where.categoryId = parseInt(categoryId as string);
    if (authorId) where.authorId = parseInt(authorId as string);
    if (tag) where.tags = { has: tag as string };

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true
          }
        },
        category: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        galleries: true
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: parseInt(limit as string) }),
      ...(skip && { skip: parseInt(skip as string) })
    });

    res.json({
      success: true,
      data: posts
    });
  } catch (error: any) {
    console.error('Error listing posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list posts',
      details: error.message
    });
  }
}

/**
 * GET /posts/slug/:slug
 * Get a single post by slug
 */
export async function getPostBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const user = (req as any).user;
    const isAdmin = user?.role === 'admin';

    const post = await prisma.post.findFirst({
      where: { 
        slug,
        ...(isAdmin ? {} : { published: true })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            bio: true
          }
        },
        category: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true
          }
        },
        galleries: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error: any) {
    console.error('Error getting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post',
      details: error.message
    });
  }
}

/**
 * GET /posts/:id
 * Get a single post by ID
 */
export async function getPost(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        galleries: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error: any) {
    console.error('Error getting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post',
      details: error.message
    });
  }
}

/**
 * POST /posts
 * Create a new post
 */
export async function createPost(req: Request, res: Response) {
  try {
    const {
      title,
      metadata,
      slug: providedSlug,
      categoryId,
      tags,
      mainImage,
      body
    } = req.body;

    if (!title || !categoryId || !body) {
      return res.status(400).json({
        success: false,
        error: 'Title, categoryId, and body are required'
      });
    }

    // Get the current user from the request
    const currentUser = (req as any).user;
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Get or create PostAuthor for current user
    // Look for an author with the user's email in the name or slug
    let author = await prisma.postAuthor.findFirst({
      where: {
        OR: [
          { slug: generateSlug(currentUser.email) },
          { name: { contains: currentUser.email } }
        ]
      }
    });

    // If no author exists, create one
    if (!author) {
      // Try to get user's name from GHL contact if available
      let authorName = currentUser.email;
      let authorImage = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.email);
      
      // If we have ghlContactId, we could fetch their name/image here
      // For now, use email as the name
      
      author = await prisma.postAuthor.create({
        data: {
          name: authorName,
          slug: generateSlug(currentUser.email),
          image: authorImage,
          bio: `Blog author`
        }
      });
    }

    // Generate slug from title if not provided
    const slug = providedSlug || generateSlug(title);

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug }
    });

    if (existingPost) {
      return res.status(400).json({
        success: false,
        error: 'Post with this slug already exists'
      });
    }

    // Verify category exists
    const category = await prisma.postCategory.findUnique({ where: { id: parseInt(categoryId) } });

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category not found'
      });
    }

    const post = await prisma.post.create({
      data: {
        title,
        metadata: metadata || null,
        slug,
        authorId: author.id,
        categoryId: parseInt(categoryId),
        tags: tags || [],
        mainImage,
        body
      },
      include: {
        author: true,
        category: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
      details: error.message
    });
  }
}

/**
 * PUT /posts/:id
 * Update a post
 */
export async function updatePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      metadata,
      slug,
      authorId,
      categoryId,
      tags,
      mainImage,
      body,
      published
    } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if new slug conflicts with another post
    if (slug && slug !== existingPost.slug) {
      const conflictingPost = await prisma.post.findUnique({
        where: { slug }
      });

      if (conflictingPost) {
        return res.status(400).json({
          success: false,
          error: 'Post with this slug already exists'
        });
      }
    }

    // Verify author and category if being updated
    if (authorId || categoryId) {
      const checks = [];
      if (authorId) {
        checks.push(prisma.postAuthor.findUnique({ where: { id: parseInt(authorId) } }));
      }
      if (categoryId) {
        checks.push(prisma.postCategory.findUnique({ where: { id: parseInt(categoryId) } }));
      }

      const results = await Promise.all(checks);
      if (authorId && !results[0]) {
        return res.status(400).json({
          success: false,
          error: 'Author not found'
        });
      }
      if (categoryId && !results[checks.length - 1]) {
        return res.status(400).json({
          success: false,
          error: 'Category not found'
        });
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(metadata !== undefined && { metadata }),
        ...(slug && { slug }),
        ...(authorId && { authorId: parseInt(authorId) }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(tags !== undefined && { tags }),
        ...(mainImage && { mainImage }),
        ...(body && { body }),
        ...(published !== undefined && { published })
      },
      include: {
        author: true,
        category: true
      }
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post',
      details: error.message
    });
  }
}

/**
 * DELETE /posts/:id
 * Delete a post
 */
export async function deletePost(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
      details: error.message
    });
  }
}

/**
 * POST /posts/:postId/galleries
 * Create a new gallery for a post
 */
export async function createGallery(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const { title, images } = req.body;

    if (!title || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title and images array are required'
      });
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const gallery = await prisma.gallery.create({
      data: {
        postId,
        title,
        images
      }
    });

    res.status(201).json({
      success: true,
      message: 'Gallery created successfully',
      data: gallery
    });
  } catch (error: any) {
    console.error('Error creating gallery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create gallery',
      details: error.message
    });
  }
}

/**
 * PUT /galleries/:id
 * Update a gallery
 */
export async function updateGallery(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, images } = req.body;

    const existingGallery = await prisma.gallery.findUnique({
      where: { id }
    });

    if (!existingGallery) {
      return res.status(404).json({
        success: false,
        error: 'Gallery not found'
      });
    }

    const gallery = await prisma.gallery.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(images && { images })
      }
    });

    res.json({
      success: true,
      message: 'Gallery updated successfully',
      data: gallery
    });
  } catch (error: any) {
    console.error('Error updating gallery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gallery',
      details: error.message
    });
  }
}

/**
 * DELETE /galleries/:id
 * Delete a gallery
 */
export async function deleteGallery(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingGallery = await prisma.gallery.findUnique({
      where: { id }
    });

    if (!existingGallery) {
      return res.status(404).json({
        success: false,
        error: 'Gallery not found'
      });
    }

    await prisma.gallery.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Gallery deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting gallery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete gallery',
      details: error.message
    });
  }
}
