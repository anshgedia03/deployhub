"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { io, Socket } from "socket.io-client";
import { Maximize2, Minimize2, X } from "lucide-react";

interface TerminalProps {
  deploymentId: string;
  onClose?: () => void;
}

export function Terminal({ deploymentId, onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new XTerm({
      theme: {
        background: "#0a0a0c",
        foreground: "#d4d4d8",
        cursor: "#3b82f6",
        selectionBackground: "#3b82f640",
      },
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: 13,
      cursorBlink: true,
      disableStdin: true,
      convertEol: true,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    // Initialize Socket.io
    // Assumes backend is running on port 4000
    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.on("connect", () => {
      term.writeln("\x1b[34m[System] Connected to build server.\x1b[0m");
      
      const fetchHistory = async () => {
        try {
          term.writeln("\x1b[34m[System] Fetching historical logs...\x1b[0m");
          let cursor = 0;
          let hasMore = true;

          while (hasMore) {
            const res = await fetch(`http://localhost:4000/projects/${deploymentId}/logs?cursor=${cursor}&limit=100000`);
            if (!res.ok) break;
            
            const data = await res.json();
            if (data.logs) {
              term.write(data.logs);
            }
            
            if (data.nextCursor && data.nextCursor > cursor) {
              cursor = data.nextCursor;
            } else {
              hasMore = false;
            }
          }
          term.scrollToBottom();
        } catch (e) {
          console.error("Failed to fetch logs history", e);
        }
      };

      fetchHistory().then(() => {
        socket.emit("subscribe", deploymentId);
      });
    });

    socket.on("logs:live", (log: string) => {
      term.write(log);
      term.scrollToBottom();
    });

    socket.on("disconnect", () => {
      term.writeln("\r\n\x1b[33m[System] Disconnected from server.\x1b[0m");
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [deploymentId]);

  // Re-fit terminal when fullscreen toggles
  useEffect(() => {
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }, 50); // slight delay for DOM transition
  }, [isFullscreen]);

  return (
    <div className={`flex flex-col bg-[#0a0a0c] border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 ${isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "h-[400px] relative mt-6"}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">
            Build Logs: {deploymentId.split("-")[0]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 w-full p-2 overflow-hidden" ref={terminalRef}></div>
    </div>
  );
}
