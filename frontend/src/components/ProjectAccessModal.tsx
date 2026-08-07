import React, { useState, useEffect } from "react";
import { X, Shield, ShieldCheck, Users, Loader2 } from "lucide-react";
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

interface ProjectAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function ProjectAccessModal({ isOpen, onClose, projectId }: ProjectAccessModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectAccess, setProjectAccess] = useState<{ employeeId: string, accessLevel: 'full' | 'limited' }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchData();
    }
  }, [isOpen, projectId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all employees in the org
      const empRes = await fetch(getApiUrl("/employees"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empData = await empRes.json();
      
      // Fetch projects to get accessControl for the specific project
      const projRes = await fetch(getApiUrl("/projects"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const projData = await projRes.json();
      
      if (empRes.ok && projRes.ok) {
        setEmployees(empData.employees || []);
        
        const project = projData.find((p: any) => p.deploymentId === projectId);
        if (project && project.accessControl) {
          setProjectAccess(project.accessControl);
        } else {
          setProjectAccess([]);
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
    setUpdatingId(employeeId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl(`/projects/${projectId}/access`), {
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
        setProjectAccess(data.accessControl || []);
      } else {
        toast.error(data.error || "Failed to update access");
      }
    } catch (err) {
      toast.error("Failed to connect to server");
    } finally {
      setUpdatingId(null);
    }
  };

  const getEmployeeAccessLevel = (employeeId: string) => {
    const access = projectAccess.find(ac => ac.employeeId === employeeId);
    return access ? access.accessLevel : 'none';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 shrink-0">
          <div>
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Manage Project Access
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Assign roles to employees for this specific project.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 animate-pulse text-zinc-500 text-sm rounded-xl border border-zinc-800/80">
              Loading access data...
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
              <Users className="w-10 h-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-300 mb-1">No Employees Found</h3>
              <p className="text-zinc-500 text-center text-sm">
                You haven't added any employees to your organization yet.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-900/50 bg-zinc-950/50">
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10">Employee</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10">Email</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider h-10">Access Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => {
                    const currentAccess = getEmployeeAccessLevel(employee._id);
                    return (
                      <TableRow key={employee._id} className="border-zinc-800/80 hover:bg-zinc-900/30">
                        <TableCell className="font-medium text-zinc-100 py-3">
                          {employee.username}
                        </TableCell>
                        <TableCell className="text-zinc-400 font-sans text-sm py-3">
                          {employee.email}
                        </TableCell>
                        <TableCell className="py-3">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
