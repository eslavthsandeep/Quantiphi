'use strict';

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter: 100 requests per 15 minutes.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again in 15 minutes.',
      },
    });
  },
});

/**
 * Chat-specific rate limiter: 20 requests per minute.
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'CHAT_RATE_LIMIT_EXCEEDED',
        message: 'Too many chat requests. Please slow down and try again in a minute.',
      },
    });
  },
});

module.exports = { apiLimiter, chatLimiter };
