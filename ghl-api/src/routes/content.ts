/**
 * Content Routes for RACC Membership Portal
 * Handles content management for pages like About Us
 */

import express from 'express';
import { requireAuth, requireAdmin, optionalAuth } from '@/middleware/auth';
import { databaseService } from '@/services/database';

const router = express.Router();

/**
 * @swagger
 * /content/pages/{slug}:
 *   get:
 *     summary: Get page content by slug
 *     tags:
 *       - Content
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page slug
 *     responses:
 *       200:
 *         description: Page content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 slug:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 lastModified:
 *                   type: string
 *                   format: date-time
 *                 lastModifiedBy:
 *                   type: string
 *                 version:
 *                   type: integer
 *       404:
 *         description: Page not found
 */
router.get('/pages/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await databaseService.getPageBySlug(slug);
    
    if (!page) {
      return res.status(404).json({
        error: 'Page not found'
      });
    }

    res.json(page);
  } catch (error) {
    console.error('Get page content error:', error);
    res.status(500).json({
      error: 'Failed to retrieve page content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /content/pages/{slug}:
 *   put:
 *     summary: Update page content (admin only)
 *     tags:
 *       - Content
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *             required:
 *               - title
 *               - content
 *     responses:
 *       200:
 *         description: Page updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
router.put('/pages/:slug', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      });
    }

    const updatedPage = await databaseService.updatePage(slug, {
      title,
      content,
      lastModifiedBy: req.user.name || req.user.email,
    });

    res.json(updatedPage);
  } catch (error) {
    console.error('Update page content error:', error);
    res.status(500).json({
      error: 'Failed to update page content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /content/pages/{slug}/history:
 *   get:
 *     summary: Get page content history (admin only)
 *     tags:
 *       - Content
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page slug
 *     responses:
 *       200:
 *         description: Page history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slug:
 *                     type: string
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   lastModified:
 *                     type: string
 *                     format: date-time
 *                   lastModifiedBy:
 *                     type: string
 *                   version:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
router.get('/pages/:slug/history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const history = await databaseService.getPageHistory(slug);
    res.json(history);
  } catch (error) {
    console.error('Get page history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve page history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @swagger
 * /content/pages:
 *   get:
 *     summary: Get all pages (admin only)
 *     tags:
 *       - Content
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   slug:
 *                     type: string
 *                   title:
 *                     type: string
 *                   lastModified:
 *                     type: string
 *                     format: date-time
 *                   lastModifiedBy:
 *                     type: string
 *                   version:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 */
router.get('/pages', requireAuth, requireAdmin, async (req, res) => {
  try {
    const pages = await databaseService.getAllPages();
    res.json(pages);
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({
      error: 'Failed to retrieve pages',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;