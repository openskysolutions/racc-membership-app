import express from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '@/middleware/auth';
import {
  listPosts,
  getPostBySlug,
  getPost,
  createPost,
  updatePost,
  deletePost,
  createGallery,
  updateGallery,
  deleteGallery,
  reorderGalleries
} from '@/controllers/postController';

const router = express.Router();

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: List all posts with optional filtering
 *     tags:
 *       - Blog - Posts
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: integer
 *         description: Filter by author ID
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of posts to skip
 *       - in: query
 *         name: includeUnpublished
 *         schema:
 *           type: boolean
 *         description: Include unpublished posts (admin only)
 *     responses:
 *       200:
 *         description: List of posts
 */
router.get('/', optionalAuth, listPosts);

/**
 * @swagger
 * /posts/slug/{slug}:
 *   get:
 *     summary: Get a post by slug
 *     tags:
 *       - Blog - Posts
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get('/slug/:slug', getPostBySlug);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags:
 *       - Blog - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get('/:id', getPost);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post (Admin only)
 *     tags:
 *       - Blog - Posts
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
 *               - authorId
 *               - categoryId
 *               - mainImage
 *               - body
 *             properties:
 *               title:
 *                 type: string
 *               metadata:
 *                 type: string
 *               slug:
 *                 type: string
 *               authorId:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               mainImage:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input or duplicate
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, requireAdmin, createPost);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post (Admin only)
 *     tags:
 *       - Blog - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               metadata:
 *                 type: string
 *               slug:
 *                 type: string
 *               authorId:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               mainImage:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
router.put('/:id', requireAuth, requireAdmin, updatePost);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post (Admin only)
 *     tags:
 *       - Blog - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete('/:id', requireAuth, requireAdmin, deletePost);

// Gallery routes
/**
 * @swagger
 * /posts/{postId}/galleries:
 *   post:
 *     summary: Create a new gallery for a post
 *     tags:
 *       - Blog - Galleries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - images
 *             properties:
 *               title:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Gallery created successfully
 */
router.post('/:postId/galleries', requireAuth, requireAdmin, createGallery);

/**
 * @swagger
 * /galleries/{id}:
 *   put:
 *     summary: Update a gallery
 *     tags:
 *       - Blog - Galleries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Gallery updated successfully
 */
router.put('/galleries/:id', requireAuth, requireAdmin, updateGallery);

/**
 * @swagger
 * /galleries/{id}:
 *   delete:
 *     summary: Delete a gallery
 *     tags:
 *       - Blog - Galleries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gallery deleted successfully
 */
router.delete('/galleries/:id', requireAuth, requireAdmin, deleteGallery);

/**
 * @swagger
 * /posts/{postId}/galleries/reorder:
 *   put:
 *     summary: Reorder galleries for a post
 *     tags:
 *       - Blog - Galleries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - galleryIds
 *             properties:
 *               galleryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of gallery IDs in the desired order
 *     responses:
 *       200:
 *         description: Galleries reordered successfully
 */
router.put('/:postId/galleries/reorder', requireAuth, requireAdmin, reorderGalleries);

export default router;
