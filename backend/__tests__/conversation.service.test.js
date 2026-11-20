'use strict';

const mongoose = require('mongoose');
const Conversation = require('../src/models/Conversation');
const conversationService = require('../src/services/conversation.service');

describe('Conversation Service', () => {
  const mockId = new mongoose.Types.ObjectId().toString();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists conversations sorted by updatedAt descending', async () => {
    const mockList = [
      { _id: '1', title: 'Newer', updatedAt: new Date('2026-01-02') },
      { _id: '2', title: 'Older', updatedAt: new Date('2026-01-01') },
    ];

    jest.spyOn(Conversation, 'find').mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => mockList,
        }),
      }),
    });

    const result = await conversationService.listConversations();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Newer');
  });

  it('creates an empty conversation with default or custom title', async () => {
    jest.spyOn(Conversation.prototype, 'save').mockResolvedValue(true);

    const conv = await conversationService.createConversation('My Title');
    expect(conv.title).toBe('My Title');
    expect(conv.messages).toEqual([]);
  });

  it('gets a conversation by id or throws 404 when not found', async () => {
    jest.spyOn(Conversation, 'findById').mockResolvedValue(null);

    await expect(conversationService.getConversation(mockId)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('updates conversation title', async () => {
    const mockConv = {
      _id: mockId,
      title: 'Old Title',
      save: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConv);

    const result = await conversationService.updateConversationTitle(mockId, 'Renamed Chat');
    expect(result.title).toBe('Renamed Chat');
    expect(mockConv.save).toHaveBeenCalled();
  });

  it('deletes conversation by id', async () => {
    jest.spyOn(Conversation, 'findByIdAndDelete').mockResolvedValue({ _id: mockId });

    await expect(conversationService.deleteConversation(mockId)).resolves.toBeUndefined();
  });

  it('adds user and assistant messages with role, content, tone, and timestamp', async () => {
    const mockConv = {
      _id: mockId,
      messages: [],
      save: jest.fn().mockResolvedValue(true),
    };
    jest.spyOn(Conversation, 'findById').mockResolvedValue(mockConv);

    await conversationService.addMessage(mockId, {
      role: 'user',
      content: 'Hello AI',
      tone: null,
    });

    expect(mockConv.messages).toHaveLength(1);
    expect(mockConv.messages[0].role).toBe('user');
    expect(mockConv.messages[0].content).toBe('Hello AI');

    await conversationService.addMessage(mockId, {
      role: 'assistant',
      content: 'Hello User!',
      tone: 'casual',
    });

    expect(mockConv.messages).toHaveLength(2);
    expect(mockConv.messages[1].role).toBe('assistant');
    expect(mockConv.messages[1].tone).toBe('casual');
    expect(mockConv.save).toHaveBeenCalledTimes(2);
  });
});
