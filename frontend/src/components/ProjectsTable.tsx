"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { io } from "socket.io-client";
import { ExternalLink, Play, Square, Trash2, MoreHorizontal, Server, GitBranch, FileArchive, LayoutGrid, List, Triangle, Check, Loader2, X, Terminal, Settings, Star, Search, Rocket } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl, getSocketUrl, getAuthHeaders } from "@/config/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface Deployment {
  _id: string;
  deploymentId: string;
  projectName: string;
  status: "building" | "running" | "failed" | "stopped" | "cloning";
  port?: number;
  publicUrl?: string;
  gitUrl?: string;
  startedAt?: string;
  branch?: string;
  createdAt: string;
}
interface ProjectsTableProps {
  onDeployProject?: () => void;
}

export function ProjectsTable({ onDeployProject }: ProjectsTableProps) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000); // Trigger a render every 10 seconds to update the Uptime elapsed text locally
    return () => clearInterval(timer);
  }, []);

  const fetchDeployments = async (query: string = "", isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      setLoading(true);
      const queryParam = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`${getApiUrl("/projects")}${queryParam}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDeployments(data);
      }
    } catch (err) {
      console.error("Failed to fetch deployments", err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments(debouncedQuery, debouncedQuery === "" && deployments.length === 0);
  }, [debouncedQuery]);

  useEffect(() => {

    // Setup socket to listen for status changes
    const socket = io(getSocketUrl());
    socket.on("project:status_changed", (data: { 
      deploymentId: string; 
      status: string; 
      port?: number; 
      publicUrl?: string; 
      startedAt?: string; 
    }) => {
      setDeployments(prev => {
        const existing = prev.find(d => d.deploymentId === data.deploymentId);
        const name = existing ? existing.projectName : data.deploymentId.split('-')[0];

        // Trigger real-time status toasts
        if (data.status === 'BUILDING') {
          toast.loading(`Building "${name}"...`, { id: data.deploymentId });
        } else if (data.status === 'RUNNING') {
          toast.success(`Project "${name}" deployed successfully!`, { id: data.deploymentId });
        } else if (data.status === 'FAILED') {
          toast.error(`Build failed for "${name}".`, { id: data.deploymentId });
        } else if (data.status === 'STOPPED') {
          toast.warning(`Project "${name}" stopped.`, { id: data.deploymentId });
        } else if (data.status === 'DELETED') {
          toast.success(`Project deleted successfully.`);
        }

        return prev.map(d => 
          d.deploymentId === data.deploymentId 
            ? { 
                ...d, 
                status: data.status.toLowerCase() as any,
                port: data.port !== undefined ? data.port : d.port,
                publicUrl: data.publicUrl !== undefined ? data.publicUrl : d.publicUrl,
                startedAt: data.startedAt !== undefined ? data.startedAt : d.startedAt
              } 
            : d
        );
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cloning":
      case "CLONING":
        return <Badge className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20">Cloning</Badge>;
      case "building":
      case "BUILDING":
        return <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">Building</Badge>;
      case "running":
      case "RUNNING":
        return <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">Running</Badge>;
      case "failed":
      case "FAILED":
        return <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">Failed</Badge>;
      case "STOPPED":
      case "stopped":
        return <Badge className="bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20 border-zinc-500/20">Stopped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusGridIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return <Check className="w-4 h-4 text-emerald-500" />;
      case 'building':
      case 'cloning':
      case 'validating': 
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <X className="w-4 h-4 text-red-500" />;
      case 'stopped': return <Square className="w-4 h-4 text-zinc-500" />;
      default: return <Server className="w-4 h-4 text-zinc-400" />;
    }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      if (action === 'delete') {
        const res = await fetch(getApiUrl(`/projects/${id}`), { method: 'DELETE', headers: getAuthHeaders() });
        if (res.ok) {
          toast.success('Deletion request sent.', { id: `delete-${id}` });
        } else {
          toast.error('Failed to trigger deletion.', { id: `delete-error-${id}` });
        }
      } else if (action === 'start' || action === 'stop') {
        const res = await fetch(getApiUrl(`/projects/${id}/${action}`), { method: 'POST', headers: getAuthHeaders() });
        if (res.ok) {
          toast.success(`Request to ${action} container sent.`, { id: `${action}-${id}` });
        } else {
          toast.error(`Failed to ${action} container.`, { id: `${action}-error-${id}` });
        }
      } else if (action === 'open') {
        const deployment = deployments.find(d => d.deploymentId === id);
        if (deployment) {
          if (deployment.publicUrl) {
            window.open(deployment.publicUrl, '_blank');
          } else {
            window.open(`http://${window.location.hostname}/${deployment.projectName || deployment.deploymentId}/`, '_blank');
          }
        }
      }
    } catch (err) {
      console.error(`Failed to execute ${action} on ${id}`, err);
      toast.error(`An unexpected error occurred during "${action}" action.`);
    }
  };



  const renderActions = (deployment: Deployment, isRunning: boolean, isBuilding: boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 focus:outline-none transition-all cursor-pointer">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        sideOffset={8}
        className="w-56 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-xl p-2 shadow-2xl text-zinc-300"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1.5">
            Project Operations
          </DropdownMenuLabel>
          <DropdownMenuItem 
            className="rounded-lg px-3 py-2 hover:bg-blue-500/10 hover:text-blue-400 cursor-pointer transition-colors"
            onClick={() => handleAction('open', deployment.deploymentId)}
            disabled={!isRunning}
          >
            <ExternalLink className="mr-3 h-4 w-4" />
            <span className="font-medium">Open App</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="rounded-lg px-3 py-2 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer transition-colors"
            onClick={() => handleAction('start', deployment.deploymentId)}
            disabled={isRunning || isBuilding}
          >
            <Play className="mr-3 h-4 w-4" />
            <span className="font-medium">Start Server</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="rounded-lg px-3 py-2 hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer transition-colors"
            onClick={() => handleAction('stop', deployment.deploymentId)}
            disabled={!isRunning}
          >
            <Square className="mr-3 h-4 w-4" />
            <span className="font-medium">Stop Server</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-zinc-800/60 my-2" />
        
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 py-1.5">
            Developer Tools
          </DropdownMenuLabel>
          <DropdownMenuItem 
            className="rounded-lg px-3 py-2 hover:bg-zinc-800/80 hover:text-zinc-100 cursor-pointer transition-colors"
            onClick={() => toast.info('View Logs coming soon')}
          >
            <Terminal className="mr-3 h-4 w-4 text-zinc-400" />
            <span className="font-medium">View Logs</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="rounded-lg px-3 py-2 hover:bg-zinc-800/80 hover:text-zinc-100 cursor-pointer transition-colors"
            onClick={() => toast.info('Settings coming soon')}
          >
            <Settings className="mr-3 h-4 w-4 text-zinc-400" />
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="rounded-lg px-3 py-2 hover:bg-yellow-500/10 hover:text-yellow-400 cursor-pointer transition-colors"
            onClick={() => toast.success('Added to favorites')}
          >
            <Star className="mr-3 h-4 w-4 text-zinc-400 group-hover:text-yellow-400" />
            <span className="font-medium">Add to Favorites</span>
          </DropdownMenuItem>
          {deployment.gitUrl && (
            <DropdownMenuItem 
              className="rounded-lg px-3 py-2 hover:bg-zinc-800/80 hover:text-zinc-100 cursor-pointer transition-colors"
              onClick={() => window.open(deployment.gitUrl?.replace('.git', ''), '_blank')}
            >
              <GitBranch className="mr-3 h-4 w-4 text-zinc-400" />
              <span className="font-medium">View Git Repo</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-zinc-800/60 my-2" />
        
        <DropdownMenuItem 
          className="rounded-lg px-3 py-2 bg-red-500/5 text-red-500 hover:bg-red-500/15 focus:bg-red-500/20 focus:text-red-500 cursor-pointer transition-colors"
          onClick={() => handleAction('delete', deployment.deploymentId)}
        >
          <Trash2 className="mr-3 h-4 w-4" />
          <span className="font-medium">Delete Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center gap-1 w-full mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Projects.."
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
          
          {onDeployProject && (
            <Button
              className="bg-zinc-100 hover:bg-white text-black shadow-lg font-semibold transition-all shrink-0 px-4 py-2 h-auto text-sm"
              onClick={onDeployProject}
            >
              Deploy Project
            </Button>
          )}
        </div>
      </div>

      {initialLoading ? (
        <div className="flex flex-col items-center justify-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/10 animate-pulse text-zinc-500 text-sm">
          Loading deployments...
        </div>
      ) : deployments.length === 0 ? (
        searchQuery ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <Search className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-zinc-300 mb-2">No Results Found</h3>
            <p className="text-zinc-500 text-center max-w-md text-sm">
              We couldn't find any projects matching "{searchQuery}". Try searching for something else.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <Server className="w-12 h-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-bold text-zinc-300 mb-2">No Deployments Found</h3>
            <p className="text-zinc-500 text-center max-w-md text-sm">
              You don't have any projects deployed yet. Click "Deploy Project" to get started.
            </p>
          </div>
        )
      ) : viewMode === 'list' ? (
        <div className="rounded-md border border-zinc-800 bg-[#111114]">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400 font-medium w-[20%]">Project Name</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[15%]">Status</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[10%]">Port</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[20%]">Method</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[15%]">Uptime</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[15%]">Created</TableHead>
                <TableHead className="text-zinc-400 font-medium w-[5%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((deployment) => {
                const isRunning = deployment.status.toLowerCase() === 'running';
                const isBuilding = deployment.status.toLowerCase() === 'building';

                return (
                  <TableRow key={deployment.deploymentId} className="border-zinc-800/80 hover:bg-zinc-900/30">
                    <TableCell className="font-medium text-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800/50 text-zinc-400 rounded-md">
                          <Server className="h-4 w-4" />
                        </div>
                        <span className="truncate max-w-[150px]" title={deployment.projectName || deployment.deploymentId}>
                          {deployment.projectName || deployment.deploymentId.split('-')[0]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(deployment.status)}</TableCell>
                    <TableCell className="text-zinc-400 font-sans text-sm">
                      {deployment.port ? (
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          {deployment.port}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {deployment.gitUrl ? (
                        <a 
                          href={deployment.gitUrl.replace('.git', '')} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/60 text-zinc-300 text-xs font-medium hover:bg-zinc-700/60 transition-colors"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          {deployment.gitUrl.replace('https://github.com/', '').replace('.git', '')}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/40 text-zinc-400 text-xs font-medium">
                          <FileArchive className="w-3.5 h-3.5" />
                          ZIP File
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {deployment.startedAt ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Up {formatDistanceToNow(new Date(deployment.startedAt))}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderActions(deployment, isRunning, isBuilding)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {deployments.map(deployment => {
            const isRunning = deployment.status.toLowerCase() === 'running';
            const isBuilding = deployment.status.toLowerCase() === 'building';
            
            return (
              <div key={deployment.deploymentId} className="bg-[#111114] border border-zinc-800 rounded-xl p-5 hover:bg-zinc-900/50 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                      <Triangle className="w-5 h-5 fill-zinc-200 text-zinc-200" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-zinc-100 font-bold text-[15px] leading-tight truncate mb-0.5">
                        {deployment.projectName || deployment.deploymentId.split('-')[0]}
                      </h3>
                      <p className="text-zinc-500 text-xs truncate">
                        {deployment.publicUrl ? deployment.publicUrl.replace('https://', '') : `${deployment.projectName || deployment.deploymentId.split('-')[0]}.deployhub.local`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center" title={deployment.status}>
                      {getStatusGridIcon(deployment.status)}
                    </div>
                    {renderActions(deployment, isRunning, isBuilding)}
                  </div>
                </div>

                <div className="mb-5">
                  {deployment.gitUrl ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-zinc-300 text-xs font-medium">
                      <GitBranch className="w-3.5 h-3.5" />
                      {deployment.gitUrl.replace('https://github.com/', '').replace('.git', '')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-xs font-medium">
                      <FileArchive className="w-3.5 h-3.5" />
                      ZIP File
                    </span>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-1.5 text-[13px]">
                  <div className="text-zinc-300 font-medium flex items-center gap-1.5">
                    {deployment.startedAt ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Up {formatDistanceToNow(new Date(deployment.startedAt))}
                      </>
                    ) : (
                      <span className="text-zinc-500">Not Running</span>
                    )}
                  </div>
                  <div className="text-zinc-500 flex items-center gap-1.5">
                    {formatDistanceToNow(new Date(deployment.createdAt))} 
                    {deployment.branch && (
                      <>
                        on <GitBranch className="w-3.5 h-3.5 text-zinc-600" /> <span className="font-sans text-zinc-400">{deployment.branch}</span>
                      </>
                    )}
                    {deployment.port && (
                      <span className="ml-auto flex items-center gap-1.5 text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {deployment.port}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
