const express = require('express');
const { listOAuth, getOAuthById, createOAuth, updateOAuth, deleteOAuth } = require('@/controllers/oauthController');
const router = express.Router();

/**
 * @swagger
 * /oauth:
 *   get:
 *     summary: List all OAuth records
 *     tags:
 *       - OAuth
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
 *         description: Array of OAuth objects
 */
router.get('/', listOAuth);

/**
 * @swagger
 * /oauth/{id}:
 *   get:
 *     summary: Retrieve an OAuth record by ID
 *     tags:
 *       - OAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: OAuth object
 */
router.get('/:id', getOAuthById);

/**
 * @swagger
 * /oauth:
 *   post:
 *     summary: Create a new OAuth record
 *     tags:
 *       - OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: OAuth record created successfully
 */
router.post('/', createOAuth);

/**
 * @swagger
 * /oauth/{id}:
 *   put:
 *     summary: Update an OAuth record by ID
 *     tags:
 *       - OAuth
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
 *         description: OAuth record updated successfully
 */
router.put('/:id', updateOAuth);

/**
 * @swagger
 * /oauth/{id}:
 *   delete:
 *     summary: Delete an OAuth record by ID
 *     tags:
 *       - OAuth
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: OAuth record deleted successfully
 */
router.delete('/:id', deleteOAuth);

module.exports = router;