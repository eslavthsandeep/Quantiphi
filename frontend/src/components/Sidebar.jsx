import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../context/appStore';
import { ThemeToggle } from './ThemeToggle';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Sidebar({
  conversations = [],
  activeId = null,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
}) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const startRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const saveRename = async (id, e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      await onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setEditingId(null);
  };

  const confirmDelete = async (id, e) => {
    e.stopPropagation();
    await onDeleteConversation(id);
    setDeletingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              AI
            </div>
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              Chat Assistant
            </span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible-ring"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-all focus-visible-ring"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-500">
            Recent Chats
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-gray-400 dark:text-gray-500">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv._id === activeId;
              const isEditing = editingId === conv._id;
              const isDeleting = deletingId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => {
                    if (!isEditing && !isDeleting) {
                      onSelectConversation(conv._id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(conv._id, e);
                          if (e.key === 'Escape') cancelRename(e);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="bg-white dark:bg-gray-800 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-gray-900 dark:text-gray-100 w-full focus:outline-none"
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{conv.title}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {formatRelativeTime(conv.updatedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit, Delete, Confirm Delete */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => saveRename(conv._id, e)}
                        className="p-1 hover:text-green-600 rounded text-gray-400"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 hover:text-red-500 rounded text-gray-400"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : isDeleting ? (
                    <div className="flex items-center gap-1 ml-1 bg-red-50 dark:bg-red-950/60 p-1 rounded-lg" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] text-red-600 font-medium">Delete?</span>
                      <button
                        onClick={(e) => confirmDelete(conv._id, e)}
                        className="p-0.5 text-red-600 hover:text-red-700 font-bold"
                        title="Confirm Delete"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => startRename(conv, e)}
                        className="p-1 hover:text-blue-600 dark:hover:text-blue-400 text-gray-400 rounded transition-colors"
                        title="Rename conversation"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(conv._id);
                        }}
                        className="p-1 hover:text-red-600 dark:hover:text-red-400 text-gray-400 rounded transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
            Ready
          </span>
          <span>v1.0.0</span>
        </div>
      </aside>
    </>
  );
}
