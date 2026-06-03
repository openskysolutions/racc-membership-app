/**
 * Business Categories Controller
 * Serves the category/subcategory tree from the database.
 */

import { Request, Response } from 'express';
import { prisma } from '@/lib/prisma';

class BusinessCategoriesController {
  // In-memory cache — categories rarely change
  private cache: any[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  async getCategories(_req: Request, res: Response) {
    try {
      const now = Date.now();
      if (this.cache && now - this.cacheTimestamp < this.CACHE_TTL) {
        return res.json(this.cache);
      }

      const categories = await prisma.businessCategory.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          subcategories: { orderBy: { sortOrder: 'asc' } },
        },
      });

      this.cache = categories;
      this.cacheTimestamp = now;
      res.json(categories);
    } catch (error) {
      console.error('Error fetching business categories:', error);
      res.status(500).json({ error: 'Failed to fetch business categories', details: error.message });
    }
  }

  /** Call this after any admin mutation to force a fresh fetch */
  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export default new BusinessCategoriesController();
