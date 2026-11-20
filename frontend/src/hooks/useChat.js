/**
 * Hook for managing the active chat session.
 * Handles message state, streaming, stop, and regenerate.
 */
import { useState, useCallback, useRef } from 'react';
import * as api from '../api/client';
import { streamChat, regenerateChat } from '../api/streaming';

export function useChat({ onConversationCreated, onConversationTouched }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // AbortController for the current stream
  const abortControllerRef = useRef(null);

  /**
   * Load a conversation from the server.
   */
  const loadConversation = useCallback(async (id) => {
    setIsLoadingConversation(true);
    setError(null);
    try {
      const data = await api.getConversation(id);
      setConversationId(id);
      setMessages(data.conversation.messages || []);
      setStreamingText('');
    } catch (err) {
      setError(err.message || 'Failed to load conversation');
    } finally {
      setIsLoadingConversation(false);
    }
  }, []);

  /**
   * Start a new chat (clear all state).
   */
  const startNewChat = useCallback(() => {
    // Abort any running stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setConversationId(null);
    setMessages([]);
    setStreamingText('');
    setError(null);
    setIsStreaming(false);
  }, []);

  /**
   * Send a user message and stream the AI response.
   */
  const sendMessage = useCallback(
    async (message, tone) => {
      if (isStreaming || !message.trim()) return;

      setError(null);

      // Optimistically add user message to UI
      const userMsg = {
        _id: `temp-user-${Date.now()}`,
        role: 'user',
        content: message,
        tone: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText('');

      // Create AbortController for this stream
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let resolvedConversationId = conversationId;

      await streamChat({
        message,
        tone,
        conversationId: resolvedConversationId,
        signal: abortController.signal,
        onMeta: (data) => {
          if (data.conversationId) {
            resolvedConversationId = data.conversationId;
            setConversationId(data.conversationId);

            // Notify parent of new conversation
            if (!conversationId) {
              onConversationCreated?.({ _id: data.conversationId, title: 'New Chat', updatedAt: new Date().toISOString() });
            }
          }
        },
        onToken: (text) => {
          setStreamingText((prev) => prev + text);
        },
        onDone: async () => {
          setIsStreaming(false);

          // Reload the conversation from server to get persisted messages with IDs
          if (resolvedConversationId) {
            try {
              const data = await api.getConversation(resolvedConversationId);
              setMessages(data.conversation.messages || []);
              onConversationTouched?.(resolvedConversationId);
            } catch {
              // Keep optimistic messages on failure
            }
          }
          setStreamingText('');
          abortControllerRef.current = null;
        },
        onError: (errMsg) => {
          setIsStreaming(false);
          setStreamingText('');
          setError(errMsg || 'An error occurred while streaming');
          abortControllerRef.current = null;
        },
      });
    },
    [conversationId, isStreaming, onConversationCreated, onConversationTouched]
  );

  /**
   * Stop the current stream.
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    // The partial text is saved by the backend on abort
    // Reload conversation to show the partial message
    if (conversationId) {
      setTimeout(async () => {
        try {
          const data = await api.getConversation(conversationId);
          setMessages(data.conversation.messages || []);
          setStreamingText('');
        } catch {
          // ignore
        }
      }, 500);
    }
  }, [conversationId]);

  /**
   * Regenerate the last AI response.
   */
  const regenerate = useCallback(
    async (tone) => {
      if (!conversationId || isStreaming) return;

      setError(null);

      // Remove last assistant message from UI optimistically
      setMessages((prev) => {
        const lastAssistantIdx = [...prev].reverse().findIndex((m) => m.role === 'assistant');
        if (lastAssistantIdx === -1) return prev;
        const actualIdx = prev.length - 1 - lastAssistantIdx;
        return prev.slice(0, actualIdx);
      });

      setIsStreaming(true);
      setStreamingText('');

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await regenerateChat({
        conversationId,
        tone,
        signal: abortController.signal,
        onMeta: () => {},
        onToken: (text) => {
          setStreamingText((prev) => prev + text);
        },
        onDone: async () => {
          setIsStreaming(false);
          if (conversationId) {
            try {
              const data = await api.getConversation(conversationId);
              setMessages(data.conversation.messages || []);
              onConversationTouched?.(conversationId);
            } catch {
              // ignore
            }
          }
          setStreamingText('');
          abortControllerRef.current = null;
        },
        onError: (errMsg) => {
          setIsStreaming(false);
          setStreamingText('');
          setError(errMsg || 'Regeneration failed');
          abortControllerRef.current = null;
        },
      });
    },
    [conversationId, isStreaming, onConversationTouched]
  );

  return {
    conversationId,
    messages,
    isStreaming,
    streamingText,
    error,
    isLoadingConversation,
    sendMessage,
    stopStreaming,
    regenerate,
    loadConversation,
    startNewChat,
    setError,
  };
}
