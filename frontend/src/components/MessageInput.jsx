import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, AlertCircle } from 'lucide-react';

export function MessageInput({
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isTooLong = input.length > 10000;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-100 dark:shadow-none transition-all focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
          maxLength={10050}
          className="w-full resize-none bg-transparent px-4 py-3.5 pr-28 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none max-h-48"
        />

        {/* Action Controls inside Textarea */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all focus-visible-ring"
              title="Stop generating reply"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || disabled || isTooLong}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus-visible-ring"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Warnings & Helper text */}
      <div className="flex items-center justify-between mt-1.5 px-2 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="hidden sm:inline">Use Shift + Enter for new lines</span>
        {input.length > 8000 && (
          <span className={`flex items-center gap-1 ${isTooLong ? 'text-red-500 font-semibold' : 'text-amber-500'}`}>
            <AlertCircle className="w-3 h-3" />
            {input.length}/10,000 characters
          </span>
        )}
      </div>
    </div>
  );
}
