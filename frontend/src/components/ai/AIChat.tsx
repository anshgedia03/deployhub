"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, MessageSquarePlus, Rocket, ChevronDown, Sparkles, Cpu, Layers, Check, Plus, Zap, Shield, UserCheck, X, FolderGit2 } from 'lucide-react';
import { getApiUrl } from '@/config/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ToolStepLoader, ToolStep } from './ToolStepLoader';
import { ChatHistorySidebar, ChatSession } from './ChatHistorySidebar';
import { NewChatModal } from './NewChatModal';
import { RocketLaunchAnimation } from './RocketLaunchAnimation';
import { AutomationSelectionModal, SelectedEntity } from './AutomationSelectionModal';

export interface AIModelOption {
  id: string;
  name: string;
  label: string;
  provider: string;
  badge: string;
  badgeColor: string;
  description: string;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B Instant',
    provider: 'Groq',
    badge: 'Fast & Instant',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Ultra-fast sub-second latency for real-time queries',
  },
  {
    id: 'gpt-oss-20b',
    name: 'gpt-oss-20b',
    label: 'GPT OSS 20B Reasoning',
    provider: 'OpenAI / OSS',
    badge: 'Multi-Step',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Advanced reasoning, step-by-step tool plan execution',
  },
  {
    id: 'groq/compound',
    name: 'groq/compound',
    label: 'Groq Compound System',
    provider: 'Groq Compound',
    badge: 'Multi-Agent',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'Multi-agent composite routing with tool specialization',
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B Versatile',
    provider: 'Meta / Groq',
    badge: 'Flagship 70B',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Deep architectural and deployment configuration analysis',
  },
];

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

  // Model Selection State
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('deployhub_selected_model') || 'llama-3.1-8b-instant';
    }
    return 'llama-3.1-8b-instant';
  });
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Rocket Launch Animation & Automation Mode States & Refs
  const [isRocketLaunching, setIsRocketLaunching] = useState(false);
  const [isInputShaking, setIsInputShaking] = useState(false);
  const [isAutomationMode, setIsAutomationMode] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<SelectedEntity[]>([]);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const rocketButtonRef = useRef<HTMLButtonElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

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

  // Close model dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Trigger Rocket Launch Animation or Toggle Off Automation Mode
  const handleRocketLaunch = () => {
    if (isRocketLaunching) return;
    if (isAutomationMode) {
      setIsAutomationMode(false);
      setSelectedEntities([]);
      return;
    }
    setIsRocketLaunching(true);
  };

  const handleRocketImpact = () => {
    setIsInputShaking(true);
    window.setTimeout(() => setIsInputShaking(false), 280);
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
      let finalPrompt = query;
      if (selectedEntities.length > 0) {
        const contextSummary = selectedEntities
          .map((e) => `${e.type.toUpperCase()}: ${e.title}${e.subtitle ? ` (${e.subtitle})` : ''}${e.badge ? ` [${e.badge}]` : ''}`)
          .join(', ');
        finalPrompt = `[Selected Context: ${contextSummary}]\n\n${query}`;
      }

      const response = await fetch(getApiUrl('/ai/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          sessionId: currentSessionId,
          model: selectedModel,
          selectedEntities,
        }),
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
      <div
        ref={chatContainerRef}
        className="flex-1 flex flex-col h-full relative min-w-0 bg-[#09090b] overflow-hidden"
      >
        {/* Rocket Launch Overlay Animation */}
        <RocketLaunchAnimation
          isLaunching={isRocketLaunching}
          onAnimationComplete={() => {
            setIsRocketLaunching(false);
            setIsAutomationMode(true);
          }}
          onImpact={handleRocketImpact}
          containerRef={chatContainerRef}
          buttonRef={rocketButtonRef}
          inputRef={inputWrapperRef}
        />

        {/* Chat Title Top Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-zinc-800/80 bg-[#0c0c0e]/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold text-zinc-200 truncate">
              {activeSessionTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Model Selector Dropdown */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all shadow-sm group"
                title="Select AI Model"
              >
                <Cpu className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-[11px] text-zinc-200 max-w-[130px] sm:max-w-none truncate">
                  {AVAILABLE_MODELS.find((m) => m.id === selectedModel)?.name || selectedModel}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    isModelDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl bg-[#121215] border border-zinc-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                  <div className="px-2.5 py-2 border-b border-zinc-800/60 mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Select LLM Engine
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Multi-Model
                    </span>
                  </div>

                  <div className="space-y-1">
                    {AVAILABLE_MODELS.map((model) => {
                      const isSelected = selectedModel === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model.id);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('deployhub_selected_model', model.id);
                            }
                            setIsModelDropdownOpen(false);
                            toast.success(`Model switched to ${model.name}`);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-cyan-950/40 border border-cyan-500/30 text-white'
                              : 'hover:bg-zinc-800/60 border border-transparent text-zinc-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-500">
                                <Cpu className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-semibold font-mono text-zinc-100 truncate">
                                {model.name}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded border font-medium uppercase shrink-0 ${model.badgeColor}`}
                              >
                                {model.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 line-clamp-1 leading-snug">
                              {model.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors shadow-sm"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">New Session</span>
            </button>
          </div>
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
          {/* Selected Entities Context Row (Clean Minimal Tags) */}
          {selectedEntities.length > 0 && (
            <div className="mb-2 max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto flex-nowrap py-0.5 scrollbar-thin scrollbar-thumb-zinc-800">
              <span className="text-[11px] font-medium text-zinc-400 shrink-0 mr-1">
                Context ({selectedEntities.length}):
              </span>
              {selectedEntities.map((entity) => (
                <div
                  key={entity.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-200 shrink-0"
                >
                  {entity.type === "project" ? (
                    <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                  <span className="truncate max-w-[140px]">{entity.title}</span>
                  {entity.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                      {entity.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedEntities((prev) => prev.filter((e) => e.id !== entity.id))}
                    className="ml-0.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSelectedEntities([])}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline whitespace-nowrap shrink-0 px-1 cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center max-w-3xl mx-auto w-full gap-2.5"
          >
            {/* Rocket Action Button (Click to activate/deactivate automation mode) */}
            <button
              type="button"
              ref={rocketButtonRef}
              onClick={handleRocketLaunch}
              disabled={isRocketLaunching}
              aria-label={isAutomationMode ? "Exit Automation Mode" : "Enable Automation Mode"}
              className={`relative grid h-10 w-10 place-items-center rounded-full border transition-all duration-150 group shrink-0 disabled:opacity-45 disabled:pointer-events-none active:scale-95 cursor-pointer ${
                isAutomationMode
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-400 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title={isAutomationMode ? "Click to exit automation mode" : "Enable automation mode"}
            >
              <Rocket className={`w-4 h-4 transition-transform duration-150 ${isAutomationMode ? 'text-cyan-300 -translate-y-0.5' : 'group-hover:-translate-y-0.5'}`} />
            </button>

            {/* Input Wrapper */}
            <div
              ref={inputWrapperRef}
              className={`relative flex-1 flex items-center transition-transform ${
                isInputShaking ? 'animate-input-shake' : ''
              }`}
            >
              {/* (+) Context Modal Trigger Inside Input (Left Side) */}
              {isAutomationMode && (
                <button
                  type="button"
                  onClick={() => setIsContextModalOpen(true)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all active:scale-95 cursor-pointer"
                  title="Select context"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}

              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={
                  isAutomationMode
                    ? selectedEntities.length > 0
                      ? `Instruct AI on ${selectedEntities.map(e => e.title).join(', ')}...`
                      : "Click (+) to select projects & employees..."
                    : activeSessionId
                    ? "Message DeployHub AI..."
                    : "Click '+ New Chat' or type here to start..."
                }
                disabled={isLoading}
                className={`w-full bg-zinc-900 border ${
                  isAutomationMode
                    ? 'border-cyan-500/40 focus:border-cyan-500/80'
                    : 'border-zinc-800 focus:border-zinc-700'
                } rounded-full ${
                  isAutomationMode ? 'pl-10 pr-12' : 'px-5 pr-12'
                } py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all disabled:opacity-50`}
              />

              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="absolute right-2 p-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold transition-all disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Send className="w-4 h-4 text-black" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Automation Context Selection Modal */}
      <AutomationSelectionModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        selectedEntities={selectedEntities}
        onConfirmSelection={(selected) => {
          setSelectedEntities(selected);
          if (selected.length > 0) {
            toast.success(`Attached ${selected.length} context items to chat`);
          }
        }}
      />

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
