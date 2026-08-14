"use client";

import React, { useState } from 'react';
import { MessageSquarePlus, Sparkles, X } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (title: string) => void;
}

const PRESET_TOPICS = [
  'Team Audit',
  'Deployments Check',
  'Docker Telemetry',
  'Build Debugging',
  'Project Overview',
  'Security & Permissions',
];

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateChat(title.trim());
    setTitle('');
    onClose();
  };

  const handleSelectPreset = (preset: string) => {
    setTitle(preset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Start New AI Chat</h2>
            <p className="text-xs text-zinc-400">Enter a name for this conversation session</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Chat Session Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Production Deployment Audit"
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
            />
          </div>

          {/* Quick Preset Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" /> Suggested Topics
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TOPICS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    title === preset
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-xs font-semibold text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl transition-all shadow-sm"
            >
              Create Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
