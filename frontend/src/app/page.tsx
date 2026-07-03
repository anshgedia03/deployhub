"use client";

import { useState } from "react";
import { Terminal as TerminalIcon, Settings, LayoutDashboard, Rocket, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadModal } from "@/components/UploadModal";
import dynamic from "next/dynamic";

const Terminal = dynamic(() => import("@/components/Terminal").then((mod) => mod.Terminal), {
  ssr: false,
});
import { ProjectsTable } from "@/components/ProjectsTable";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);

  const handleModalClose = (newDeploymentId?: string) => {
    setIsModalOpen(false);
    if (newDeploymentId && typeof newDeploymentId === "string") {
      setDeploymentId(newDeploymentId);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-mono">
      {/* Sidebar - Old School DevOps feel */}
      <div className="fixed inset-y-0 left-0 w-64 bg-[#111114] border-r border-zinc-800 hidden md:block">
        <div className="p-6 flex items-center gap-3 text-zinc-100">
          <Rocket className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-xl tracking-tight">DeployX</span>
        </div>
        <nav className="mt-6 px-4 space-y-1 text-sm font-medium">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-100 bg-zinc-800/50 rounded-md">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30 rounded-md transition-colors">
            <Server className="w-4 h-4" />
            Infrastructure
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30 rounded-md transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 p-6 lg:p-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div />
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-bold transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deploy Project
          </Button>
        </header>

        {deploymentId ? (
          <Terminal 
            deploymentId={deploymentId} 
            onClose={() => setDeploymentId(null)}
          />
        ) : (
          <div className="mt-12">
            <ProjectsTable />
          </div>
        )}
      </div>

      <UploadModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}
