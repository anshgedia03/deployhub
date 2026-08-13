"use client";

import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0 && !isThinking) return null;

  const activeStep = steps.find((s) => s.status === 'running');
  const completedCount = steps.filter((s) => s.status === 'completed').length;

  return (
    <div className="my-2.5 rounded-lg border border-zinc-800/80 bg-[#141418]/60 backdrop-blur-md overflow-hidden text-xs transition-all">
      {/* Collapsible Header Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2 flex items-center justify-between gap-2 hover:bg-zinc-800/40 transition-colors text-zinc-300 font-mono"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-200">
            {activeStep
              ? activeStep.stepTitle
              : isThinking
              ? 'Finalizing response...'
              : `Executed ${completedCount} tool${completedCount === 1 ? '' : 's'}`}
          </span>
          {activeStep && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Running
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300">
          <span>{steps.length} step{steps.length === 1 ? '' : 's'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Step Timeline */}
      {isExpanded && (
        <div className="px-3.5 py-2.5 border-t border-zinc-800/60 bg-[#0f0f12]/40 space-y-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-2 min-w-0">
                {step.status === 'running' ? (
                  <Loader2 className="w-3 h-3 text-zinc-400 animate-spin shrink-0" />
                ) : step.status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                <span className={step.status === 'running' ? 'text-zinc-200 animate-pulse' : 'text-zinc-400'}>
                  {step.stepTitle}
                </span>
              </div>

              {step.resultSummary && (
                <span className="text-[10px] text-zinc-500 font-sans truncate max-w-[200px]">
                  {step.resultSummary}
                </span>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 animate-pulse pt-1">
              <Loader2 className="w-3 h-3 animate-spin text-zinc-400 shrink-0" />
              <span>Synthesizing final response...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
