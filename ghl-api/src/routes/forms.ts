import express from 'express';
import { formsService } from '@/services/formsService';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /forms:
 *   get:
 *     summary: Get list of forms for the location
 *     tags:
 *       - Forms
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of forms to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of forms to skip
 *     responses:
 *       200:
 *         description: List of forms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 forms:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       locationId:
 *                         type: string
 *                       submitButtonText:
 *                         type: string
 *                       submitButtonColor:
 *                         type: string
 *                       thankyouUrl:
 *                         type: string
 *                 total:
 *                   type: integer
 */
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const skip = req.query.skip ? parseInt(req.query.skip as string) : undefined;

    const result = await formsService.getForms({ limit, skip });
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      error: 'Failed to fetch forms',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /forms/{formId}:
 *   get:
 *     summary: Get a specific form by ID
 *     tags:
 *       - Forms
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: Form ID
 *     responses:
 *       200:
 *         description: Form details
 *       404:
 *         description: Form not found
 */
router.get('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await formsService.getFormById(formId);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error: any) {
    console.error('Error fetching form:', error);
    res.status(500).json({
      error: 'Failed to fetch form',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /forms/embeds:
 *   post:
 *     summary: Create a new form embed
 *     tags:
 *       - Forms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - embedCode
 *             properties:
 *               name:
 *                 type: string
 *               embedCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Form embed created
 *       400:
 *         description: Invalid request
 */
router.post('/embeds', async (req, res) => {
  try {
    const { name, embedCode } = req.body;

    if (!name || !embedCode) {
      return res.status(400).json({ error: 'Name and embedCode are required' });
    }

    // Validate that embed code contains only iframe tags (security)
    if (!embedCode.includes('<iframe')) {
      return res.status(400).json({ error: 'Embed code must contain an iframe' });
    }

    const formEmbed = await prisma.formEmbed.create({
      data: {
        name,
        embedCode,
      },
    });

    res.status(201).json(formEmbed);
  } catch (error: any) {
    console.error('Error creating form embed:', error);
    res.status(500).json({
      error: 'Failed to create form embed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /forms/embeds/{id}:
 *   get:
 *     summary: Get a form embed by ID
 *     tags:
 *       - Forms
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form embed details
 *       404:
 *         description: Form embed not found
 */
router.get('/embeds/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const formEmbed = await prisma.formEmbed.findUnique({
      where: { id },
    });

    if (!formEmbed) {
      return res.status(404).json({ error: 'Form embed not found' });
    }

    res.json(formEmbed);
  } catch (error: any) {
    console.error('Error fetching form embed:', error);
    res.status(500).json({
      error: 'Failed to fetch form embed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /forms/embeds/{id}:
 *   put:
 *     summary: Update a form embed
 *     tags:
 *       - Forms
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
 *               name:
 *                 type: string
 *               embedCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Form embed updated
 *       404:
 *         description: Form embed not found
 */
router.put('/embeds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, embedCode } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (embedCode) {
      // Validate embed code
      if (!embedCode.includes('<iframe')) {
        return res.status(400).json({ error: 'Embed code must contain an iframe' });
      }
      updateData.embedCode = embedCode;
    }

    const formEmbed = await prisma.formEmbed.update({
      where: { id },
      data: updateData,
    });

    res.json(formEmbed);
  } catch (error: any) {
    console.error('Error updating form embed:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Form embed not found' });
    }
    res.status(500).json({
      error: 'Failed to update form embed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /forms/{formId}/embed-url:
 *   get:
 *     summary: Get embeddable form URL
 *     tags:
 *       - Forms
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: Form ID
 *     responses:
 *       200:
 *         description: Form embed URL
 */
router.get('/:formId/embed-url', async (req, res) => {
  try {
    const { formId } = req.params;
    const embedUrl = formsService.getFormEmbedUrl(formId);
    const submitUrl = formsService.getFormSubmitUrl(formId);

    res.json({
      embedUrl,
      submitUrl,
      formId,
    });
  } catch (error: any) {
    console.error('Error getting form URLs:', error);
    res.status(500).json({
      error: 'Failed to get form URLs',
      message: error.message,
    });
  }
});

export default router;
