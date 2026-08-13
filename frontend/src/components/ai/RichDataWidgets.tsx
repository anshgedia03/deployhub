"use client";

import React from 'react';
import { User, Mail, Shield, Rocket, ExternalLink, Activity, Server, CheckCircle2, Clock, Globe } from 'lucide-react';

interface Employee {
  id?: string;
  username: string;
  email: string;
  accountType?: string;
  role?: string;
  joinedAt?: string;
}

interface Deployment {
  deploymentId?: string;
  projectName: string;
  status: string;
  port?: number;
  publicUrl?: string;
  gitUrl?: string;
  branch?: string;
  createdAt?: string;
}

interface Container {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  ports: any[];
}

export const EmployeeCardsWidget: React.FC<{ employees: Employee[] }> = ({ employees }) => {
  if (!employees || employees.length === 0) return null;

  return (
    <div className="my-3 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
        <User className="w-3.5 h-3.5 text-zinc-300" />
        <span>Organization Roster ({employees.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {employees.map((emp, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200 text-xs font-bold shrink-0">
              {emp.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-zinc-100 truncate">{emp.username}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  {emp.role || emp.accountType || 'Member'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
                <Mail className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="truncate">{emp.email}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DeploymentCardsWidget: React.FC<{ deployments: Deployment[] }> = ({ deployments }) => {
  if (!deployments || deployments.length === 0) return null;

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'RUNNING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          RUNNING
        </span>
      );
    }
    if (s === 'BUILDING' || s === 'CLONING' || s === 'STARTING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3 animate-spin" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
        {s}
      </span>
    );
  };

  return (
    <div className="my-3 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
        <Rocket className="w-3.5 h-3.5 text-zinc-300" />
        <span>Active Projects ({deployments.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {deployments.map((dep, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-100 min-w-0">
                <Rocket className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{dep.projectName}</span>
              </div>
              {getStatusBadge(dep.status)}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1">
                <Server className="w-3 h-3 text-zinc-500" />
                <span>Port: {dep.port || 'N/A'}</span>
              </div>

              {dep.publicUrl ? (
                <a
                  href={dep.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-sans font-medium transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  <span>Open App</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className="text-zinc-600 font-sans">No Public URL</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContainerHealthWidget: React.FC<{ containers: Container[] }> = ({ containers }) => {
  if (!containers || containers.length === 0) return null;

  return (
    <div className="my-3 space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2">
        <Activity className="w-3.5 h-3.5 text-zinc-300" />
        <span>Docker Container Telemetry ({containers.length})</span>
      </div>
      <div className="space-y-2">
        {containers.map((c, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full ${c.state === 'running' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <span className="font-mono text-zinc-200 font-medium truncate">
                {c.names[0]?.replace('/', '') || c.id}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {c.image}
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 shrink-0">
              {c.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
