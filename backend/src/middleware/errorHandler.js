'use strict';

const env = require('../config/env');

/**
 * Centralized Express error handler middleware.
 * Always returns { error: { code, message } }.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (env.NODE_ENV === 'development') {
    console.error('[ErrorHandler]', err);
  }

  // Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid value for field '${err.path}': ${err.value}`,
      },
    });
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: messages,
      },
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists.`,
      },
    });
  }

  // Not Found error (custom)
  if (err.status === 404 || err.statusCode === 404) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'Resource not found.',
      },
    });
  }

  // Generic HTTP errors with status codes
  if (err.status || err.statusCode) {
    const status = err.status || err.statusCode;
    return res.status(status).json({
      error: {
        code: err.code || 'HTTP_ERROR',
        message: err.message || 'An error occurred.',
      },
    });
  }

  // Fallback: 500 Internal Server Error
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : err.message || 'Internal server error.',
    },
  });
}

module.exports = errorHandler;
