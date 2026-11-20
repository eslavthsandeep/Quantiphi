'use strict';

const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

/**
 * Create a custom error with a status code.
 */
function createHttpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code || 'HTTP_ERROR';
  return err;
}

/**
 * List recent conversations (up to 50), sorted by updatedAt descending.
 * @returns {Promise<Array<{_id, title, updatedAt}>>}
 */
async function listConversations() {
  return Conversation.find({}, { title: 1, updatedAt: 1, createdAt: 1 })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
}

/**
 * Create a new conversation.
 * @param {string} [title='New Chat'] - Optional title for the conversation.
 * @returns {Promise<import('../models/Conversation').default>}
 */
async function createConversation(title) {
  const conversation = new Conversation({ title: title || 'New Chat' });
  await conversation.save();
  return conversation;
}

/**
 * Get a conversation by ID, throwing 404 if not found.
 * @param {string} id - The conversation's MongoDB ObjectId.
 * @returns {Promise<import('../models/Conversation').default>}
 */
async function getConversation(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, `'${id}' is not a valid conversation ID.`, 'INVALID_ID');
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) {
    throw createHttpError(404, `Conversation with id '${id}' was not found.`, 'NOT_FOUND');
  }
  return conversation;
}

/**
 * Update the title of a conversation.
 * @param {string} id
 * @param {string} title
 * @returns {Promise<import('../models/Conversation').default>}
 */
async function updateConversationTitle(id, title) {
  const conversation = await getConversation(id);
  conversation.title = title;
  await conversation.save();
  return conversation;
}

/**
 * Delete a conversation by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function deleteConversation(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, `'${id}' is not a valid conversation ID.`, 'INVALID_ID');
  }

  const result = await Conversation.findByIdAndDelete(id);
  if (!result) {
    throw createHttpError(404, `Conversation with id '${id}' was not found.`, 'NOT_FOUND');
  }
}

/**
 * Append a message to a conversation.
 * @param {string} conversationId
 * @param {{ role: string, content: string, tone?: string }} messageData
 * @returns {Promise<import('../models/Conversation').default>}
 */
async function addMessage(conversationId, { role, content, tone }) {
  const conversation = await getConversation(conversationId);
  conversation.messages.push({
    role,
    content,
    tone: tone || null,
    createdAt: new Date(),
  });
  await conversation.save();
  return conversation;
}

/**
 * Get an existing conversation or create a new one.
 * @param {string} [conversationId] - If provided, retrieves the existing conversation.
 * @returns {Promise<import('../models/Conversation').default>}
 */
async function getOrCreateConversation(conversationId) {
  if (conversationId) {
    return getConversation(conversationId);
  }
  return createConversation();
}

module.exports = {
  listConversations,
  createConversation,
  getConversation,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  getOrCreateConversation,
};
