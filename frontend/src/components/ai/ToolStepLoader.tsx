"use client";

import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

export interface ToolStep {
  toolName: string;
  stepTitle: string;
  status: 'running' | 'completed' | 'error';
  resultSummary?: string;
}

interface ToolStepLoaderProps {
  steps: ToolStep[];
  isThinking?: boolean;
  isStreaming?: boolean;
}

export const ToolStepLoader: React.FC<ToolStepLoaderProps> = ({ steps, isThinking, isStreaming }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If no steps and not thinking, nothing to show
  if (steps.length === 0 && !isThinking) return null;

  // 1. Initial Thinking state (no tools yet, streaming)
  if (steps.length === 0 && (isThinking || isStreaming)) {
    return (
      <div className="py-1 flex items-center gap-2 text-xs text-zinc-400 font-mono animate-in fade-in">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
        <span>Thinking...</span>
      </div>
    );
  }

  // 2. Multi-tool completed state (Streaming finished, multiple tools were used)
  const isMultiToolComplete = !isStreaming && steps.length > 1;

  if (isMultiToolComplete) {
    return (
      <div className="py-1 space-y-1 text-xs text-zinc-400 font-mono animate-in fade-in">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer hover:text-zinc-300 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Used {steps.length} tools</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          )}
        </button>

        {isExpanded && (
          <div className="ml-5 mt-1 space-y-1">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-400 opacity-90">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{step.stepTitle}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Single tool completed state (Streaming finished, exactly 1 tool was used)
  if (!isStreaming && steps.length === 1) {
    const step = steps[0];
    return (
      <div className="py-1 flex items-center gap-2 text-xs text-zinc-400 font-mono animate-in fade-in">
        {step.status === 'error' ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}
        <span>Used tool: {step.stepTitle}</span>
      </div>
    );
  }

  // 4. Actively Streaming / Processing State (Tool 1 -> Tool 2 -> Finalizing)
  return (
    <div className="py-1 space-y-1 text-xs text-zinc-400 font-mono animate-in fade-in">
      {steps.map((step, idx) => {
        const isLatestStep = idx === steps.length - 1;
        const isActivelySpinning = isLatestStep && isStreaming;

        return (
          <div key={idx} className="flex items-center gap-2">
            {isActivelySpinning || step.status === 'running' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300 shrink-0" />
            ) : step.status === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className={isActivelySpinning ? 'text-zinc-200 animate-pulse' : 'text-zinc-400'}>
              {step.stepTitle}
            </span>
          </div>
        );
      })}
    </div>
  );
};
