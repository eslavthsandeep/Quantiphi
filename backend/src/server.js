'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

let server;

/**
 * Connect to MongoDB with retry logic.
 * @param {number} attemptsLeft
 * @returns {Promise<void>}
 */
async function connectMongoDB(attemptsLeft = MAX_RETRIES) {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    logger.info(`[DB] Connected to MongoDB: ${env.MONGODB_URI}`);
  } catch (err) {
    logger.error(`[DB] Connection failed (${MAX_RETRIES - attemptsLeft + 1}/${MAX_RETRIES}):`, err.message);
    if (attemptsLeft <= 1) {
      logger.warn('[DB] All MongoDB connection attempts exhausted. Starting server without DB.');
      return; // Allow server to start in degraded mode
    }
    logger.info(`[DB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectMongoDB(attemptsLeft - 1);
  }
}

/**
 * Graceful shutdown handler.
 * @param {string} signal
 */
function gracefulShutdown(signal) {
  logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('[Server] HTTP server closed.');
      try {
        await mongoose.connection.close();
        logger.info('[DB] MongoDB connection closed.');
      } catch (err) {
        logger.error('[DB] Error closing MongoDB connection:', err.message);
      }
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful close hangs
    setTimeout(() => {
      logger.error('[Server] Forceful shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

/**
 * Bootstrap the application.
 */
async function bootstrap() {
  // Start HTTP server immediately so health checks and requests are accepted
  server = app.listen(env.PORT, () => {
    logger.info(`[Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`[Server] LLM provider: ${env.LLM_PROVIDER}`);
    logger.info(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`[Server] Port ${env.PORT} is already in use.`);
    } else {
      logger.error('[Server] Server error:', err.message);
    }
    process.exit(1);
  });

  // Attempt DB connection in background with retries
  connectMongoDB().catch((err) => {
    logger.warn('[DB] MongoDB initialization warning:', err.message);
  });

  // Handle uncaught exceptions and promise rejections
  process.on('uncaughtException', (err) => {
    logger.error('[Process] Uncaught exception:', err);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('[Process] Unhandled rejection:', reason);
    gracefulShutdown('unhandledRejection');
  });

  // Graceful shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
