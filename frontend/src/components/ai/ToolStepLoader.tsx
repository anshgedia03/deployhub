"use client";

import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ToolStep {
  toolName: string;
  stepTitle: string;
  status: 'running' | 'completed' | 'error';
  resultSummary?: string;
}

interface ToolStepLoaderProps {
  steps: ToolStep[];
  isThinking?: boolean;
}

export const ToolStepLoader: React.FC<ToolStepLoaderProps> = ({ steps, isThinking }) => {
  if (steps.length === 0 && !isThinking) return null;

  return (
    <div className="py-1 space-y-1 text-xs text-zinc-400 font-mono animate-in fade-in">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {step.status === 'running' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
          ) : step.status === 'completed' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span className={step.status === 'running' ? 'text-zinc-200 animate-pulse' : 'text-zinc-400'}>
            {step.status === 'completed' ? `Used tool: ${step.stepTitle}` : step.stepTitle}
          </span>
        </div>
      ))}

      {isThinking && (
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
};
