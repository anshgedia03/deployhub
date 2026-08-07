"use client";

import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Users, Loader2 } from "lucide-react";
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
  role: string;
  accessLevel: 'full' | 'limited';
}

export function AccessControl() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/employees"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees);
      } else {
        toast.error(data.error || "Failed to fetch employees");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAccessChange = async (employeeId: string, newAccessLevel: 'full' | 'limited') => {
    setUpdatingId(employeeId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/employees/${employeeId}/access`), {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ accessLevel: newAccessLevel }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Access level updated to ${newAccessLevel === 'full' ? 'Full Access' : 'Limited Access'}`);
        setEmployees(prev => prev.map(emp => 
          emp._id === employeeId ? { ...emp, accessLevel: newAccessLevel } : emp
        ));
      } else {
        toast.error(data.error || "Failed to update access level");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setUpdatingId(null);
    }
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
                Employees with full access can perform all destructive actions including deploying, redeploying, modifying environment variables, and deleting projects.
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
                Employees with limited access can only perform operational tasks such as opening the app, starting/stopping the server, and viewing logs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-[#111114] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Access Management Table</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Control the exact permission layer for each employee in your organization.</p>
          </div>
          <Shield className="w-5 h-5 text-zinc-600" />
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 animate-pulse text-zinc-500 text-sm">
            Loading employees...
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
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10 w-[35%]">Employee Name</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10 w-[35%]">Email ID</TableHead>
                <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10 w-[30%]">Access Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
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
                        value={employee.accessLevel || 'limited'}
                        onChange={(e) => handleAccessChange(employee._id, e.target.value as 'full' | 'limited')}
                        disabled={updatingId === employee._id}
                        className={`w-full appearance-none bg-zinc-900 border ${
                          employee.accessLevel === 'full' ? 'border-blue-500/30 text-blue-400' : 'border-amber-500/30 text-amber-400'
                        } rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
