"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";

type Phase = "idle" | "modal" | "terminal" | "success";

const terminalStepsData = [
  { text: "Thinking...", logs: ["> analyzing repository architecture", "> resolving dependencies"] },
  { text: "Extracting files...", logs: ["> downloading source code", "> unpacking to /workspace"] },
  { text: "Reading Dockerfile...", logs: ["> found valid Dockerfile", "> preparing build context"] },
  { text: "Building image...", logs: ["> step 1/4: FROM node:18-alpine", "> step 2/4: RUN npm install"] },
  { text: "Running checks...", logs: ["> container port 3000 exposed", "> healthcheck passed"] },
  { text: "Finalizing deployment...", logs: [] }
];

const AnimatedDeployPreview = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typingState, setTypingState] = useState({
    projectName: "",
    repoUrl: "",
    envVars: "",
  });
  const [terminalLines, setTerminalLines] = useState<number>(0);
  const [terminalLogLines, setTerminalLogLines] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState({ x: 150, y: 150 });
  const [cursorClicking, setCursorClicking] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const sleep = (ms: number) => new Promise(resolve => {
      timeoutId = setTimeout(() => {
        if (isMounted) resolve(null);
      }, ms);
    });

    const runSequence = async () => {
      // 1. Idle Phase
      setPhase("idle");
      setTypingState({ projectName: "", repoUrl: "", envVars: "" });
      setTerminalLines(0);
      setTerminalLogLines(0);
      setCursorPos({ x: 200, y: 200 }); // start pos

      await sleep(1000);
      if (!isMounted) return;
      
      // Move cursor to Deploy button
      setCursorPos({ x: 280, y: 40 }); 
      await sleep(800);
      if (!isMounted) return;
      
      // Click
      setCursorClicking(true);
      await sleep(200);
      setCursorClicking(false);
      await sleep(200);
      if (!isMounted) return;

      // 2. Modal Phase
      setPhase("modal");
      setCursorPos({ x: 180, y: 100 }); // Move to Git Tab
      await sleep(600);
      setCursorClicking(true);
      await sleep(200);
      setCursorClicking(false);
      await sleep(400);
      if (!isMounted) return;

      // Type Project Name
      const pName = "my-nextjs-app";
      for (let i = 0; i <= pName.length; i++) {
        if (!isMounted) return;
        setTypingState(s => ({ ...s, projectName: pName.slice(0, i) }));
        await sleep(40);
      }
      await sleep(300);

      // Type Repo URL
      const rUrl = "github.com/johndoe/my-nextjs-app";
      for (let i = 0; i <= rUrl.length; i++) {
        if (!isMounted) return;
        setTypingState(s => ({ ...s, repoUrl: rUrl.slice(0, i) }));
        await sleep(35);
      }
      await sleep(300);

      // Type Env Vars
      const envs = "PORT=3000\nNODE_ENV=production";
      for (let i = 0; i <= envs.length; i++) {
        if (!isMounted) return;
        setTypingState(s => ({ ...s, envVars: envs.slice(0, i) }));
        await sleep(30);
      }
      await sleep(500);

      // Move cursor to Deploy modal button
      setCursorPos({ x: 280, y: 350 });
      await sleep(700);
      setCursorClicking(true);
      await sleep(200);
      setCursorClicking(false);
      await sleep(300);
      if (!isMounted) return;

      // 3. Terminal Phase
      setPhase("terminal");
      setCursorPos({ x: 350, y: 400 }); // Move cursor away
      
      for (let i = 1; i <= 6; i++) {
        if (!isMounted) return;
        setTerminalLines(i);
        setTerminalLogLines(0);
        
        const logs = terminalStepsData[i - 1].logs;
        for (let j = 1; j <= logs.length; j++) {
           await sleep(400); // short delay between log lines
           if (!isMounted) return;
           setTerminalLogLines(j);
        }
        
        await sleep(600); // delay before finishing step
      }
      await sleep(1000);

      // 4. Success Phase
      setPhase("success");
      await sleep(3000);
      if (!isMounted) return;

      // Loop
      runSequence();
    };

    runSequence();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Container with specific background and height */}
      <div className="relative w-full h-[450px] bg-[#1c1740] rounded-2xl border border-[#453b8c] overflow-hidden shadow-2xl flex items-center justify-center">
        
        {/* Animated Cursor */}
        <div 
          className="absolute z-50 pointer-events-none transition-all duration-700 ease-out flex items-center justify-center"
          style={{ 
            transform: `translate(${cursorPos.x}px, ${cursorPos.y}px)`,
            top: 0, left: 0
          }}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow-lg ${cursorClicking ? 'scale-75 bg-[#7f77dd]' : 'scale-100'} transition-transform duration-150`} />
          <div className={`absolute w-8 h-8 border-2 border-white rounded-full ${cursorClicking ? 'animate-ping opacity-100' : 'opacity-0'}`} />
        </div>

        {/* Phase 1: Idle */}
        <div className={`absolute inset-0 p-6 transition-opacity duration-300 ${phase === "idle" ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[#f0f0f4] font-semibold">Dashboard</h3>
            <button className="bg-[#7f77dd] text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Deploy project
            </button>
          </div>
          
          <div className="bg-[#2e2566] border border-[#453b8c] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1c1740] flex items-center justify-center border border-[#453b8c]">
                <ServerIcon className="w-5 h-5 text-[#b4aee0]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#f0f0f4]">api-service</p>
                <p className="text-xs text-[#b4aee0]">Running • 2d ago</p>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-[#5dcaa5]/20 text-[#5dcaa5] text-xs font-medium rounded-full border border-[#5dcaa5]/30">
              Healthy
            </div>
          </div>
        </div>

        {/* Phase 2: Deploy Modal */}
        <div className={`absolute inset-0 p-6 bg-[#1c1740]/90 backdrop-blur-sm transition-opacity duration-300 ${phase === "modal" ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="bg-[#2e2566] border border-[#453b8c] rounded-xl shadow-xl w-full h-full p-4 flex flex-col">
            <h3 className="text-[#f0f0f4] font-bold mb-3 text-sm">Deploy Project</h3>
            
            <div className="flex gap-2 p-1 bg-[#1c1740] rounded-md mb-4 border border-[#453b8c]">
              <div className="flex-1 text-center py-1 text-[10px] text-[#b4aee0]">ZIP Upload</div>
              <div className="flex-1 text-center py-1 text-[10px] bg-[#2e2566] text-white rounded shadow-sm border border-[#453b8c]">Git Repository</div>
            </div>

            <div className="space-y-3 flex-1 overflow-hidden">
              <div>
                <label className="text-[10px] font-medium text-[#b4aee0] mb-1 block">Project Name</label>
                <div className="w-full h-8 bg-[#1c1740] border border-[#453b8c] rounded-md px-2 py-1.5 text-xs text-[#f0f0f4] font-mono flex items-center">
                  {typingState.projectName}
                  <span className="w-1 h-3 bg-[#7f77dd] animate-pulse ml-0.5 inline-block" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-medium text-[#b4aee0] mb-1 block">Repository URL</label>
                <div className="w-full h-8 bg-[#1c1740] border border-[#453b8c] rounded-md px-2 py-1.5 text-xs text-[#f0f0f4] font-mono flex items-center">
                  {typingState.repoUrl}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-medium text-[#b4aee0] mb-1 block">Environment Variables</label>
                <div className="w-full h-14 bg-[#1c1740] border border-[#453b8c] rounded-md px-2 py-1.5 text-[10px] text-[#f0f0f4] font-mono whitespace-pre-wrap leading-tight">
                  {typingState.envVars}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-[#453b8c]">
              <button className="bg-[#7f77dd] text-white px-4 py-1.5 rounded-md text-xs font-medium">
                Deploy
              </button>
            </div>
          </div>
        </div>

        {/* Phase 3: Terminal */}
        <div className={`absolute inset-0 p-6 bg-[#0a0a10] transition-opacity duration-300 ${phase === "terminal" ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="space-y-3 font-mono text-xs">
            {terminalStepsData.map((step, idx) => {
              if (idx >= terminalLines) return null;
              const isLast = idx === terminalLines - 1 && idx !== 5;
              const isFinalizing = idx === 5;
              
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[#b4aee0]">
                    {isLast ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7f77dd]" />
                    ) : isFinalizing ? (
                       <div className="flex space-x-0.5">
                         <div className="w-1 h-1 bg-[#7f77dd] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                         <div className="w-1 h-1 bg-[#7f77dd] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                         <div className="w-1 h-1 bg-[#7f77dd] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                       </div>
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-[#5dcaa5]" />
                    )}
                    <span>{step.text}</span>
                  </div>
                  <div className="pl-5 text-[10px] text-[#8f8f9c] space-y-0.5">
                    {step.logs.map((log, logIdx) => {
                      if (idx < terminalLines - 1 || (idx === terminalLines - 1 && logIdx < terminalLogLines)) {
                        return <div key={logIdx} className="animate-in fade-in duration-300">{log}</div>;
                      }
                      return null;
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase 4: Success */}
        <div className={`absolute inset-0 p-6 bg-[#1c1740] flex flex-col items-center justify-center transition-opacity duration-300 ${phase === "success" ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
          <div className="w-16 h-16 bg-[#5dcaa5]/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-[#5dcaa5]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">You're in production</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2e2566] border border-[#453b8c] rounded-full">
            <div className="w-2 h-2 rounded-full bg-[#5dcaa5] animate-pulse" />
            <span className="text-xs font-medium text-[#b4aee0]">live at deployhub.app/my-nextjs-app</span>
          </div>
        </div>

      </div>

      {/* Caption & Dots */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">From git push to production.</h2>
        <p className="text-[#b4aee0] text-sm mb-6 max-w-sm mx-auto">Configure, build, and deploy without leaving your dashboard.</p>
        
        <div className="flex items-center justify-center gap-2">
          {(["idle", "modal", "terminal", "success"] as Phase[]).map((p) => (
            <div 
              key={p}
              className={`h-1.5 rounded-full transition-all duration-300 ${phase === p ? "w-6 bg-[#7f77dd]" : "w-1.5 bg-[#453b8c]"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ServerIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
);

export default AnimatedDeployPreview;
