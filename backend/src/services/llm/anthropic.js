'use strict';

const env = require('../../config/env');

/**
 * Anthropic LLM provider.
 * Uses @anthropic-ai/sdk for streaming completions.
 */

/**
 * Async generator that streams tokens from Anthropic's Claude API.
 * @param {{ systemPrompt: string, messages: Array<{role: string, content: string}>, signal: AbortSignal }} options
 */
async function* streamChat({ systemPrompt, messages, signal }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Set it in your .env file or environment variables.'
    );
  }

  // Lazy-require to avoid import errors when provider is not in use
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic.default({ apiKey: env.ANTHROPIC_API_KEY });

  // Anthropic requires alternating user/assistant roles; format accordingly
  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const stream = await client.messages.stream({
    model: env.LLM_MODEL || 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    system: systemPrompt,
    messages: formattedMessages,
  });

  for await (const event of stream) {
    if (signal && signal.aborted) {
      if (stream.controller && stream.controller.abort) {
        stream.controller.abort();
      }
      throw new DOMException('Stream aborted by client', 'AbortError');
    }

    if (
      event.type === 'content_block_delta' &&
      event.delta &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

module.exports = { streamChat };
