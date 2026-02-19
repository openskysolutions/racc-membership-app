import { Request, Response } from 'express';
import { generateSlug } from '@/utils/slugGenerate';
import { prisma } from '@/lib/prisma';

/**
 * GET /post-authors
 * List all post authors
 */
export async function listPostAuthors(req: Request, res: Response) {
  try {
    const authors = await prisma.postAuthor.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    res.json({
      success: true,
      data: authors
    });
  } catch (error: any) {
    console.error('Error listing post authors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list post authors',
      details: error.message
    });
  }
}

/**
 * GET /post-authors/:id
 * Get a single post author by ID
 */
export async function getPostAuthor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const author = await prisma.postAuthor.findUnique({
      where: { id: parseInt(id) },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            slug: true,
            mainImage: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        error: 'Post author not found'
      });
    }

    res.json({
      success: true,
      data: author
    });
  } catch (error: any) {
    console.error('Error getting post author:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post author',
      details: error.message
    });
  }
}

/**
 * POST /post-authors
 * Create a new post author
 */
export async function createPostAuthor(req: Request, res: Response) {
  try {
    const { name, slug: providedSlug, image, bio, description } = req.body;

    if (!name || !image) {
      return res.status(400).json({
        success: false,
        error: 'Name and image are required'
      });
    }

    // Generate slug from name if not provided
    const slug = providedSlug || generateSlug(name);

    // Check if slug already exists
    const existingAuthor = await prisma.postAuthor.findFirst({
      where: {
        slug: { equals: slug, mode: 'insensitive' }
      }
    });

    if (existingAuthor) {
      return res.status(400).json({
        success: false,
        error: 'Post author with this slug already exists'
      });
    }

    const author = await prisma.postAuthor.create({
      data: {
        name,
        slug,
        image,
        bio: bio || null,
        description: description || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Post author created successfully',
      data: author
    });
  } catch (error: any) {
    console.error('Error creating post author:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post author',
      details: error.message
    });
  }
}

/**
 * PUT /post-authors/:id
 * Update a post author
 */
export async function updatePostAuthor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, slug, image, bio, description } = req.body;

    const existingAuthor = await prisma.postAuthor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAuthor) {
      return res.status(404).json({
        success: false,
        error: 'Post author not found'
      });
    }

    // Check if new slug conflicts with another author
    if (slug) {
      const conflictingAuthor = await prisma.postAuthor.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            { slug: { equals: slug, mode: 'insensitive' } }
          ]
        }
      });

      if (conflictingAuthor) {
        return res.status(400).json({
          success: false,
          error: 'Post author with this slug already exists'
        });
      }
    }

    const author = await prisma.postAuthor.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(image && { image }),
        ...(bio !== undefined && { bio }),
        ...(description !== undefined && { description })
      }
    });

    res.json({
      success: true,
      message: 'Post author updated successfully',
      data: author
    });
  } catch (error: any) {
    console.error('Error updating post author:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post author',
      details: error.message
    });
  }
}

/**
 * DELETE /post-authors/:id
 * Delete a post author
 */
export async function deletePostAuthor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingAuthor = await prisma.postAuthor.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!existingAuthor) {
      return res.status(404).json({
        success: false,
        error: 'Post author not found'
      });
    }

    // Check if author has posts
    if (existingAuthor._count.posts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete author with existing posts. Please reassign or delete the posts first.'
      });
    }

    await prisma.postAuthor.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Post author deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post author:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post author',
      details: error.message
    });
  }
}
