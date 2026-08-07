"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Users, Loader2, Rocket, Search } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Employee {
  _id: string;
  username: string;
  email: string;
}

interface Project {
  deploymentId: string;
  projectName: string;
  accessControl: { employeeId: string; accessLevel: 'full' | 'limited' }[];
}

export function AccessControl() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const [empRes, projRes] = await Promise.all([
        fetch(getApiUrl("/employees"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl("/projects"), { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (empRes.ok && projRes.ok) {
        const empData = await empRes.json();
        const projData = await projRes.json();
        
        setEmployees(empData.employees || []);
        setProjects(projData || []);
        if (projData && projData.length > 0) {
          setSelectedProjectId(projData[0].deploymentId);
        }
      } else {
        toast.error("Failed to load access data");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessChange = async (employeeId: string, newAccessLevel: 'full' | 'limited' | 'none') => {
    if (!selectedProjectId) return;
    
    setUpdatingId(employeeId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/projects/${selectedProjectId}/access`), {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ employeeId, accessLevel: newAccessLevel }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Access updated successfully`);
        // Update local state
        setProjects(prevProjects => 
          prevProjects.map(p => {
            if (p.deploymentId === selectedProjectId) {
              return { ...p, accessControl: data.accessControl || [] };
            }
            return p;
          })
        );
      } else {
        toast.error(data.error || "Failed to update access");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedProject = projects.find(p => p.deploymentId === selectedProjectId);
  
  const getEmployeeAccessLevel = (employeeId: string) => {
    if (!selectedProject || !selectedProject.accessControl) return 'none';
    const access = selectedProject.accessControl.find(ac => ac.employeeId === employeeId);
    return access ? access.accessLevel : 'none';
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Full Access Card */}
        <div className="flex-1 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-all"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-1">Full Access</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Employees with full access to a project can perform all destructive actions including redeploying, modifying environment variables, and deleting the project.
              </p>
            </div>
          </div>
        </div>

        {/* Limited Access Card */}
        <div className="flex-1 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/20 blur-2xl rounded-full group-hover:bg-amber-500/30 transition-all"></div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-100 mb-1">Limited Access</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Employees with limited access to a project can only perform operational tasks such as opening the app, starting/stopping the server, and viewing logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-[#111114] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Project-Level Security
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Select a project to manage employee permissions for it.</p>
          </div>
          
          <div className="w-full md:w-auto relative">
            <Rocket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={isLoading || projects.length === 0}
              className="w-full md:w-64 appearance-none bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-10 py-2 text-sm font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {projects.length === 0 ? (
                <option value="">No projects available</option>
              ) : (
                projects.map(p => (
                  <option key={p.deploymentId} value={p.deploymentId}>
                    {p.projectName}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 animate-pulse text-zinc-500 text-sm">
            Loading access data...
          </div>
        ) : !selectedProject ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20">
            <Rocket className="w-10 h-10 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-300 mb-1">No Projects Found</h3>
            <p className="text-zinc-500 text-center text-sm">
              Deploy a project first to manage access control.
            </p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20">
            <Users className="w-10 h-10 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-300 mb-1">No Employees Found</h3>
            <p className="text-zinc-500 text-center text-sm">
              You haven't added any employees to your organization yet.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50 bg-zinc-950/30">
                <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10 w-[35%]">Employee Name</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10 w-[35%]">Email ID</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10 w-[30%]">Access Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const currentAccess = getEmployeeAccessLevel(employee._id);
                return (
                  <TableRow key={employee._id} className="border-zinc-800/80 hover:bg-zinc-900/30">
                    <TableCell className="font-medium text-zinc-100 py-4">
                      {employee.username}
                    </TableCell>
                    <TableCell className="text-zinc-400 font-sans text-sm py-4">
                      {employee.email}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="relative inline-block w-40">
                        <select
                          value={currentAccess}
                          onChange={(e) => handleAccessChange(employee._id, e.target.value as 'full' | 'limited' | 'none')}
                          disabled={updatingId === employee._id}
                          className={`w-full appearance-none bg-zinc-900 border ${
                            currentAccess === 'full' 
                              ? 'border-blue-500/30 text-blue-400' 
                              : currentAccess === 'limited' 
                                ? 'border-amber-500/30 text-amber-400'
                                : 'border-zinc-700 text-zinc-400'
                          } rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <option value="none">No Access</option>
                          <option value="limited">Limited Access</option>
                          <option value="full">Full Access</option>
                        </select>
                        {updatingId === employee._id ? (
                          <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin pointer-events-none" />
                        ) : (
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
