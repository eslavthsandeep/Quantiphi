'use strict';

const { Router } = require('express');
const conversationController = require('../controllers/conversation.controller');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Apply general rate limiter to all conversation routes
router.use(apiLimiter);

// GET /api/conversations - list all conversations
router.get('/', conversationController.list);

// POST /api/conversations - create a new conversation
router.post('/', conversationController.create);

// GET /api/conversations/:id - get a conversation by id
router.get('/:id', conversationController.getOne);

// PATCH /api/conversations/:id - rename a conversation
router.patch('/:id', conversationController.rename);

// DELETE /api/conversations/:id - delete a conversation
router.delete('/:id', conversationController.remove);

module.exports = router;
