"use client";

import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onOpenNewChatModal: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onOpenNewChatModal,
  onDeleteSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className="border-l border-zinc-800/80 bg-[#0c0c0e] flex flex-col items-center py-4 px-2 space-y-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Expand Chat History"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenNewChatModal}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-72 lg:w-80 border-l border-zinc-800/80 bg-[#0c0c0e] flex flex-col h-full shrink-0 transition-all duration-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Chat History
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onOpenNewChatModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-900/20 transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500 space-y-2">
            <Clock className="w-6 h-6 mx-auto text-zinc-600 opacity-60" />
            <p>No saved chats found</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            let timeAgo = '';
            try {
              timeAgo = formatDistanceToNow(new Date(session.updatedAt || session.createdAt), {
                addSuffix: true,
              });
            } catch {
              timeAgo = 'recently';
            }

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-zinc-800/80 border-zinc-700 text-white shadow-sm'
                    : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate block">
                      {session.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5">
                    {timeAgo}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete chat "${session.title}"?`)) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 transition-all shrink-0"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
