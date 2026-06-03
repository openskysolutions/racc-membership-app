import express from 'express';
import businessCategoriesController from '@/controllers/businessCategoriesController';

const router = express.Router();

/**
 * GET /business-categories
 * Returns the full category/subcategory tree (PUBLIC, cached)
 */
router.get('/', async (req, res) => {
  return businessCategoriesController.getCategories(req, res);
});

export default router;
