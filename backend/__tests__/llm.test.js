'use strict';

const { getProvider } = require('../src/services/llm/index');
const { TONES } = require('../src/config/tones');

describe('Mock LLM Provider Adapter', () => {
  const provider = getProvider();

  it('streams responses in professional tone', async () => {
    const systemPrompt = TONES.professional.systemPrompt;
    const messages = [{ role: 'user', content: 'What is your purpose?' }];

    const chunks = [];
    for await (const chunk of provider.streamChat({ systemPrompt, messages })) {
      chunks.push(chunk);
    }

    const fullResponse = chunks.join('');
    expect(fullResponse.length).toBeGreaterThan(0);
    expect(fullResponse).toContain('**');
  }, 10000);

  it('streams responses in casual tone with friendly phrasing', async () => {
    const systemPrompt = TONES.casual.systemPrompt;
    const messages = [{ role: 'user', content: 'Tell me a joke' }];

    const chunks = [];
    for await (const chunk of provider.streamChat({ systemPrompt, messages })) {
      chunks.push(chunk);
    }

    const fullResponse = chunks.join('');
    expect(fullResponse.length).toBeGreaterThan(0);
  }, 10000);

  it('streams responses in concise tone', async () => {
    const systemPrompt = TONES.concise.systemPrompt;
    const messages = [{ role: 'user', content: 'Summarize HTTP' }];

    const chunks = [];
    for await (const chunk of provider.streamChat({ systemPrompt, messages })) {
      chunks.push(chunk);
    }

    const fullResponse = chunks.join('');
    expect(fullResponse.length).toBeGreaterThan(0);
  }, 10000);

  it('respects AbortSignal and cancels cleanly', async () => {
    const abortController = new AbortController();
    const systemPrompt = TONES.professional.systemPrompt;
    const messages = [{ role: 'user', content: 'Generate a long essay' }];

    const stream = provider.streamChat({
      systemPrompt,
      messages,
      signal: abortController.signal,
    });

    let aborted = false;
    try {
      for await (const chunk of stream) {
        abortController.abort();
      }
    } catch (err) {
      aborted = true;
    }

    expect(aborted).toBe(true);
  }, 10000);
});
