"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Database, Cpu, Zap, RefreshCw, Command, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getApiUrl } from '@/config/api';
import { toast } from 'sonner';
import { ToolStepLoader, ToolStep } from './ToolStepLoader';
import { EmployeeCardsWidget, DeploymentCardsWidget, ContainerHealthWidget } from './RichDataWidgets';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  toolSteps?: ToolStep[];
  structuredData?: {
    employees?: any[];
    deployments?: any[];
    containers?: any[];
  };
  isThinking?: boolean;
  isStreaming?: boolean;
}

const PROMPT_PRESETS = [
  "Tell me total employees of our organization",
  "Give me total deployments by user",
  "Check Docker container health",
  "Search vector build logs for errors",
];

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 **Welcome to DeployHub AI Command Center**\n\nI am your Cloud Infrastructure & DevOps Assistant powered by **Groq (`gpt-oss-20b`)**, **Hugging Face Embeddings**, and **Qdrant Vector Database**.\n\nAsk me anything about organization employees, project deployments, Docker container health, or search through vector build logs!",
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

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || inputPrompt).trim();
    if (!query || isLoading) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication required. Please log in.');
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
      structuredData: {},
      isThinking: false,
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
        body: JSON.stringify({ prompt: query }),
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
                const currentData = msg.structuredData ? { ...msg.structuredData } : {};

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
                  return { ...msg, toolSteps: currentSteps };
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

                  // Parse structured widget payload if returned from tool
                  if (data.toolName === 'get_organization_employees' && data.resultSummary) {
                    // Refetch from tool response if embedded
                  }

                  return { ...msg, toolSteps: currentSteps, structuredData: currentData };
                }

                if (eventName === 'thinking') {
                  return { ...msg, isThinking: true };
                }

                if (eventName === 'token') {
                  const appendedText = msg.text + (typeof data === 'string' ? data : JSON.stringify(data));
                  
                  // Extract dynamic JSON or markdown widgets if detected in stream
                  let parsedEmployees = currentData.employees;
                  let parsedDeployments = currentData.deployments;
                  let parsedContainers = currentData.containers;

                  return {
                    ...msg,
                    text: appendedText,
                    structuredData: {
                      employees: parsedEmployees,
                      deployments: parsedDeployments,
                      containers: parsedContainers,
                    },
                    isThinking: false,
                  };
                }

                if (eventName === 'done') {
                  return { ...msg, isStreaming: false, isThinking: false };
                }

                return msg;
              })
            );
          } catch (err) {
            console.error('Error parsing SSE event data:', err);
          }
        }
      }
    } catch (error: any) {
      console.error('AI Stream Error:', error);
      toast.error('Failed to communicate with AI Agent');
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                text: '❌ **Error:** Unable to process query. Please check server logs and environment configuration.',
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
    <div className="w-full flex flex-col h-[calc(100vh-5.5rem)] bg-[#09090b] text-zinc-100 rounded-xl border border-zinc-800/80 shadow-2xl overflow-hidden font-sans">
      {/* Top Header Status Bar */}
      <div className="px-6 py-3.5 border-b border-zinc-800/80 bg-[#111115]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
            <Sparkles className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              DeployHub AI Command Center
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Agent Online
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">RAG Vector Intelligence & Real-time DevOps Automation</p>
          </div>
        </div>

        {/* Engine Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Database className="w-3 h-3 text-zinc-400" />
            <span>Qdrant DB</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <Cpu className="w-3 h-3 text-zinc-400" />
            <span>Groq (gpt-oss-20b)</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
            <Zap className="w-3 h-3 text-zinc-400" />
            <span>HF Embeddings</span>
          </div>
        </div>
      </div>

      {/* Chat Canvas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3.5 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            } animate-in fade-in duration-200`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                msg.sender === 'user'
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-indigo-950/60 border-indigo-500/30 text-indigo-300'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Content Container */}
            <div
              className={`max-w-3xl rounded-xl p-4 border text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tr-none'
                  : 'bg-[#121215] border-zinc-800/80 text-zinc-200 rounded-tl-none shadow-sm'
              }`}
            >
              {/* Tool Execution Step Accordion */}
              {msg.toolSteps && msg.toolSteps.length > 0 && (
                <ToolStepLoader steps={msg.toolSteps} isThinking={msg.isThinking} />
              )}

              {/* Rich Data Components */}
              {msg.structuredData?.employees && (
                <EmployeeCardsWidget employees={msg.structuredData.employees} />
              )}
              {msg.structuredData?.deployments && (
                <DeploymentCardsWidget deployments={msg.structuredData.deployments} />
              )}
              {msg.structuredData?.containers && (
                <ContainerHealthWidget containers={msg.structuredData.containers} />
              )}

              {/* Parsed Markdown Output */}
              {msg.text ? (
                <div className="prose prose-invert prose-zinc max-w-none text-xs sm:text-sm leading-relaxed font-sans">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
                          <table className="w-full text-left border-collapse text-xs" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300 font-semibold" {...props} />,
                      th: ({ node, ...props }) => <th className="p-2.5 font-semibold text-zinc-300" {...props} />,
                      td: ({ node, ...props }) => <td className="p-2.5 border-t border-zinc-800/60 text-zinc-300" {...props} />,
                      code: ({ node, className, children, ...props }) => (
                        <code className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-200 font-mono text-[11px]" {...props}>
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.isThinking && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                    <span>Processing response...</span>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar & Presets */}
      <div className="p-4 border-t border-zinc-800/80 bg-[#111115]/90 backdrop-blur-md space-y-3">
        {/* Preset Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Command className="w-3 h-3 text-zinc-400" /> Suggestions:
          </span>
          {PROMPT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 transition-all shrink-0 disabled:opacity-50 flex items-center gap-1 font-sans"
            >
              <span>{preset}</span>
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask DeployHub AI (e.g. 'tell me total employees of our organization')..."
            disabled={isLoading}
            className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 rounded-lg px-4 py-3 pr-12 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 p-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 font-semibold transition-all disabled:opacity-30 disabled:bg-zinc-800 disabled:text-zinc-600"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
