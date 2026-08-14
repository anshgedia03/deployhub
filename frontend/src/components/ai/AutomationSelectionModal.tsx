"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Check, FolderGit2, Users, Shield, Globe, Terminal, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";

export interface SelectedEntity {
  id: string;
  type: "project" | "employee";
  title: string;
  subtitle?: string;
  status?: string;
  badge?: string;
  meta?: any;
}

interface AutomationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEntities: SelectedEntity[];
  onConfirmSelection: (selected: SelectedEntity[]) => void;
}

export function AutomationSelectionModal({
  isOpen,
  onClose,
  selectedEntities,
  onConfirmSelection,
}: AutomationSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "employees">("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localSelection, setLocalSelection] = useState<SelectedEntity[]>(selectedEntities);

  useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedEntities);
      fetchData();
    }
  }, [isOpen, selectedEntities]);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch current user profile
      const userRes = await fetch(getApiUrl("/auth/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      const user = userData.user || null;
      setCurrentUser(user);

      // 2. Fetch projects (automatically tenant/role scoped)
      const projRes = await fetch(getApiUrl("/projects"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : []);
      }

      // 3. Fetch employees if user is organization
      if (user?.accountType === "organization") {
        const empRes = await fetch(getApiUrl("/employees"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployees(empData.employees || []);
        }
      }
    } catch (err) {
      console.error("Failed to load context for modal:", err);
      toast.error("Could not load projects or employees");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isOrg = currentUser?.accountType === "organization";

  // Toggle selection for a project
  const handleToggleProject = (project: any) => {
    const entityId = `project-${project._id || project.deploymentId}`;
    const exists = localSelection.some((e) => e.id === entityId);
    if (exists) {
      setLocalSelection((prev) => prev.filter((e) => e.id !== entityId));
    } else {
      const newEntity: SelectedEntity = {
        id: entityId,
        type: "project",
        title: project.projectName,
        subtitle: project.branch ? `Branch: ${project.branch}` : (project.port ? `Port: ${project.port}` : undefined),
        status: project.status,
        badge: project.status?.toUpperCase(),
        meta: project,
      };
      setLocalSelection((prev) => [...prev, newEntity]);
    }
  };

  // Toggle selection for an employee
  const handleToggleEmployee = (employee: any) => {
    const entityId = `employee-${employee._id || employee.username}`;
    const exists = localSelection.some((e) => e.id === entityId);
    if (exists) {
      setLocalSelection((prev) => prev.filter((e) => e.id !== entityId));
    } else {
      const newEntity: SelectedEntity = {
        id: entityId,
        type: "employee",
        title: employee.username,
        subtitle: employee.email,
        status: employee.role || "Member",
        badge: (employee.accessLevel || "limited").toUpperCase(),
        meta: employee,
      };
      setLocalSelection((prev) => [...prev, newEntity]);
    }
  };

  // Filtered lists
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.projectName && p.projectName.toLowerCase().includes(q)) ||
      (p.branch && p.branch.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q))
    );
  });

  const filteredEmployees = employees.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.username && e.username.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q)) ||
      (e.role && e.role.toLowerCase().includes(q))
    );
  });

  const handleApply = () => {
    onConfirmSelection(localSelection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0e0e12] border border-cyan-500/25 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.18)] flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#121216]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 flex items-center gap-2">
                Automation Context Selector
              </h3>
              <p className="text-xs text-zinc-400">
                Select projects or employees to attach context for your AI automation tasks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab & Search Bar */}
        <div className="px-6 py-3 border-b border-zinc-800/60 bg-[#0f0f13] flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "projects"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                {projects.length}
              </span>
            </button>

            {isOrg && (
              <button
                type="button"
                onClick={() => setActiveTab("employees")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "employees"
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/35 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Employees</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {employees.length}
                </span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-zinc-500 animate-pulse">
              Loading {activeTab}...
            </div>
          ) : activeTab === "projects" ? (
            filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                {searchQuery ? "No matching projects found." : "No projects deployed yet."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProjects.map((project) => {
                  const entityId = `project-${project._id || project.deploymentId}`;
                  const isSelected = localSelection.some((e) => e.id === entityId);
                  const st = (project.status || "STOPPED").toUpperCase();

                  return (
                    <div
                      key={project._id || project.deploymentId}
                      onClick={() => handleToggleProject(project)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.16)]"
                          : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800 text-zinc-400"}`}>
                            <FolderGit2 className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-cyan-200 transition-colors">
                              {project.projectName}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">
                              {project.branch ? `branch: ${project.branch}` : (project.gitUrl || "Standalone")}
                            </p>
                          </div>
                        </div>

                        {/* Selection Checkbox */}
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                          isSelected ? "bg-cyan-500 text-black font-bold" : "border border-zinc-700 group-hover:border-zinc-500"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          st === "RUNNING"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                            : st === "FAILED"
                            ? "bg-red-950/80 text-red-400 border border-red-800/50"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          ● {st}
                        </span>

                        {project.port && (
                          <span className="text-zinc-400 font-mono">
                            port: {project.port}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                {searchQuery ? "No matching employees found." : "No employees in organization."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredEmployees.map((emp) => {
                  const entityId = `employee-${emp._id || emp.username}`;
                  const isSelected = localSelection.some((e) => e.id === entityId);
                  const isFull = emp.accessLevel === "full";

                  return (
                    <div
                      key={emp._id || emp.username}
                      onClick={() => handleToggleEmployee(emp)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? "bg-blue-950/30 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.16)]"
                          : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800 text-zinc-400"}`}>
                            <Users className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-blue-200 transition-colors">
                              {emp.username}
                            </h4>
                            <p className="text-[10px] text-zinc-500 truncate">
                              {emp.email}
                            </p>
                          </div>
                        </div>

                        {/* Selection Checkbox */}
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                          isSelected ? "bg-blue-500 text-white font-bold" : "border border-zinc-700 group-hover:border-zinc-500"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-[10px]">
                        <span className="text-zinc-400 font-medium">
                          {emp.role || "Member"}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          isFull
                            ? "bg-purple-950/80 text-purple-300 border border-purple-800/50"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {isFull ? "Full Access" : "Limited Access"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-[#121216] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              <strong className="text-cyan-300 font-semibold">{localSelection.length}</strong> selected
            </span>
            {localSelection.length > 0 && (
              <button
                type="button"
                onClick={() => setLocalSelection([])}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer active:scale-95"
            >
              Apply Context ({localSelection.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
