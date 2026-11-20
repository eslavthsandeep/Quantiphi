'use strict';

const env = require('../config/env');

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, args) {
  const ts = formatTimestamp();
  return [`[${ts}] [${level}]`, ...args];
}

const logger = {
  info(...args) {
    console.info(...formatMessage('INFO', args));
  },

  warn(...args) {
    console.warn(...formatMessage('WARN', args));
  },

  error(...args) {
    console.error(...formatMessage('ERROR', args));
  },

  debug(...args) {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      console.debug(...formatMessage('DEBUG', args));
    }
  },
};

module.exports = logger;
