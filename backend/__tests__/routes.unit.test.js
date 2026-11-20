'use strict';

const mongoose = require('mongoose');
const conversationController = require('../src/controllers/conversation.controller');
const conversationService = require('../src/services/conversation.service');

describe('Conversation Controller Units', () => {
  const mockId = new mongoose.Types.ObjectId().toString();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('list: returns conversations from service with 200', async () => {
    const mockList = [{ _id: mockId, title: 'Chat 1' }];
    jest.spyOn(conversationService, 'listConversations').mockResolvedValue(mockList);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await conversationController.list(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ conversations: mockList });
  });

  it('create: creates new conversation with 201', async () => {
    const mockConv = { _id: mockId, title: 'New Chat' };
    jest.spyOn(conversationService, 'createConversation').mockResolvedValue(mockConv);

    const req = { body: { title: 'New Chat' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await conversationController.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ conversation: mockConv });
  });

  it('rename: rejects empty title with 400', async () => {
    const req = { params: { id: mockId }, body: { title: '   ' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await conversationController.rename(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rename: updates title with 200', async () => {
    const updated = { _id: mockId, title: 'Renamed' };
    jest.spyOn(conversationService, 'updateConversationTitle').mockResolvedValue(updated);

    const req = { params: { id: mockId }, body: { title: 'Renamed' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await conversationController.rename(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ conversation: updated });
  });

  it('remove: calls deleteConversation and returns 200', async () => {
    jest.spyOn(conversationService, 'deleteConversation').mockResolvedValue();

    const req = { params: { id: mockId } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await conversationController.remove(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
