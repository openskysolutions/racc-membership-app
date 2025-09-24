const express = require('express');
const { listLinks, getLinkById, createLink, updateLink, deleteLink } = require('@/controllers/linksController');
const router = express.Router();

/**
 * @swagger
 * /links:
 *   get:
 *     summary: List all links
 *     tags:
 *       - Links
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Array of Link objects
 */
router.get('/', listLinks);

/**
 * @swagger
 * /links/{id}:
 *   get:
 *     summary: Retrieve a link by ID
 *     tags:
 *       - Links
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Link object
 */
router.get('/:id', getLinkById);

/**
 * @swagger
 * /links:
 *   post:
 *     summary: Create a new link
 *     tags:
 *       - Links
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Link created successfully
 */
router.post('/', createLink);

/**
 * @swagger
 * /links/{id}:
 *   put:
 *     summary: Update a link by ID
 *     tags:
 *       - Links
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
 *         description: Link updated successfully
 */
router.put('/:id', updateLink);

/**
 * @swagger
 * /links/{id}:
 *   delete:
 *     summary: Delete a link by ID
 *     tags:
 *       - Links
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Link deleted successfully
 */
router.delete('/:id', deleteLink);

module.exports = router;