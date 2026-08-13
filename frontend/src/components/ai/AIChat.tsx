"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Database, Cpu, Zap, Terminal, RefreshCw, Command, Layers } from 'lucide-react';
import { getApiUrl } from '@/config/api';
import { toast } from 'sonner';
import { ToolStepLoader, ToolStep } from './ToolStepLoader';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  toolSteps?: ToolStep[];
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
      text: "👋 **Welcome to DeployHub AI Command Center!**\n\nI am your Cloud Infrastructure & DevOps Assistant powered by **Groq (`gpt-oss-20b`)**, **Hugging Face Embeddings**, and **Qdrant Vector Database**.\n\nAsk me anything about your organization employees, project deployments, live Docker container health, or search through vector build logs!",
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
        buffer = parts.pop() || ''; // Keep trailing incomplete snippet

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
                  return { ...msg, toolSteps: currentSteps };
                }

                if (eventName === 'thinking') {
                  return { ...msg, isThinking: true };
                }

                if (eventName === 'token') {
                  return {
                    ...msg,
                    text: msg.text + (typeof data === 'string' ? data : JSON.stringify(data)),
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
                text: '❌ **Error:** Unable to process query. Please check server logs and configuration.',
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
    <div className="w-full flex flex-col h-[calc(100vh-6rem)] bg-[#07070a] rounded-2xl border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.05)] overflow-hidden relative font-sans">
      {/* Background Cyber Mesh & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Status Bar */}
      <div className="px-6 py-4 border-b border-cyan-500/20 bg-black/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
              DeployHub AI Command Center
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest font-mono">
                Agent Active
              </span>
            </h2>
            <p className="text-xs text-zinc-400">RAG Vector Intelligence & Real-time DevOps Automation</p>
          </div>
        </div>

        {/* Engine Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Database className="w-3.5 h-3.5" />
            <span>Qdrant Vector DB</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>Groq (gpt-oss-20b)</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>HF Embeddings</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scrollbar-thin scrollbar-thumb-cyan-900/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            } animate-in fade-in duration-300`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-3xl rounded-2xl p-5 border backdrop-blur-md ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/30 border-cyan-500/30 text-zinc-100 rounded-tr-none shadow-[0_0_20px_rgba(6,182,212,0.05)]'
                  : 'bg-[#0e0f17] border-purple-500/20 text-zinc-200 rounded-tl-none shadow-[0_0_20px_rgba(168,85,247,0.05)]'
              }`}
            >
              {/* Tool Execution Loader Pipeline */}
              {msg.toolSteps && msg.toolSteps.length > 0 && (
                <ToolStepLoader steps={msg.toolSteps} isThinking={msg.isThinking} />
              )}

              {/* Message Content */}
              {msg.text ? (
                <div className="prose prose-invert prose-cyan text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>
              ) : (
                msg.isThinking && (
                  <div className="flex items-center gap-2 text-xs text-purple-400 font-mono animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing response...</span>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Prompt Chips & Input Bar */}
      <div className="p-4 border-t border-cyan-500/20 bg-black/80 backdrop-blur-xl z-10 space-y-3">
        {/* Preset Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Command className="w-3 h-3 text-cyan-400" /> Prompts:
          </span>
          {PROMPT_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 hover:text-cyan-100 transition-all shrink-0 disabled:opacity-50"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Text Area & Action Button */}
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
            className="w-full bg-[#0c0d14] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-4 py-3.5 pr-14 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 p-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all disabled:opacity-40 disabled:shadow-none"
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
  );
}
