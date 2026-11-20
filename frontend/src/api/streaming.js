/**
 * SSE streaming client using fetch + ReadableStream + AbortController.
 * Handles token-by-token text streaming from the backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Parse a single SSE line block into { event, data }.
 */
function parseSSEBlock(block) {
  const lines = block.trim().split('\n');
  const result = { event: 'message', data: null };

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      result.event = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      try {
        result.data = JSON.parse(line.slice(6));
      } catch {
        result.data = line.slice(6);
      }
    }
  }

  return result;
}

/**
 * Stream a chat message using SSE.
 *
 * @param {object} params
 * @param {string} params.message - User message
 * @param {string} params.tone - Tone key
 * @param {string} [params.conversationId] - Existing conversation ID
 * @param {AbortSignal} params.signal - AbortSignal for cancellation
 * @param {function} params.onToken - Called with each text chunk
 * @param {function} params.onMeta - Called with meta data (conversationId)
 * @param {function} params.onDone - Called when stream completes
 * @param {function} params.onError - Called on error
 */
export async function streamChat({
  message,
  tone,
  conversationId,
  signal,
  onToken,
  onMeta,
  onDone,
  onError,
}) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tone, conversationId }),
      signal,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: `HTTP ${response.status}` } };
      }
      onError(errorData?.error?.message || 'Chat request failed');
      return;
    }

    await readSSEStream({ reader: response.body.getReader(), onToken, onMeta, onDone, onError, signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      // User aborted — handled by the caller
      return;
    }
    onError(err.message || 'Failed to connect to the server');
  }
}

/**
 * Regenerate the last assistant message using SSE.
 */
export async function regenerateChat({
  conversationId,
  tone,
  signal,
  onToken,
  onMeta,
  onDone,
  onError,
}) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, tone }),
      signal,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: `HTTP ${response.status}` } };
      }
      onError(errorData?.error?.message || 'Regeneration failed');
      return;
    }

    await readSSEStream({ reader: response.body.getReader(), onToken, onMeta, onDone, onError, signal });
  } catch (err) {
    if (err.name === 'AbortError') return;
    onError(err.message || 'Failed to connect to the server');
  }
}

/**
 * Read an SSE ReadableStream and dispatch events.
 */
async function readSSEStream({ reader, onToken, onMeta, onDone, onError, signal }) {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (signal?.aborted) break;

    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split on double newline (SSE event separator)
    const events = buffer.split('\n\n');
    buffer = events.pop() || ''; // Keep the incomplete last chunk

    for (const block of events) {
      if (!block.trim()) continue;
      const { event, data } = parseSSEBlock(block);

      switch (event) {
        case 'meta':
          if (onMeta && data) onMeta(data);
          break;
        case 'token':
          if (onToken && data?.text) onToken(data.text);
          break;
        case 'done':
          if (onDone) onDone(data);
          break;
        case 'error':
          if (onError) onError(data?.message || 'Stream error');
          break;
        default:
          break;
      }
    }
  }

  reader.releaseLock();
}
