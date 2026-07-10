"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/config/api";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store JWT token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      
      // Redirect to dashboard
      toast.success("Login successful!");
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } 
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-[#f0f0f4] mb-2 tracking-tight">Welcome back</h1>
      <p className="text-[#8f8f9c] text-sm mb-8">Log in to your DeployHub account to manage your applications.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
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
            placeholder="john@example.com"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-[#b4aee0]">
              Password
            </label>
            <Link href="#" className="text-xs text-[#7f77dd] hover:text-[#b4aee0] font-medium transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
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

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md" aria-live="polite">
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 bg-[#7f77dd] hover:bg-[#6c64c7] text-white py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#2a2a35]" />
        <span className="text-xs text-[#8f8f9c] font-medium uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-[#2a2a35]" />
      </div>

      <button
        type="button"
        className="w-full bg-[#16161d] hover:bg-[#2a2a35] border border-[#2a2a35] text-[#f0f0f4] py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        Continue with GitHub
      </button>

      <div className="mt-12 text-center space-y-4">
        <p className="text-sm text-[#8f8f9c]">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[#7f77dd] hover:text-[#b4aee0] font-medium transition-colors">
            Sign up
          </Link>
        </p>
        <p className="text-xs text-[#2a2a35]">© DeployHub 2026</p>
      </div>
    </div>
  );
}
