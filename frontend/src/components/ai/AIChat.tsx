"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, MessageSquarePlus } from 'lucide-react';
import { getApiUrl } from '@/config/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolStepLoader, ToolStep } from './ToolStepLoader';
import { ChatHistorySidebar, ChatSession } from './ChatHistorySidebar';
import { NewChatModal } from './NewChatModal';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  toolSteps?: ToolStep[];
  isThinking?: boolean;
  isStreaming?: boolean;
}

export function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('DeployHub AI Assistant');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am DeployHub AI Assistant.\n\nAsk me anything about your organization employees, project deployments, live container health, or deployment history.",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(getApiUrl('/ai/sessions'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  // Switch Active Session & Load Messages
  const handleSelectSession = async (sessionId: string) => {
    if (isLoading) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const targetSession = sessions.find((s) => s.id === sessionId);
    if (targetSession) {
      setActiveSessionTitle(targetSession.title);
    }

    setActiveSessionId(sessionId);

    try {
      const res = await fetch(getApiUrl(`/ai/sessions/${sessionId}/messages`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              text: m.text,
              toolSteps: m.toolSteps,
            }))
          );
        } else {
          setMessages([
            {
              id: 'empty',
              sender: 'ai',
              text: `This is the start of your "${targetSession?.title || 'New Chat'}" conversation. How can I help?`,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load session messages:', err);
      toast.error('Could not load chat messages');
    }
  };

  // Create New Chat Session from Modal
  const handleCreateChat = async (title: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please log in.');
      return;
    }

    try {
      const res = await fetch(getApiUrl('/ai/sessions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSession = data.session;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setActiveSessionTitle(newSession.title);
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: `Started chat: **${newSession.title}**.\n\nAsk me anything about your organization employees, deployments, or container health!`,
          },
        ]);
        toast.success(`Chat "${title}" created`);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Could not create new chat session');
    }
  };

  // Delete Chat Session
  const handleDeleteSession = async (sessionId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(getApiUrl(`/ai/sessions/${sessionId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setActiveSessionTitle('DeployHub AI Assistant');
          setMessages([
            {
              id: 'welcome',
              sender: 'ai',
              text: "Hello! I am DeployHub AI Assistant.\n\nAsk me anything about your organization employees, project deployments, live container health, or deployment history.",
            },
          ]);
        }
        toast.success('Chat deleted');
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      toast.error('Could not delete session');
    }
  };

  // Send Message
  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || inputPrompt).trim();
    if (!query || isLoading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please log in.');
      return;
    }

    // If no active session exists, prompt the user to name the chat first
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      setIsNewChatModalOpen(true);
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;

    const userMessage: Message = {
      id: userMessageId,
      sender: 'user',
      text: query,
    };

    const initialAiMessage: Message = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      toolSteps: [],
      isThinking: true,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAiMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/ai/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: query, sessionId: currentSessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response stream available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          let eventName = '';
          let eventDataRaw = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              eventDataRaw = line.replace('data: ', '').trim();
            }
          }

          if (!eventDataRaw) continue;

          try {
            const data = JSON.parse(eventDataRaw);

            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== aiMessageId) return msg;

                const currentSteps = msg.toolSteps ? [...msg.toolSteps] : [];

                if (eventName === 'tool_start') {
                  const existingIdx = currentSteps.findIndex((s) => s.toolName === data.toolName);
                  if (existingIdx >= 0) {
                    currentSteps[existingIdx] = { ...currentSteps[existingIdx], status: 'running' };
                  } else {
                    currentSteps.push({
                      toolName: data.toolName,
                      stepTitle: data.stepTitle,
                      status: 'running',
                    });
                  }
                  return { ...msg, toolSteps: currentSteps, isThinking: false };
                }

                if (eventName === 'tool_end') {
                  const existingIdx = currentSteps.findIndex((s) => s.toolName === data.toolName);
                  if (existingIdx >= 0) {
                    currentSteps[existingIdx] = {
                      ...currentSteps[existingIdx],
                      status: data.status === 'error' ? 'error' : 'completed',
                      resultSummary: data.resultSummary,
                    };
                  }
                  return { ...msg, toolSteps: currentSteps };
                }

                if (eventName === 'thinking') {
                  return { ...msg, isThinking: true };
                }

                if (eventName === 'token') {
                  const appendedText = msg.text + (typeof data === 'string' ? data : JSON.stringify(data));
                  return {
                    ...msg,
                    text: appendedText,
                    isThinking: false,
                  };
                }

                if (eventName === 'done') {
                  return { ...msg, isStreaming: false, isThinking: false };
                }

                if (eventName === 'error') {
                  const errorMsg = data.message || 'An error occurred during AI processing.';
                  return {
                    ...msg,
                    text: msg.text ? msg.text + `\n\n**[Error: ${errorMsg}]**` : `**[Error: ${errorMsg}]**`,
                    isStreaming: false,
                    isThinking: false,
                  };
                }

                return msg;
              })
            );
          } catch (err) {
            console.error('Error parsing SSE event data:', err);
          }
        }
      }

      // Refresh session order in sidebar
      fetchSessions();
    } catch (error: any) {
      console.error('AI Stream Error:', error);
      toast.error('Failed to communicate with AI Agent');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: 'Unable to process query. Please check server logs and configuration.',
                isStreaming: false,
                isThinking: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex h-[calc(100vh-6rem)] bg-[#09090b] text-zinc-100 font-sans rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden relative">
      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onCreateChat={handleCreateChat}
      />

      {/* Main Chat Center Column */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#09090b]">
        {/* Chat Title Top Bar */}
        <div className="px-6 py-3.5 border-b border-zinc-800/80 bg-[#0c0c0e]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
              {activeSessionTitle}
            </h2>
          </div>

          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-blue-400" />
            <span>New Session</span>
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              } animate-in fade-in duration-200`}
            >
              {/* AI Avatar */}
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div className="max-w-2xl sm:max-w-3xl space-y-1 w-full sm:w-auto">
                {/* Minimalist Loader */}
                <ToolStepLoader
                  steps={msg.toolSteps || []}
                  isThinking={msg.isThinking}
                  isStreaming={msg.isStreaming}
                />

                {(msg.sender === 'user' || msg.text.trim().length > 0) && (
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-sm ml-auto max-w-fit whitespace-pre-wrap'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none overflow-hidden'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      msg.text
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/90 shadow-md">
                              <table className="w-full text-left text-xs border-collapse min-w-[480px]" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-200 font-semibold" {...props} />
                          ),
                          tbody: ({ node, ...props }) => (
                            <tbody className="divide-y divide-zinc-800/60" {...props} />
                          ),
                          tr: ({ node, ...props }) => (
                            <tr className="hover:bg-zinc-900/40 transition-colors" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="px-3.5 py-2.5 text-zinc-300 font-semibold text-xs whitespace-nowrap" {...props} />
                          ),
                          td: ({ node, children, ...props }) => {
                            const text = String(children).trim();
                            if (text === 'RUNNING') {
                              return (
                                <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                                    ● RUNNING
                                  </span>
                                </td>
                              );
                            }
                            if (text === 'FAILED') {
                              return (
                                <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 text-red-400 border border-red-800/60">
                                    ● FAILED
                                  </span>
                                </td>
                              );
                            }
                            if (text === 'STOPPED') {
                              return (
                                <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    ● STOPPED
                                  </span>
                                </td>
                              );
                            }
                            if (text === 'BUILDING') {
                              return (
                                <td className="px-3.5 py-2.5 whitespace-nowrap" {...props}>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                                    ● BUILDING
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td className="px-3.5 py-2.5 text-zinc-300 text-xs" {...props}>
                                {children}
                              </td>
                            );
                          },
                          a: ({ node, href, children, ...props }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline font-medium"
                              {...props}
                            >
                              {children}
                            </a>
                          ),
                          code: ({ node, className, children, ...props }) => (
                            <code className="bg-zinc-800/90 text-emerald-400 px-1.5 py-0.5 rounded font-mono text-[11px] border border-zinc-700/50" {...props}>
                              {children}
                            </code>
                          ),
                          p: ({ node, ...props }) => <p className="my-1.5 leading-relaxed" {...props} />,
                          ul: ({ node, ...props }) => <ul className="my-2 ml-4 list-disc space-y-1 text-zinc-200" {...props} />,
                          ol: ({ node, ...props }) => <ol className="my-2 ml-4 list-decimal space-y-1 text-zinc-200" {...props} />,
                          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-100" {...props} />,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800 bg-[#0c0c0e]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center max-w-3xl mx-auto"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={activeSessionId ? "Message DeployHub AI..." : "Click '+ New Chat' or type here to start..."}
              disabled={isLoading}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-full px-5 py-3.5 pr-14 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="absolute right-2 p-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold transition-all disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Send className="w-4 h-4 text-black" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side: Chat History Sidebar */}
      <ChatHistorySidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onOpenNewChatModal={() => setIsNewChatModalOpen(true)}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}
