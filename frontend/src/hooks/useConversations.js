/**
 * Hook for managing the conversations sidebar list.
 * Handles CRUD operations and local state sync.
 */
import { useState, useCallback, useEffect } from 'react';
import * as api from '../api/client';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const addConversation = useCallback((conversation) => {
    setConversations((prev) => [conversation, ...prev]);
  }, []);

  const updateConversationTitle = useCallback((id, title) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === id ? { ...c, title } : c))
    );
  }, []);

  const removeConversation = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c._id !== id));
  }, []);

  const touchConversation = useCallback((id) => {
    // Move a conversation to the top (simulate updatedAt change)
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c._id === id);
      if (idx <= 0) return prev;
      const updated = [...prev];
      const [item] = updated.splice(idx, 1);
      return [{ ...item, updatedAt: new Date().toISOString() }, ...updated];
    });
  }, []);

  const handleRename = useCallback(async (id, title) => {
    try {
      await api.renameConversation(id, title);
      updateConversationTitle(id, title);
      return true;
    } catch (err) {
      return false;
    }
  }, [updateConversationTitle]);

  const handleDelete = useCallback(async (id) => {
    try {
      await api.deleteConversation(id);
      removeConversation(id);
      return true;
    } catch (err) {
      return false;
    }
  }, [removeConversation]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    addConversation,
    updateConversationTitle,
    removeConversation,
    touchConversation,
    handleRename,
    handleDelete,
  };
}
