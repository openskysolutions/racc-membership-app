import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import {
  listPostCategories,
  getPostCategory,
  createPostCategory,
  updatePostCategory,
  deletePostCategory
} from '@/controllers/postCategoryController';

const router = express.Router();

/**
 * @swagger
 * /post-categories:
 *   get:
 *     summary: List all post categories
 *     tags:
 *       - Blog - Post Categories
 *     responses:
 *       200:
 *         description: List of post categories
 */
router.get('/', listPostCategories);

/**
 * @swagger
 * /post-categories/{id}:
 *   get:
 *     summary: Get a post category by ID
 *     tags:
 *       - Blog - Post Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post category details
 *       404:
 *         description: Post category not found
 */
router.get('/:id', getPostCategory);

/**
 * @swagger
 * /post-categories:
 *   post:
 *     summary: Create a new post category (Admin only)
 *     tags:
 *       - Blog - Post Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               img:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post category created successfully
 *       400:
 *         description: Invalid input or duplicate
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, requireAdmin, createPostCategory);

/**
 * @swagger
 * /post-categories/{id}:
 *   put:
 *     summary: Update a post category (Admin only)
 *     tags:
 *       - Blog - Post Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               img:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post category updated successfully
 *       404:
 *         description: Post category not found
 */
router.put('/:id', requireAuth, requireAdmin, updatePostCategory);

/**
 * @swagger
 * /post-categories/{id}:
 *   delete:
 *     summary: Delete a post category (Admin only)
 *     tags:
 *       - Blog - Post Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post category deleted successfully
 *       400:
 *         description: Cannot delete category with existing posts
 *       404:
 *         description: Post category not found
 */
router.delete('/:id', requireAuth, requireAdmin, deletePostCategory);

export default router;
