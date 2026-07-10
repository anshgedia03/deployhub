"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, Edit, Users, LayoutGrid, List } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";
import { AddEmployeeModal } from "./AddEmployeeModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function EmployeesTable() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (emp.username && emp.username.toLowerCase().includes(query)) ||
      (emp.email && emp.email.toLowerCase().includes(query)) ||
      (emp.role && emp.role.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full">
      {/* Custom Toolbar exactly matching ProjectsTable */}
      <div className="flex flex-col sm:flex-row items-center gap-1 w-full mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Employees.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111114] border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <div className="flex items-center p-1 bg-[#111114] border border-zinc-800 rounded-lg shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          <button
            className="bg-zinc-100 hover:bg-white text-black shadow-lg font-semibold transition-all shrink-0 px-4 py-2 rounded-md h-auto text-sm whitespace-nowrap"
            onClick={() => setIsModalOpen(true)}
          >
            Add Employee
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/10 animate-pulse text-zinc-500 text-sm">
          Loading employees...
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <Users className="w-12 h-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-zinc-300 mb-2">No Employees Found</h3>
          <p className="text-zinc-500 text-center max-w-md text-sm">
            You don't have any employees yet. Click "Add Employee" to get started.
          </p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <Search className="w-12 h-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-zinc-300 mb-2">No Results Found</h3>
          <p className="text-zinc-500 text-center max-w-md text-sm">
            We couldn't find any employees matching "{searchQuery}". Try searching for something else.
          </p>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-800 bg-[#111114]">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400 font-medium w-[30%]">Name</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[40%]">Email ID</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[15%]">Role</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[15%] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee._id} className="border-zinc-800/80 hover:bg-zinc-900/30">
                  <TableCell className="font-medium text-zinc-100">
                    {employee.username}
                  </TableCell>
                  <TableCell className="text-zinc-400 font-sans text-sm">
                    {employee.email}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize px-2 py-1 bg-[#241b57] text-[#b4aee0] rounded-md text-xs font-medium border border-[#2a2a35]">
                      {employee.role || "Employee"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-[#8f8f9c] hover:text-[#b4aee0] p-1.5 transition-colors rounded-md hover:bg-zinc-800/50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-[#8f8f9c] hover:text-red-500 p-1.5 transition-colors rounded-md hover:bg-zinc-800/50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={(newEmployee) => {
          setIsModalOpen(false);
          if (newEmployee) {
            setEmployees((prev) => [...prev, newEmployee]);
          }
        }}
      />
    </div>
  );
}
