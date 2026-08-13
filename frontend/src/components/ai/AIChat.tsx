"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
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

/**
 * Format markdown symbols out into clean, readable text
 */
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^###\s+/gm, '')
    .replace(/^##\s+/gm, '')
    .replace(/^#\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am DeployHub AI Assistant.\n\nAsk me anything about your organization employees, deployments, live container health, or deployment history.",
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
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)] bg-[#09090b] text-zinc-100 font-sans relative rounded-xl border border-zinc-800/80 shadow-xl overflow-hidden">
      {/* ChatGPT Style Conversation Stream */}
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
            <div className="max-w-2xl space-y-1">
              {/* Minimalist Loader */}
              {msg.toolSteps && msg.toolSteps.length > 0 && (
                <ToolStepLoader steps={msg.toolSteps} isThinking={msg.isThinking} />
              )}

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                }`}
              >
                {cleanText(msg.text)}
              </div>
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

      {/* ChatGPT Style Minimalist Input Bar */}
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
            placeholder="Message DeployHub AI..."
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
  );
}
