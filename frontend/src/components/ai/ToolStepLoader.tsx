"use client";

import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Users, Rocket, Activity, Database, Sparkles } from 'lucide-react';

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

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case 'get_organization_employees':
      return <Users className="w-4 h-4 text-cyan-400" />;
    case 'get_user_deployments':
      return <Rocket className="w-4 h-4 text-purple-400" />;
    case 'get_container_health':
      return <Activity className="w-4 h-4 text-emerald-400" />;
    case 'search_vector_knowledge':
      return <Database className="w-4 h-4 text-blue-400" />;
    default:
      return <Sparkles className="w-4 h-4 text-cyan-400" />;
  }
};

export const ToolStepLoader: React.FC<ToolStepLoaderProps> = ({ steps, isThinking }) => {
  if (steps.length === 0 && !isThinking) return null;

  return (
    <div className="my-3 p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-400">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>Agent Tool Chain Execution</span>
      </div>

      <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-cyan-950/60">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 relative z-10">
            {/* Status node */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full border border-cyan-500/30 bg-[#0c0d12] shadow-sm shrink-0">
              {step.status === 'running' ? (
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              ) : step.status === 'completed' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                {getToolIcon(step.toolName)}
                <span className={`text-xs font-medium ${step.status === 'running' ? 'text-cyan-300 animate-pulse' : 'text-zinc-200'}`}>
                  {step.stepTitle}
                </span>
                {step.status === 'running' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Executing...
                  </span>
                )}
              </div>
              {step.resultSummary && (
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                  {step.resultSummary}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Thinking Step */}
        {isThinking && (
          <div className="flex items-start gap-3 relative z-10 animate-in fade-in">
            <div className="flex items-center justify-center w-7 h-7 rounded-full border border-purple-500/30 bg-purple-950/20 shadow-sm shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            </div>
            <div className="flex-1 pt-1">
              <span className="text-xs font-medium text-purple-300 animate-pulse">
                Finalizing response...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
