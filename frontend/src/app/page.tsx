"use client";

import { useEffect, useState } from "react";
import { Terminal as TerminalIcon, Settings, LayoutDashboard, Rocket, Server, LogOut, User as UserIcon, X, Building, Users, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadModal } from "@/components/UploadModal";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/config/api";

const Terminal = dynamic(() => import("@/components/Terminal").then((mod) => mod.Terminal), {
  ssr: false,
});
import { ProjectsTable } from "@/components/ProjectsTable";
import { EmployeesTable } from "@/components/EmployeesTable";
import { AccessControl } from "@/components/AccessControl";
import { AIChat } from "@/components/ai/AIChat";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "employees" | "infrastructure" | "settings" | "ai">("dashboard");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    } 
    
    fetch(getApiUrl("/auth/me"), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setIsCheckingAuth(false);
        } else {
          localStorage.removeItem("token");
          router.push("/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleModalClose = (newDeploymentId?: string) => {
    setIsModalOpen(false);
    if (newDeploymentId && typeof newDeploymentId === "string") {
      setDeploymentId(newDeploymentId);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-zinc-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans">
      {/* Sidebar - Old School DevOps feel */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#111114] border-r border-zinc-800 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3 text-zinc-100">
          <Rocket className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-xl tracking-tight">DeployHub</span>
        </div>
        <nav className="mt-6 px-4 space-y-1 text-sm font-medium flex-1">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === "dashboard" ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30"}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          
          {user?.accountType === "organization" && (
            <button 
              onClick={() => setActiveTab("employees")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === "employees" ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30"}`}
            >
              <Users className="w-4 h-4" />
              Employees
            </button>
          )}

          {user?.accountType === "organization" && (
            <button 
              onClick={() => setActiveTab("infrastructure")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === "infrastructure" ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30"}`}
            >
              <Shield className="w-4 h-4" />
              Access Control
            </button>
          )}

          <button 
            onClick={() => setActiveTab("ai")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all ${
              activeTab === "ai"
                ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>DeployHub AI</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              NEW
            </span>
          </button>
          
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${activeTab === "settings" ? "text-zinc-100 bg-zinc-800/50" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30"}`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-colors text-sm font-medium"
          >
            <div className="w-6 h-6 rounded-full bg-[#241b57] flex items-center justify-center text-[#7f77dd]">
              <UserIcon className="w-3 h-3" />
            </div>
            <span className="truncate">{user?.username || "Profile"}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-6 lg:p-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="md:hidden flex justify-between w-full items-center">
             <div className="flex items-center gap-2 text-zinc-100">
               <Rocket className="w-5 h-5 text-blue-500" />
               <span className="font-bold tracking-tight">DeployHub</span>
             </div>
             <button onClick={handleLogout} className="text-red-400 p-2 hover:bg-red-500/10 rounded-md">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </header>

        {deploymentId ? (
          <Terminal 
            deploymentId={deploymentId} 
            onClose={() => setDeploymentId(null)}
          />
        ) : (
          <div className="mt-4">
            {activeTab === "dashboard" && <ProjectsTable onDeployProject={() => setIsModalOpen(true)} user={user} />}
            {activeTab === "employees" && user?.accountType === "organization" && <EmployeesTable />}
            {activeTab === "infrastructure" && user?.accountType === "organization" && <AccessControl />}
            {activeTab === "ai" && <AIChat />}
            {activeTab === "settings" && <div className="text-zinc-500">Global settings coming soon...</div>}
          </div>
        )}
      </div>

      <UploadModal isOpen={isModalOpen} onClose={handleModalClose} />

      {/* Profile Modal */}
      {isProfileModalOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#7f77dd]" />
                Profile
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {user.organizationName && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Organization</p>
                    <p className="font-medium text-zinc-200">{user.organizationName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#241b57] flex items-center justify-center text-[#7f77dd]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Username</p>
                  <p className="font-medium text-zinc-200">{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <span className="text-xs font-bold">@</span>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Email</p>
                  <p className="font-medium text-zinc-200">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-[#0a0a0c]">
              <button 
                onClick={handleLogout}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors font-medium text-sm border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
