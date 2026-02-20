import express from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';
import {
  listPostAuthors,
  getPostAuthor,
  createPostAuthor,
  updatePostAuthor,
  deletePostAuthor
} from '@/controllers/postAuthorController';

const router = express.Router();

/**
 * @swagger
 * /post-authors:
 *   get:
 *     summary: List all post authors
 *     tags:
 *       - Blog - Post Authors
 *     responses:
 *       200:
 *         description: List of post authors
 */
router.get('/', listPostAuthors);

/**
 * @swagger
 * /post-authors/{id}:
 *   get:
 *     summary: Get a post author by ID
 *     tags:
 *       - Blog - Post Authors
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post author details
 *       404:
 *         description: Post author not found
 */
router.get('/:id', getPostAuthor);

/**
 * @swagger
 * /post-authors:
 *   post:
 *     summary: Create a new post author (Admin only)
 *     tags:
 *       - Blog - Post Authors
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               image:
 *                 type: string
 *               bio:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post author created successfully
 *       400:
 *         description: Invalid input or duplicate
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, requireAdmin, createPostAuthor);

/**
 * @swagger
 * /post-authors/{id}:
 *   put:
 *     summary: Update a post author (Admin only)
 *     tags:
 *       - Blog - Post Authors
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
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               image:
 *                 type: string
 *               bio:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post author updated successfully
 *       404:
 *         description: Post author not found
 */
router.put('/:id', requireAuth, requireAdmin, updatePostAuthor);

/**
 * @swagger
 * /post-authors/{id}:
 *   delete:
 *     summary: Delete a post author (Admin only)
 *     tags:
 *       - Blog - Post Authors
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
 *         description: Post author deleted successfully
 *       400:
 *         description: Cannot delete author with existing posts
 *       404:
 *         description: Post author not found
 */
router.delete('/:id', requireAuth, requireAdmin, deletePostAuthor);

export default router;
