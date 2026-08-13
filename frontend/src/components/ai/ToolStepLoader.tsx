"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

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

  const runningStep = steps.find((s) => s.status === 'running');
  const lastStep = steps[steps.length - 1];

  const currentLabel = runningStep
    ? runningStep.stepTitle
    : isThinking
    ? 'Thinking...'
    : lastStep
    ? lastStep.stepTitle
    : 'Processing...';

  // Only display while loading/thinking or executing
  if (!runningStep && !isThinking) return null;

  return (
    <div className="flex items-center gap-2 py-1 text-xs text-zinc-400 font-mono animate-in fade-in">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
      <span>{currentLabel}</span>
    </div>
  );
};
