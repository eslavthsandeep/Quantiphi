'use strict';

const env = require('../../config/env');

/**
 * OpenAI LLM provider.
 * Uses the openai SDK for streaming completions.
 */

/**
 * Async generator that streams tokens from OpenAI's API.
 * @param {{ systemPrompt: string, messages: Array<{role: string, content: string}>, signal: AbortSignal }} options
 */
async function* streamChat({ systemPrompt, messages, signal }) {
  if (!env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Set it in your .env file or environment variables.'
    );
  }

  // Lazy-require to avoid import errors when provider is not in use
  const { default: OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  // Prepend the system message to the messages array
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  const stream = await client.chat.completions.create({
    model: env.LLM_MODEL || 'gpt-4o',
    stream: true,
    messages: formattedMessages,
  });

  for await (const chunk of stream) {
    if (signal && signal.aborted) {
      if (stream.controller && stream.controller.abort) {
        stream.controller.abort();
      }
      throw new DOMException('Stream aborted by client', 'AbortError');
    }

    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

module.exports = { streamChat };
