'use strict';

const { z } = require('zod');
const { validateBody } = require('../src/middleware/validate');

const streamSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  tone: z.enum(['professional', 'casual', 'concise'], {
    errorMap: () => ({ message: 'Tone must be one of: professional, casual, concise' }),
  }),
  conversationId: z.string().optional(),
});

describe('Validation Middleware', () => {
  const middleware = validateBody(streamSchema);

  function mockReqRes(body) {
    const req = { body };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();
    return { req, res, next };
  }

  it('passes valid request body with professional tone', () => {
    const { req, res, next } = mockReqRes({
      message: 'Hello world',
      tone: 'professional',
    });

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('passes valid request body with casual tone and conversationId', () => {
    const { req, res, next } = mockReqRes({
      message: 'Hey there',
      tone: 'casual',
      conversationId: '507f1f77bcf86cd799439011',
    });

    middleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects invalid tone with 400 and clear error', () => {
    const { req, res, next } = mockReqRes({
      message: 'Hello',
      tone: 'angry',
    });

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });

  it('rejects missing message with 400', () => {
    const { req, res, next } = mockReqRes({
      tone: 'concise',
    });

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });

  it('rejects empty message with 400', () => {
    const { req, res, next } = mockReqRes({
      message: '',
      tone: 'concise',
    });

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects messages longer than 10000 characters', () => {
    const { req, res, next } = mockReqRes({
      message: 'x'.repeat(10001),
      tone: 'professional',
    });

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
