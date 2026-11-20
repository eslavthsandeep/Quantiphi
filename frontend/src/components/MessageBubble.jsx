import React from 'react';
import { Bot, User, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

const TONE_BADGES = {
  professional: {
    label: 'Professional',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-500',
  },
  casual: {
    label: 'Casual',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  concise: {
    label: 'Concise',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
};

function formatTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageBubble({
  message,
  isLastAssistant = false,
  isStreaming = false,
  onRegenerate = null,
  disabled = false,
}) {
  const isUser = message.role === 'user';
  const toneInfo = message.tone ? TONE_BADGES[message.tone] : null;
  const timeFormatted = formatTime(message.createdAt);

  return (
    <div
      className={`flex gap-3 w-full max-w-4xl mx-auto py-2 px-2 sm:px-4 animate-fade-in ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Bot Avatar (Left) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`flex flex-col group ${
          isUser ? 'items-end max-w-[85%] sm:max-w-[75%]' : 'items-start max-w-[90%] sm:max-w-[85%]'
        }`}
      >
        {/* Header / Tone & Timestamp */}
        <div className="flex items-center gap-2 mb-1 px-1 text-xs text-gray-400 dark:text-gray-500">
          {!isUser && toneInfo && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${toneInfo.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${toneInfo.dotClass}`} />
              {toneInfo.label}
            </span>
          )}
          {timeFormatted && (
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3" />
              {timeFormatted}
            </span>
          )}
        </div>

        {/* Bubble Content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-colors ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-xs whitespace-pre-wrap selection:bg-blue-400 selection:text-white'
              : 'bg-white dark:bg-gray-800/95 text-gray-800 dark:text-gray-100 rounded-bl-xs border border-gray-100 dark:border-gray-700/60'
          }`}
        >
          {isUser ? (
            <p className="break-words">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
          )}
        </div>

        {/* Action footer for assistant messages */}
        {!isUser && !isStreaming && isLastAssistant && onRegenerate && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <button
              onClick={onRegenerate}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible-ring"
              title="Regenerate response with current tone"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>
        )}
      </div>

      {/* User Avatar (Right) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center shadow-sm mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
