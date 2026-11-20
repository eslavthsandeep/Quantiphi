'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      enum: ['professional', 'casual', 'concise'],
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
