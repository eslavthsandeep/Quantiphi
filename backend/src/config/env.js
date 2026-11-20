'use strict';

const { z } = require('zod');

const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: 'PORT must be a positive integer' }),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/chat-assistant'),

  LLM_PROVIDER: z
    .enum(['anthropic', 'openai', 'mock'])
    .default('mock'),

  LLM_MODEL: z
    .string()
    .optional()
    .transform((val) => {
      if (val) return val;
      // Default model based on provider
      const provider = process.env.LLM_PROVIDER || 'mock';
      if (provider === 'anthropic') return 'claude-3-5-sonnet-20241022';
      if (provider === 'openai') return 'gpt-4o';
      return 'mock-model';
    }),

  ANTHROPIC_API_KEY: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),

  FRONTEND_URL: z
    .string()
    .default('http://localhost:5173'),

  HISTORY_LIMIT: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, { message: 'HISTORY_LIMIT must be a positive integer' }),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const formatted = parseResult.error.format();
  console.error('[ENV] Invalid environment variables:');
  console.error(JSON.stringify(formatted, null, 2));
}

const env = parseResult.success ? parseResult.data : {
  PORT: 5000,
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://localhost:27017/chat-assistant',
  LLM_PROVIDER: 'mock',
  LLM_MODEL: 'mock-model',
  ANTHROPIC_API_KEY: undefined,
  OPENAI_API_KEY: undefined,
  FRONTEND_URL: 'http://localhost:5173',
  HISTORY_LIMIT: 20,
};

module.exports = env;
