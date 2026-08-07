"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Play, Eye, EyeOff, GitBranch, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getApiUrl, getAuthHeaders } from "@/config/api";
import { toast } from "sonner";

interface Deployment {
  _id: string;
  deploymentId: string;
  projectName: string;
  gitUrl?: string;
  branch?: string;
  createdAt: string;
}

interface EnvVar {
  key: string;
  value: string;
  id: string; // for React keys
}

interface RedeploySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: Deployment | null;
}

export function RedeploySidebar({ isOpen, onClose, deployment }: RedeploySidebarProps) {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && deployment?.deploymentId) {
      fetchEnvVars(deployment.deploymentId);
    } else {
      setEnvVars([]);
      setRevealedIds(new Set());
    }
  }, [isOpen, deployment]);

  const fetchEnvVars = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/projects/${id}/env`), {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.envVars || []).map((v: any) => ({
          id: Math.random().toString(36).substring(7),
          key: v.key,
          value: v.value,
        }));
        setEnvVars(mapped);
      }
    } catch (err) {
      toast.error("Failed to fetch environment variables");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeploy = async () => {
    if (!deployment) return;
    setRedeploying(true);

    // Format back to .env string
    const envString = envVars
      .filter((v) => v.key.trim())
      .map((v) => `${v.key.trim()}=${v.value}`)
      .join("\n");

    try {
      const res = await fetch(getApiUrl(`/projects/${deployment.deploymentId}/redeploy`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ envVars: envString }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to redeploy");
      }

      toast.success("Redeployment triggered successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setRedeploying(false);
    }
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { id: Math.random().toString(36).substring(7), key: "", value: "" }]);
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(envVars.filter((v) => v.id !== id));
  };

  const updateEnvVar = (id: string, field: "key" | "value", val: string) => {
    setEnvVars(envVars.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  };

  const toggleReveal = (id: string) => {
    const next = new Set(revealedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedIds(next);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed right-0 top-0 bottom-0 z-[70] w-full max-w-lg bg-[#111114] border-l border-zinc-800 shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-500" />
            Redeploy Project
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-md hover:bg-zinc-800/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {deployment && (
            <div className="space-y-8">
              {/* Project Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Project Configuration</h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Project Name</p>
                    <p className="text-sm font-semibold text-zinc-200">{deployment.projectName || deployment.deploymentId.split('-')[0]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Git Repository</p>
                    <a 
                      href={deployment.gitUrl?.replace('.git', '')} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      {deployment.gitUrl?.replace('https://github.com/', '').replace('.git', '')}
                    </a>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Branch</p>
                      <p className="text-sm font-medium text-zinc-300">{deployment.branch || 'main'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">First Deployed</p>
                      <p className="text-sm font-medium text-zinc-300">{formatDistanceToNow(new Date(deployment.createdAt))} ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Environment Variables</h3>
                  <button 
                    onClick={addEnvVar}
                    className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Variable
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center p-8 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/20">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                  </div>
                ) : envVars.length === 0 ? (
                  <div className="text-center p-8 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/20">
                    <p className="text-sm text-zinc-500">No environment variables configured.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {envVars.map((env) => {
                      const isRevealed = revealedIds.has(env.id);
                      return (
                        <div key={env.id} className="flex gap-2 items-start">
                          <input
                            type="text"
                            placeholder="KEY"
                            value={env.key}
                            onChange={(e) => updateEnvVar(env.id, "key", e.target.value)}
                            className="w-1/3 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 font-mono"
                          />
                          <div className="relative flex-1">
                            <input
                              type={isRevealed ? "text" : "password"}
                              placeholder="VALUE"
                              value={env.value}
                              onChange={(e) => updateEnvVar(env.id, "value", e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-3 pr-10 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => toggleReveal(env.id)}
                              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                            >
                              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <button
                            onClick={() => removeEnvVar(env.id)}
                            className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-zinc-800 bg-[#0a0a0c]">
          <button
            onClick={handleRedeploy}
            disabled={redeploying || loading}
            className="w-full flex justify-center items-center gap-2 py-3 bg-zinc-100 hover:bg-white text-black font-semibold rounded-lg transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {redeploying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redeploying...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black" />
                Trigger Redeploy
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
