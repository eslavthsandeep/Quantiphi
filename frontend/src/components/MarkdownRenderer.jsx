/**
 * MarkdownRenderer - renders AI responses as formatted Markdown.
 * Supports GFM (tables, strikethrough) and syntax-highlighted code blocks.
 * Works correctly during streaming (content grows incrementally).
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';

export function MarkdownRenderer({ content, isStreaming = false }) {
  return (
    <div className={`chat-prose ${isStreaming ? 'streaming-cursor' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Use our custom CodeBlock for fenced code
          code({ node, inline, className, children, ...props }) {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          // Open links in new tab
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          // Style tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="border-collapse w-full text-sm">{children}</table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
