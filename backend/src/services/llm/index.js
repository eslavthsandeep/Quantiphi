'use strict';

const env = require('../../config/env');

/**
 * LLM provider factory.
 * Returns the correct provider module based on the LLM_PROVIDER env variable.
 * @returns {{ streamChat: Function }}
 */
function getProvider() {
  switch (env.LLM_PROVIDER) {
    case 'anthropic':
      return require('./anthropic');
    case 'openai':
      return require('./openai');
    case 'mock':
    default:
      return require('./mock');
  }
}

module.exports = { getProvider };
