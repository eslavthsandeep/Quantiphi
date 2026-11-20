'use strict';

const { Router } = require('express');
const { z } = require('zod');
const chatController = require('../controllers/chat.controller');
const { chatLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../middleware/validate');

const router = Router();

const streamSchema = z.object({
  message: z
    .string()
    .min(1, 'message cannot be empty')
    .max(10000, 'message is too long (max 10000 characters)'),
  tone: z.enum(['professional', 'casual', 'concise']),
  conversationId: z.string().optional(),
});

const regenerateSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  tone: z.enum(['professional', 'casual', 'concise']),
});

// POST /api/chat/stream - stream an AI response via SSE
router.post('/stream', chatLimiter, validateBody(streamSchema), chatController.stream);

// POST /api/chat/regenerate - regenerate the last assistant response via SSE
router.post('/regenerate', chatLimiter, validateBody(regenerateSchema), chatController.regenerate);

module.exports = router;
