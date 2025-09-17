const { HighLevel } = require('@gohighlevel/api-client');
const client = new HighLevel({ privateIntegrationToken: process.env.PRIVATE_INTEGRATION_TOKEN });
const svc = client.conversations;

async function listConversations(req, res, next) {
  try {
    const result = await svc.searchConversation({ limit: req.query.limit, skip: req.query.skip }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getConversationById(req, res, next) {
  try {
    const result = await svc.getConversation({ conversationId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function createConversation(req, res, next) {
  try {
    const result = await svc.createConversation({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function updateConversation(req, res, next) {
  try {
    const result = await svc.updateConversation({ conversationId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function deleteConversation(req, res, next) {
  try {
    await svc.deleteConversation({ conversationId: req.params.id }, { headers: req.headers });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Email functionality
async function getEmailById(req, res, next) {
  try {
    const result = await svc.getEmailById({ emailId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function cancelScheduledEmailMessage(req, res, next) {
  try {
    const result = await svc.cancelScheduledEmailMessage({ emailId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Message functionality
async function getMessage(req, res, next) {
  try {
    const result = await svc.getMessage({ messageId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getMessages(req, res, next) {
  try {
    const result = await svc.getMessages({ conversationId: req.params.conversationId }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function sendANewMessage(req, res, next) {
  try {
    const result = await svc.sendANewMessage({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function addAnInboundMessage(req, res, next) {
  try {
    const result = await svc.addAnInboundMessage({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function addAnOutboundMessage(req, res, next) {
  try {
    const result = await svc.addAnOutboundMessage({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function cancelScheduledMessage(req, res, next) {
  try {
    const result = await svc.cancelScheduledMessage({ messageId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function updateMessageStatus(req, res, next) {
  try {
    const result = await svc.updateMessageStatus({ messageId: req.params.id, payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// File attachments
async function uploadFileAttachments(req, res, next) {
  try {
    const result = await svc.uploadFileAttachments({ payload: req.body }, { headers: req.headers });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// Recording and transcription functionality
async function getMessageRecording(req, res, next) {
  try {
    const result = await svc.getMessageRecording({ messageId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function getMessageTranscription(req, res, next) {
  try {
    const result = await svc.getMessageTranscription({ messageId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

async function downloadMessageTranscription(req, res, next) {
  try {
    const result = await svc.downloadMessageTranscription({ messageId: req.params.id }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

// Live chat functionality
async function liveChatAgentTyping(req, res, next) {
  try {
    const result = await svc.liveChatAgentTyping({ payload: req.body }, { headers: req.headers });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { 
  listConversations, getConversationById, createConversation, updateConversation, deleteConversation,
  // Email functionality
  getEmailById, cancelScheduledEmailMessage,
  // Message functionality
  getMessage, getMessages, sendANewMessage, addAnInboundMessage, addAnOutboundMessage, 
  cancelScheduledMessage, updateMessageStatus,
  // File attachments
  uploadFileAttachments,
  // Recording and transcription
  getMessageRecording, getMessageTranscription, downloadMessageTranscription,
  // Live chat
  liveChatAgentTyping
};