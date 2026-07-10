"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus, EyeOff, Eye } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: (newEmployee?: any) => void;
}

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "developer", // default role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/employees"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add employee");
      }

      toast.success("Employee added successfully!");
      onClose(data.employee); // pass back the new employee
      setFormData({ username: "", email: "", password: "", role: "developer" }); // reset form
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#7f77dd]" />
            Add Employee
          </h3>
          <button onClick={() => onClose()} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-[#b4aee0]">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 bg-[#16161d] border border-[#2a2a35] rounded-md text-sm text-[#f0f0f4] placeholder-[#8f8f9c] focus:outline-none focus:border-[#7f77dd] transition-colors"
                placeholder="johndoe"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#b4aee0]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#16161d] border border-[#2a2a35] rounded-md text-sm text-[#f0f0f4] placeholder-[#8f8f9c] focus:outline-none focus:border-[#7f77dd] transition-colors"
                placeholder="john@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="role" className="block text-sm font-medium text-[#b4aee0]">
                Role
              </label>
              <input
                id="role"
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-[#16161d] border border-[#2a2a35] rounded-md text-sm text-[#f0f0f4] placeholder-[#8f8f9c] focus:outline-none focus:border-[#7f77dd] transition-colors"
                placeholder="Developer"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label htmlFor="password" className="block text-sm font-medium text-[#b4aee0]">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-3 pr-10 py-2 bg-[#16161d] border border-[#2a2a35] rounded-md text-sm text-[#f0f0f4] placeholder-[#8f8f9c] focus:outline-none focus:border-[#7f77dd] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8f8f9c] hover:text-[#b4aee0] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md" aria-live="polite">
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-[#7f77dd] hover:bg-[#6c64c7] text-white py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Employee"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
