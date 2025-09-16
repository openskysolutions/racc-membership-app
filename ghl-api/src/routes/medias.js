const express = require('express');
const { listMedias, getMediaById, createMedia, updateMedia, deleteMedia } = require('../controllers/mediasController');
const router = express.Router();

/**
 * @swagger
 * /medias:
 *   get:
 *     summary: List media files
 *     tags:
 *       - Medias
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of Media objects
 */
router.get('/', listMedias);

/**
 * @swagger
 * /medias/{id}:
 *   get:
 *     summary: Retrieve a media file by ID
 *     tags:
 *       - Medias
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Media object
 */
router.get('/:id', getMediaById);

/**
 * @swagger
 * /medias:
 *   post:
 *     summary: Upload a new media file
 *     tags:
 *       - Medias
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Media created successfully
 */
router.post('/', createMedia);

/**
 * @swagger
 * /medias/{id}:
 *   put:
 *     summary: Update a media file by ID
 *     tags:
 *       - Medias
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Media updated successfully
 */
router.put('/:id', updateMedia);

/**
 * @swagger
 * /medias/{id}:
 *   delete:
 *     summary: Delete a media file by ID
 *     tags:
 *       - Medias
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Media deleted successfully
 */
router.delete('/:id', deleteMedia);

module.exports = router;