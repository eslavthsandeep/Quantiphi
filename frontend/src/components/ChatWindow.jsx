import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowDown, MessageSquare, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ToneToggle } from './ToneToggle';

export function ChatWindow({
  messages = [],
  isStreaming = false,
  streamingText = '',
  currentTone = 'professional',
  error = null,
  isLoading = false,
  onSendMessage,
  onStopStreaming,
  onRegenerate,
}) {
  const scrollContainerRef = useRef(null);
  const bottomAnchorRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Check scroll position to determine if user scrolled up
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If distance > 120px, consider user has scrolled up
    setUserScrolledUp(distanceToBottom > 120);
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
      setUserScrolledUp(false);
    }
  }, []);

  // Auto-scroll when new messages or streaming chunks arrive, unless user scrolled up
  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, streamingText, userScrolledUp, scrollToBottom]);

  // Find index of the last assistant message
  const lastAssistantIndex = messages.reduce((lastIdx, m, idx) => {
    return m.role === 'assistant' ? idx : lastIdx;
  }, -1);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-gray-900/50 relative">
      {/* Top Tone Bar (Desktop & Mobile) */}
      <div className="border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Response Tone:</span>
          <ToneToggle disabled={isStreaming} />
        </div>
      </div>

      {/* Main Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4"
      >
        {/* Loading State for initial load */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 dark:text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
            <p className="text-sm">Loading conversation...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-center px-4 max-w-md mx-auto my-auto animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
              How can I help you today?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Pick your preferred tone above and ask any question. Responses support Markdown formatting and syntax-highlighted code.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left">
              {[
                { label: 'Explain Quantum Computing', icon: '⚛️' },
                { label: 'Write a TypeScript debounce function', icon: '💻' },
                { label: 'Draft a polite client follow-up email', icon: '✉️' },
                { label: 'Compare SQL vs NoSQL in 3 bullets', icon: '📊' },
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion.label)}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 text-xs text-gray-700 dark:text-gray-300 transition-all text-left flex items-center gap-2 group shadow-2xs hover:shadow-xs"
                >
                  <span className="text-sm">{suggestion.icon}</span>
                  <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {suggestion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render Existing Messages */}
        {!isLoading &&
          messages.map((message, index) => {
            const isLastAssistant = index === lastAssistantIndex && !isStreaming;
            return (
              <MessageBubble
                key={message._id || index}
                message={message}
                isLastAssistant={isLastAssistant}
                isStreaming={false}
                onRegenerate={() => onRegenerate(currentTone)}
                disabled={isStreaming}
              />
            );
          })}

        {/* Streaming Bubble */}
        {isStreaming && (
          <MessageBubble
            message={{
              role: 'assistant',
              content: streamingText,
              tone: currentTone,
              createdAt: new Date().toISOString(),
            }}
            isLastAssistant={true}
            isStreaming={true}
          />
        )}

        {/* Error banner within message flow */}
        {error && (
          <div className="w-full max-w-4xl mx-auto px-4 py-2 animate-fade-in">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div ref={bottomAnchorRef} className="h-2" />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {userScrolledUp && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-20 focus-visible-ring"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Bottom Bar */}
      <div className="border-t border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
        <MessageInput
          onSend={(msg) => onSendMessage(msg, currentTone)}
          onStop={onStopStreaming}
          isStreaming={isStreaming}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
