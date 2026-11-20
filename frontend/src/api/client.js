/**
 * REST API client for conversations.
 * All requests go to the backend Express server.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Generic fetch wrapper with consistent error handling.
 */
async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { error: { message: `HTTP ${res.status}: ${res.statusText}` } };
    }
    const message = errorData?.error?.message || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.code = errorData?.error?.code;
    throw error;
  }

  return res.json();
}

// --- Conversation CRUD ---

export const getConversations = () => apiFetch('/api/conversations');

export const createConversation = () =>
  apiFetch('/api/conversations', { method: 'POST', body: JSON.stringify({}) });

export const getConversation = (id) => apiFetch(`/api/conversations/${id}`);

export const renameConversation = (id, title) =>
  apiFetch(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });

export const deleteConversation = (id) =>
  apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });

// --- Health Check ---
export const checkHealth = () => apiFetch('/api/health');
