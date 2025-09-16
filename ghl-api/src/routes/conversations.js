const express = require('express');
const { 
  listConversations, getConversationById, createConversation, updateConversation, deleteConversation,
  // Messages
  getMessage, getMessages, sendANewMessage, addAnInboundMessage, addAnOutboundMessage, 
  cancelScheduledMessage, updateMessageStatus,
  // Emails
  getEmailById, cancelScheduledEmailMessage,
  // File Attachments
  uploadFileAttachments,
  // Media
  getMessageRecording, getMessageTranscription, downloadMessageTranscription,
  // Live Chat
  liveChatAgentTyping
} = require('../controllers/conversationsController');
const router = express.Router();

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: List all conversations
 *     tags:
 *       - Conversations
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
 *         description: Array of Conversation objects
 */
router.get('/', listConversations);

/**
 * @swagger
 * /conversations/{id}:
 *   get:
 *     summary: Retrieve a conversation by ID
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Conversation object
 */
router.get('/:id', getConversationById);

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags:
 *       - Conversations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/', createConversation);

/**
 * @swagger
 * /conversations/{id}:
 *   put:
 *     summary: Update a conversation by ID
 *     tags:
 *       - Conversations
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
 *         description: Conversation updated successfully
 */
router.put('/:id', updateConversation);

/**
 * @swagger
 * /conversations/{id}:
 *   delete:
 *     summary: Delete a conversation by ID
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Conversation deleted successfully
 */
router.delete('/:id', deleteConversation);

// Messages
/**
 * @swagger
 * /conversations/{conversationId}/messages/{messageId}:
 *   get:
 *     summary: Get a specific message
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:conversationId/messages/:messageId', getMessage);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   get:
 *     summary: Get all messages for a conversation
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *       - $ref: '#/components/parameters/Limit'
 *       - $ref: '#/components/parameters/Skip'
 *     responses:
 *       200:
 *         description: Array of message objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/:conversationId/messages', getMessages);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a new message in a conversation
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SMS, Email, GMB, IG, FB, WhatsApp]
 *               message:
 *                 type: string
 *               html:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/:conversationId/messages', sendANewMessage);

/**
 * @swagger
 * /conversations/{conversationId}/messages/inbound:
 *   post:
 *     summary: Add an inbound message to a conversation
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               message:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Inbound message added successfully
 */
router.post('/:conversationId/messages/inbound', addAnInboundMessage);

/**
 * @swagger
 * /conversations/{conversationId}/messages/outbound:
 *   post:
 *     summary: Add an outbound message to a conversation
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Outbound message added successfully
 */
router.post('/:conversationId/messages/outbound', addAnOutboundMessage);

/**
 * @swagger
 * /conversations/{conversationId}/messages/{messageId}/schedule/cancel:
 *   delete:
 *     summary: Cancel a scheduled message
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Scheduled message cancelled successfully
 */
router.delete('/:conversationId/messages/:messageId/schedule/cancel', cancelScheduledMessage);

/**
 * @swagger
 * /conversations/{conversationId}/messages/{messageId}/status:
 *   put:
 *     summary: Update message status
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [read, unread, delivered, failed]
 *     responses:
 *       200:
 *         description: Message status updated successfully
 */
router.put('/:conversationId/messages/:messageId/status', updateMessageStatus);

// Emails
/**
 * @swagger
 * /conversations/emails/{emailId}:
 *   get:
 *     summary: Get an email by ID
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: emailId
 *         schema:
 *           type: string
 *         required: true
 *         description: Email ID
 *     responses:
 *       200:
 *         description: Email object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/emails/:emailId', getEmailById);

/**
 * @swagger
 * /conversations/emails/{emailId}/schedule/cancel:
 *   delete:
 *     summary: Cancel a scheduled email message
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: emailId
 *         schema:
 *           type: string
 *         required: true
 *         description: Email ID
 *     responses:
 *       200:
 *         description: Scheduled email cancelled successfully
 */
router.delete('/emails/:emailId/schedule/cancel', cancelScheduledEmailMessage);

// File Attachments
/**
 * @swagger
 * /conversations/messages/attachments:
 *   post:
 *     summary: Upload file attachments for messages
 *     tags:
 *       - Conversations
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               conversationId:
 *                 type: string
 *               contactId:
 *                 type: string
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 fileName:
 *                   type: string
 */
router.post('/messages/attachments', uploadFileAttachments);

// Media and Recordings
/**
 * @swagger
 * /conversations/{conversationId}/messages/{messageId}/recording:
 *   get:
 *     summary: Get message recording
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Recording data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 duration:
 *                   type: number
 */
router.get('/:conversationId/messages/:messageId/recording', getMessageRecording);

/**
 * @swagger
 * /conversations/{conversationId}/messages/{messageId}/transcription:
 *   get:
 *     summary: Get message transcription
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Transcription data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                 confidence:
 *                   type: number
 */
router.get('/:conversationId/messages/:messageId/transcription', getMessageTranscription);

/**
 * @swagger
 * /conversations/{conversationId}/messages/{messageId}/transcription/download:
 *   get:
 *     summary: Download message transcription
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Transcription file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:conversationId/messages/:messageId/transcription/download', downloadMessageTranscription);

// Live Chat
/**
 * @swagger
 * /conversations/{conversationId}/typing:
 *   post:
 *     summary: Send live chat agent typing indicator
 *     tags:
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isTyping:
 *                 type: boolean
 *               agentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Typing indicator sent successfully
 */
router.post('/:conversationId/typing', liveChatAgentTyping);

module.exports = router;