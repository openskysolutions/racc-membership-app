import { Request, Response } from 'express';
import { generateSlug } from '@/utils/slugGenerate';
import { prisma } from '@/lib/prisma';

/**
 * GET /post-categories
 * List all post categories
 */
export async function listPostCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.postCategory.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    console.error('Error listing post categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list post categories',
      details: error.message
    });
  }
}

/**
 * GET /post-categories/:id
 * Get a single post category by ID
 */
export async function getPostCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const category = await prisma.postCategory.findUnique({
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

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Post category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Error getting post category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post category',
      details: error.message
    });
  }
}

/**
 * POST /post-categories
 * Create a new post category
 */
export async function createPostCategory(req: Request, res: Response) {
  try {
    const { title, slug: providedSlug, img, description } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // Generate slug from title if not provided
    const slug = providedSlug || generateSlug(title);

    // Check if slug already exists
    const existingCategory = await prisma.postCategory.findFirst({
      where: {
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { title: { equals: title, mode: 'insensitive' } }
        ]
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Post category with this title or slug already exists'
      });
    }

    const category = await prisma.postCategory.create({
      data: {
        title,
        slug,
        img: img || null,
        description: description || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Post category created successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Error creating post category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post category',
      details: error.message
    });
  }
}

/**
 * PUT /post-categories/:id
 * Update a post category
 */
export async function updatePostCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, slug, img, description } = req.body;

    const existingCategory = await prisma.postCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Post category not found'
      });
    }

    // Check if new title/slug conflicts with another category
    if (title || slug) {
      const conflictingCategory = await prisma.postCategory.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            {
              OR: [
                ...(title ? [{ title: { equals: title, mode: 'insensitive' as const } }] : []),
                ...(slug ? [{ slug: { equals: slug, mode: 'insensitive' as const } }] : [])
              ]
            }
          ]
        }
      });

      if (conflictingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Post category with this title or slug already exists'
        });
      }
    }

    const category = await prisma.postCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(img !== undefined && { img }),
        ...(description !== undefined && { description })
      }
    });

    res.json({
      success: true,
      message: 'Post category updated successfully',
      data: category
    });
  } catch (error: any) {
    console.error('Error updating post category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update post category',
      details: error.message
    });
  }
}

/**
 * DELETE /post-categories/:id
 * Delete a post category
 */
export async function deletePostCategory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existingCategory = await prisma.postCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Post category not found'
      });
    }

    // Check if category has posts
    if (existingCategory._count.posts > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing posts. Please reassign or delete the posts first.'
      });
    }

    await prisma.postCategory.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Post category deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post category',
      details: error.message
    });
  }
}
