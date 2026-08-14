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

  if (steps.length === 0 && !isThinking) return null;

  // If streaming is done and we have multiple tools, show the accordion view
  const isMultiToolComplete = !isStreaming && steps.length > 1;

  return (
    <div className="py-1 space-y-1 text-xs text-zinc-400 font-mono animate-in fade-in">
      {isMultiToolComplete && (
        <div 
          className="flex items-center gap-2 cursor-pointer hover:text-zinc-300 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Used {steps.length} tools</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          )}
        </div>
      )}

      {(!isMultiToolComplete || isExpanded) && steps.map((step, idx) => {
        const showAsRunning = step.status === 'running';
        const showAsError = step.status === 'error';
        const showAsCompleted = !showAsRunning && !showAsError;

        return (
          <div key={idx} className={`flex items-center gap-2 ${isMultiToolComplete ? 'ml-5 mt-1 opacity-80' : ''}`}>
            {showAsRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
            ) : showAsCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span className={showAsRunning ? 'text-zinc-200 animate-pulse' : 'text-zinc-400'}>
              {showAsCompleted ? `Used tool: ${step.stepTitle}` : step.stepTitle}
            </span>
          </div>
        );
      })}

      {isThinking && steps.length === 0 && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
};
