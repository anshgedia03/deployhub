"use client";

import React from "react";
import AnimatedDeployPreview from "./AnimatedDeployPreview";
import { Rocket } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0a10] text-[#f0f0f4] font-sans selection:bg-[#7f77dd]/30">
      
      {/* Left Panel - Hidden on small screens */}
      <div className="hidden lg:flex w-full max-w-[42%] bg-[#241b57] relative flex-col items-center justify-center p-12 overflow-hidden">
        
        {/* Soft translucent circles for depth */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#7f77dd] rounded-full opacity-[0.03] blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#5dcaa5] rounded-full opacity-[0.03] blur-3xl pointer-events-none" />
        
        {/* Animated Deploy Demo */}
        <div className="relative z-10 w-full">
          <AnimatedDeployPreview />
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col p-8 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="flex items-center gap-2 mb-16">
          <Rocket className="w-6 h-6 text-[#7f77dd]" />
          <span className="font-bold text-xl tracking-tight">DeployHub</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
