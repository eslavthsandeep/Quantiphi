'use strict';

const mongoose = require('mongoose');
const conversationService = require('../services/conversation.service');

/**
 * GET /api/conversations
 * Returns a list of all conversations (id, title, updatedAt).
 */
async function list(req, res, next) {
  try {
    const conversations = await conversationService.listConversations();
    return res.status(200).json({ conversations });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/conversations
 * Creates and returns a new conversation.
 */
async function create(req, res, next) {
  try {
    const { title } = req.body || {};
    const conversation = await conversationService.createConversation(title);
    return res.status(201).json({ conversation });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/conversations/:id
 * Returns a conversation by ID with all messages.
 */
async function getOne(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: `'${id}' is not a valid conversation ID.` },
      });
    }

    const conversation = await conversationService.getConversation(id);
    return res.status(200).json({ conversation });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
    return next(err);
  }
}

/**
 * PATCH /api/conversations/:id
 * Updates the title of a conversation.
 */
async function rename(req, res, next) {
  try {
    const { id } = req.params;
    const { title } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'title is required and must be a non-empty string.',
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: `'${id}' is not a valid conversation ID.` },
      });
    }

    const conversation = await conversationService.updateConversationTitle(id, title.trim());
    return res.status(200).json({ conversation });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
    return next(err);
  }
}

/**
 * DELETE /api/conversations/:id
 * Deletes a conversation.
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: { code: 'INVALID_ID', message: `'${id}' is not a valid conversation ID.` },
      });
    }

    await conversationService.deleteConversation(id);
    return res.status(200).json({ message: 'Conversation deleted successfully.' });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
    return next(err);
  }
}

module.exports = { list, create, getOne, rename, remove };
