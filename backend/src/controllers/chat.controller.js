'use strict';

const { TONES, DEFAULT_TONE } = require('../config/tones');
const env = require('../config/env');
const conversationService = require('../services/conversation.service');
const { generateTitle } = require('../services/title.service');
const { getProvider } = require('../services/llm/index');
const { initSSE, sendSSEMeta, sendSSEToken, sendSSEDone, sendSSEError } = require('../utils/sse');
const logger = require('../utils/logger');

/**
 * POST /api/chat/stream
 * Streams an LLM response for a user message via Server-Sent Events.
 */
async function stream(req, res, next) {
  const { message, tone = DEFAULT_TONE, conversationId } = req.body;

  // Validate tone
  if (!TONES[tone]) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid tone '${tone}'. Must be one of: ${Object.keys(TONES).join(', ')}`,
      },
    });
  }

  // Initialize SSE before any async work so the client gets headers immediately
  initSSE(res);

  let conversation;
  try {
    conversation = await conversationService.getOrCreateConversation(conversationId);
  } catch (err) {
    sendSSEError(res, err.message || 'Failed to retrieve or create conversation.');
    return res.end();
  }

  const convId = conversation._id.toString();

  // Send meta event with conversationId so the client can track the session
  sendSSEMeta(res, { conversationId: convId });

  // Save user message
  try {
    await conversationService.addMessage(convId, { role: 'user', content: message, tone: null });
  } catch (err) {
    sendSSEError(res, 'Failed to save user message.');
    return res.end();
  }

  // Reload conversation to get the full updated message history
  let updatedConversation;
  try {
    updatedConversation = await conversationService.getConversation(convId);
  } catch (err) {
    sendSSEError(res, 'Failed to load conversation history.');
    return res.end();
  }

  // Build history for LLM: last HISTORY_LIMIT messages, excluding the user message just added
  const allMessages = updatedConversation.messages;
  const historyMessages = allMessages
    .slice(0, -1) // exclude the user message just added (last item)
    .slice(-env.HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));

  // Current user message to send
  const currentMessage = { role: 'user', content: message };
  const messagesForLLM = [...historyMessages, currentMessage];

  const systemPrompt = TONES[tone].systemPrompt;

  // AbortController to cancel the LLM stream if the client disconnects
  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
  });

  const llmProvider = getProvider();
  let collectedText = '';

  try {
    const tokenStream = llmProvider.streamChat({
      systemPrompt,
      messages: messagesForLLM,
      signal: abortController.signal,
    });

    for await (const token of tokenStream) {
      if (abortController.signal.aborted) break;
      collectedText += token;
      sendSSEToken(res, token);
    }
  } catch (err) {
    const isAbort = err.name === 'AbortError' || (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError');
    if (isAbort) {
      logger.info(`[ChatController] Stream aborted for conversation ${convId}`);
      if (collectedText.trim()) {
        conversationService
          .addMessage(convId, { role: 'assistant', content: collectedText.trim(), tone })
          .catch((e) => logger.error('[ChatController] Failed to save partial assistant message:', e.message));
      }
      sendSSEError(res, 'Stream was cancelled.');
      return res.end();
    }
    // Real LLM error
    logger.error('[ChatController] LLM stream error:', err.message);
    if (collectedText.trim()) {
      conversationService
        .addMessage(convId, { role: 'assistant', content: collectedText.trim(), tone })
        .catch((e) => logger.error('[ChatController] Failed to save partial assistant message:', e.message));
    }
    sendSSEError(res, err.message || 'An error occurred while generating the response.');
    return res.end();
  }

  // Stream completed successfully — save assistant message
  if (collectedText.trim()) {
    try {
      await conversationService.addMessage(convId, {
        role: 'assistant',
        content: collectedText.trim(),
        tone,
      });
    } catch (err) {
      logger.error('[ChatController] Failed to save assistant message:', err.message);
    }

    // Auto-generate title on first completed exchange
    try {
      const freshConversation = await conversationService.getConversation(convId);
      const userMessages = freshConversation.messages.filter((m) => m.role === 'user');
      const assistantMessages = freshConversation.messages.filter((m) => m.role === 'assistant');

      if (userMessages.length === 1 && assistantMessages.length === 1) {
        // Fire-and-forget: do not await
        generateTitle(convId, message, collectedText.trim()).catch((err) => {
          logger.warn('[ChatController] Title generation error:', err.message);
        });
      }
    } catch (err) {
      logger.warn('[ChatController] Could not check message count for title generation:', err.message);
    }
  }

  sendSSEDone(res, {
    conversationId: convId,
    messageLength: collectedText.length,
  });
  res.end();
}

/**
 * POST /api/chat/regenerate
 * Removes the last assistant message and regenerates it with the given tone.
 */
async function regenerate(req, res, next) {
  const { conversationId, tone = DEFAULT_TONE } = req.body;

  if (!TONES[tone]) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `Invalid tone '${tone}'.` },
    });
  }

  // Initialize SSE
  initSSE(res);

  let conversation;
  try {
    conversation = await conversationService.getConversation(conversationId);
  } catch (err) {
    sendSSEError(res, err.message || 'Conversation not found.');
    return res.end();
  }

  // Find and remove the last assistant message
  const messages = conversation.messages;
  const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf('assistant');

  if (lastAssistantIdx === -1) {
    sendSSEError(res, 'No assistant message found to regenerate.');
    return res.end();
  }

  conversation.messages.splice(lastAssistantIdx, 1);
  try {
    await conversation.save();
  } catch (err) {
    sendSSEError(res, 'Failed to remove last assistant message.');
    return res.end();
  }

  // Find the last user message after removal
  const updatedMessages = conversation.messages;
  const lastUserMsg = [...updatedMessages].reverse().find((m) => m.role === 'user');

  if (!lastUserMsg) {
    sendSSEError(res, 'No user message found to regenerate from.');
    return res.end();
  }

  const convId = conversationId.toString();
  sendSSEMeta(res, { conversationId: convId });

  // Build history for LLM
  const historyMessages = updatedMessages
    .slice(-env.HISTORY_LIMIT)
    .map((m) => ({ role: m.role, content: m.content }));

  const systemPrompt = TONES[tone].systemPrompt;

  // AbortController for client disconnect
  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
  });

  const llmProvider = getProvider();
  let collectedText = '';

  try {
    const tokenStream = llmProvider.streamChat({
      systemPrompt,
      messages: historyMessages,
      signal: abortController.signal,
    });

    for await (const token of tokenStream) {
      if (abortController.signal.aborted) break;
      collectedText += token;
      sendSSEToken(res, token);
    }
  } catch (err) {
    const isAbort = err.name === 'AbortError' || (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError');
    if (isAbort) {
      logger.info(`[ChatController] Regenerate aborted for conversation ${convId}`);
      if (collectedText.trim()) {
        conversationService
          .addMessage(convId, { role: 'assistant', content: collectedText.trim(), tone })
          .catch((e) => logger.error('[ChatController] Failed to save partial regenerated message:', e.message));
      }
      sendSSEError(res, 'Regeneration was cancelled.');
      return res.end();
    }
    logger.error('[ChatController] Regenerate LLM error:', err.message);
    if (collectedText.trim()) {
      conversationService
        .addMessage(convId, { role: 'assistant', content: collectedText.trim(), tone })
        .catch((e) => logger.error('[ChatController] Failed to save partial regenerated message:', e.message));
    }
    sendSSEError(res, err.message || 'An error occurred while regenerating the response.');
    return res.end();
  }

  // Save regenerated assistant message
  if (collectedText.trim()) {
    try {
      await conversationService.addMessage(convId, {
        role: 'assistant',
        content: collectedText.trim(),
        tone,
      });
    } catch (err) {
      logger.error('[ChatController] Failed to save regenerated assistant message:', err.message);
    }
  }

  sendSSEDone(res, {
    conversationId: convId,
    messageLength: collectedText.length,
  });
  res.end();
}

module.exports = { stream, regenerate };
