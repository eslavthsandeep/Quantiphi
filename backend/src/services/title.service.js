'use strict';

const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

/**
 * Generate and save a title for a conversation based on the first exchange.
 * Falls back to the first 6 words of the user message on any failure.
 *
 * @param {string} conversationId
 * @param {string} userMessage
 * @param {string} assistantMessage
 * @returns {Promise<string>} The generated title.
 */
async function generateTitle(conversationId, userMessage, assistantMessage) {
  let title = 'New Chat';

  try {
    const env = require('../config/env');
    const provider = env.LLM_PROVIDER;

    if (provider === 'mock') {
      // For mock: build a smart title from the user message
      title = buildTitleFromMessage(userMessage);
    } else {
      // For real providers: make a cheap non-streaming call for a short title
      title = await generateTitleFromLLM(userMessage, assistantMessage, provider, env);
    }
  } catch (err) {
    logger.warn('[TitleService] Title generation failed, using fallback:', err.message);
    title = buildTitleFromMessage(userMessage);
  }

  // Persist the title without blocking the caller
  Conversation.findByIdAndUpdate(conversationId, { title }).catch((err) => {
    logger.warn('[TitleService] Failed to save title:', err.message);
  });

  return title;
}

/**
 * Build a simple title from the first few words of a user message.
 * @param {string} message
 * @returns {string}
 */
function buildTitleFromMessage(message) {
  if (!message) return 'New Chat';
  const words = message.trim().split(/\s+/);
  const titleWords = words.slice(0, 6);
  let title = titleWords.join(' ');
  if (words.length > 6) title += '...';
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/**
 * Generate a title using the configured LLM provider (non-streaming call).
 * @param {string} userMessage
 * @param {string} assistantMessage
 * @param {string} provider
 * @param {object} env
 * @returns {Promise<string>}
 */
async function generateTitleFromLLM(userMessage, assistantMessage, provider, env) {
  const prompt =
    `Generate a concise 4-6 word title for a conversation that starts with:\n` +
    `User: ${userMessage.slice(0, 200)}\n` +
    `Assistant: ${assistantMessage.slice(0, 200)}\n\n` +
    `Respond with ONLY the title, no quotes, no punctuation at the end.`;

  if (provider === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) return buildTitleFromMessage(userMessage);
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 30,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0]?.text || '';
    return sanitizeTitle(text) || buildTitleFromMessage(userMessage);
  }

  if (provider === 'openai') {
    if (!env.OPENAI_API_KEY) return buildTitleFromMessage(userMessage);
    const { default: OpenAI } = require('openai');
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 30,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.choices[0]?.message?.content || '';
    return sanitizeTitle(text) || buildTitleFromMessage(userMessage);
  }

  return buildTitleFromMessage(userMessage);
}

/**
 * Sanitize LLM-generated title: remove surrounding quotes, trim, truncate.
 * @param {string} text
 * @returns {string}
 */
function sanitizeTitle(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\.$/, '')
    .trim()
    .slice(0, 80);
}

module.exports = { generateTitle };
