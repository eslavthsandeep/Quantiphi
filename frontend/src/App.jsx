import React, { useEffect } from 'react';
import { PanelLeft, Plus, MessageSquare } from 'lucide-react';
import { useAppStore } from './context/appStore';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ThemeToggle } from './components/ThemeToggle';

export default function App() {
  const { theme, initTheme, tone, sidebarOpen, toggleSidebar } = useAppStore();

  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    fetchConversations,
    addConversation,
    updateConversationTitle,
    removeConversation,
    touchConversation,
    handleRename,
    handleDelete,
  } = useConversations();

  const {
    conversationId,
    messages,
    isStreaming,
    streamingText,
    error: chatError,
    isLoadingConversation,
    sendMessage,
    stopStreaming,
    regenerate,
    loadConversation,
    startNewChat,
  } = useChat({
    onConversationCreated: (newConv) => {
      addConversation(newConv);
    },
    onConversationTouched: (id) => {
      touchConversation(id);
      fetchConversations();
    },
  });

  // Initialize theme from storage
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // When a conversation is deleted and it is currently active, clear chat
  const onDelete = async (id) => {
    const success = await handleDelete(id);
    if (success && conversationId === id) {
      startNewChat();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans antialiased">
      {/* Sidebar (History & Management) */}
      <Sidebar
        conversations={conversations}
        activeId={conversationId}
        onSelectConversation={loadConversation}
        onNewChat={startNewChat}
        onRenameConversation={handleRename}
        onDeleteConversation={onDelete}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Navbar / Mobile Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible-ring"
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-gray-800 dark:text-gray-100">
                AI Chat Assistant
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Live SSE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible-ring"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Conversation Area */}
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          currentTone={tone}
          error={chatError || conversationsError}
          isLoading={isLoadingConversation}
          onSendMessage={sendMessage}
          onStopStreaming={stopStreaming}
          onRegenerate={regenerate}
        />
      </div>
    </div>
  );
}
