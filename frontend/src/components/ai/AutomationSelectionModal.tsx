"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Check, FolderGit2, Users } from "lucide-react";
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
      const userRes = await fetch(getApiUrl("/auth/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      const user = userData.user || null;
      setCurrentUser(user);

      const projRes = await fetch(getApiUrl("/projects"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : []);
      }

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
      console.error("Failed to load context data:", err);
      toast.error("Failed to load projects or employees");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isOrg = currentUser?.accountType === "organization";

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
        subtitle: project.branch ? `branch: ${project.branch}` : (project.port ? `port: ${project.port}` : undefined),
        status: project.status,
        badge: project.status?.toUpperCase(),
        meta: project,
      };
      setLocalSelection((prev) => [...prev, newEntity]);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-[#0f0f12] border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#121216]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Select Context
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choose projects or employees to focus AI actions and queries
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-zinc-800 bg-[#0f0f12] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "projects"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950 text-zinc-400">
                {projects.length}
              </span>
            </button>

            {isOrg && (
              <button
                type="button"
                onClick={() => setActiveTab("employees")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === "employees"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Employees</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-950 text-zinc-400">
                  {employees.length}
                </span>
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-zinc-800">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Loading {activeTab}...
            </div>
          ) : activeTab === "projects" ? (
            filteredProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                {searchQuery ? "No matching projects." : "No projects deployed yet."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredProjects.map((project) => {
                  const entityId = `project-${project._id || project.deploymentId}`;
                  const isSelected = localSelection.some((e) => e.id === entityId);
                  const st = (project.status || "STOPPED").toUpperCase();

                  return (
                    <div
                      key={project._id || project.deploymentId}
                      onClick={() => handleToggleProject(project)}
                      className={`relative p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-zinc-900 border-cyan-500/50 text-white"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded ${isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-400"}`}>
                            <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200 truncate">
                              {project.projectName}
                            </h4>
                            <p className="text-[10px] text-zinc-500 truncate">
                              {project.branch ? `branch: ${project.branch}` : (project.gitUrl || "Standalone")}
                            </p>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                          isSelected ? "bg-cyan-500 text-black font-bold" : "border border-zinc-700"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded font-mono ${
                          st === "RUNNING"
                            ? "bg-emerald-950/80 text-emerald-400"
                            : st === "FAILED"
                            ? "bg-red-950/80 text-red-400"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {st}
                        </span>

                        {project.port && (
                          <span className="text-zinc-500 font-mono">
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
                {searchQuery ? "No matching employees." : "No employees found."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredEmployees.map((emp) => {
                  const entityId = `employee-${emp._id || emp.username}`;
                  const isSelected = localSelection.some((e) => e.id === entityId);
                  const isFull = emp.accessLevel === "full";

                  return (
                    <div
                      key={emp._id || emp.username}
                      onClick={() => handleToggleEmployee(emp)}
                      className={`relative p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-zinc-900 border-cyan-500/50 text-white"
                          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded ${isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-zinc-800 text-zinc-400"}`}>
                            <Users className="w-3.5 h-3.5 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200 truncate">
                              {emp.username}
                            </h4>
                            <p className="text-[10px] text-zinc-500 truncate">
                              {emp.email}
                            </p>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                          isSelected ? "bg-cyan-500 text-black font-bold" : "border border-zinc-700"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px]">
                        <span className="text-zinc-400 font-medium">
                          {emp.role || "Member"}
                        </span>

                        <span className="text-zinc-500">
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
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#121216] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>{localSelection.length} selected</span>
            {localSelection.length > 0 && (
              <button
                type="button"
                onClick={() => setLocalSelection([])}
                className="text-zinc-500 hover:text-zinc-300 underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
