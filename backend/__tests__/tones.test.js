'use strict';

const { TONES, TONE_KEYS, DEFAULT_TONE } = require('../src/config/tones');

describe('Tones Configuration', () => {
  test('TONES object has exactly 3 keys: professional, casual, concise', () => {
    const keys = Object.keys(TONES);
    expect(keys).toHaveLength(3);
    expect(keys).toContain('professional');
    expect(keys).toContain('casual');
    expect(keys).toContain('concise');
  });

  test.each(['professional', 'casual', 'concise'])(
    '%s tone has a non-empty systemPrompt string',
    (tone) => {
      expect(typeof TONES[tone].systemPrompt).toBe('string');
      expect(TONES[tone].systemPrompt.length).toBeGreaterThan(0);
    }
  );

  test.each(['professional', 'casual', 'concise'])(
    '%s tone has a non-empty label string',
    (tone) => {
      expect(typeof TONES[tone].label).toBe('string');
      expect(TONES[tone].label.length).toBeGreaterThan(0);
    }
  );

  test('TONE_KEYS array contains professional, casual, concise', () => {
    expect(TONE_KEYS).toHaveLength(3);
    expect(TONE_KEYS).toContain('professional');
    expect(TONE_KEYS).toContain('casual');
    expect(TONE_KEYS).toContain('concise');
  });

  test('DEFAULT_TONE is "professional"', () => {
    expect(DEFAULT_TONE).toBe('professional');
  });

  test('professional systemPrompt contains formal language guidance', () => {
    expect(TONES.professional.systemPrompt.toLowerCase()).toMatch(/formal|polished|structured/);
  });

  test('casual systemPrompt contains friendly language guidance', () => {
    expect(TONES.casual.systemPrompt.toLowerCase()).toMatch(/friendly|conversational/);
  });

  test('concise systemPrompt contains brevity guidance', () => {
    expect(TONES.concise.systemPrompt.toLowerCase()).toMatch(/brief|concise|point/);
  });
});
