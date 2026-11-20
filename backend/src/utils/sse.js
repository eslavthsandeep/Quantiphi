'use strict';

/**
 * Initialize an SSE connection by setting appropriate headers and flushing.
 * @param {import('express').Response} res
 */
function initSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

/**
 * Send a named SSE event with JSON-serialized data.
 * @param {import('express').Response} res
 * @param {string} event
 * @param {*} data
 */
function sendSSEEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Send a token (text chunk) SSE event.
 * @param {import('express').Response} res
 * @param {string} text
 */
function sendSSEToken(res, text) {
  sendSSEEvent(res, 'token', { text });
}

/**
 * Send a meta SSE event (e.g., conversationId).
 * @param {import('express').Response} res
 * @param {*} data
 */
function sendSSEMeta(res, data) {
  sendSSEEvent(res, 'meta', data);
}

/**
 * Send the done SSE event signaling stream completion.
 * @param {import('express').Response} res
 * @param {*} data
 */
function sendSSEDone(res, data) {
  sendSSEEvent(res, 'done', data);
}

/**
 * Send an error SSE event.
 * @param {import('express').Response} res
 * @param {string} error - Error message string.
 */
function sendSSEError(res, error) {
  sendSSEEvent(res, 'error', { message: error });
}

module.exports = {
  initSSE,
  sendSSEEvent,
  sendSSEToken,
  sendSSEMeta,
  sendSSEDone,
  sendSSEError,
};
