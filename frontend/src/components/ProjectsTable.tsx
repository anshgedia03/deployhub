"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { io } from "socket.io-client";
import { ExternalLink, Play, Square, Trash2, MoreHorizontal, Server } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl, getSocketUrl } from "@/config/api";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Deployment {
  _id: string;
  deploymentId: string;
  projectName: string;
  status: "building" | "running" | "failed" | "stopped";
  port?: number;
  createdAt: string;
}

export function ProjectsTable() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeployments = async () => {
    try {
      const res = await fetch(getApiUrl("/projects"));
      if (res.ok) {
        const data = await res.json();
        setDeployments(data);
      }
    } catch (err) {
      console.error("Failed to fetch deployments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
    
    // Auto-refresh periodically as a fallback
    const interval = setInterval(fetchDeployments, 15000);

    // Setup socket to listen for status changes
    const socket = io(getSocketUrl());
    socket.on("project:status_changed", (data: { deploymentId: string, status: string }) => {
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
            ? { ...d, status: data.status.toLowerCase() as any } 
            : d
        );
      });
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const handleAction = async (action: string, id: string) => {
    try {
      if (action === 'delete') {
        const res = await fetch(getApiUrl(`/projects/${id}`), { method: 'DELETE' });
        if (res.ok) {
          toast.success('Deletion request sent.');
        } else {
          toast.error('Failed to trigger deletion.');
        }
      } else if (action === 'start' || action === 'stop') {
        const res = await fetch(getApiUrl(`/projects/${id}/${action}`), { method: 'POST' });
        if (res.ok) {
          toast.success(`Request to ${action} container sent.`);
        } else {
          toast.error(`Failed to ${action} container.`);
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

  if (loading) {
    return <div className="text-zinc-500 text-sm animate-pulse">Loading deployments...</div>;
  }

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
        <Server className="w-12 h-12 text-zinc-600 mb-4" />
        <h3 className="text-lg font-bold text-zinc-300 mb-2">No Deployments Found</h3>
        <p className="text-zinc-500 text-center max-w-md text-sm">
          You don't have any projects deployed yet. Click "Deploy Project" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-[#111114]">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
            <TableHead className="text-zinc-400 font-medium">Project Name</TableHead>
            <TableHead className="text-zinc-400 font-medium">Status</TableHead>
            <TableHead className="text-zinc-400 font-medium">Port</TableHead>
            <TableHead className="text-zinc-400 font-medium">Created</TableHead>
            <TableHead className="text-zinc-400 font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deployments.map((deployment) => (
            <TableRow key={deployment._id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
              <TableCell className="font-medium text-zinc-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                    {(deployment.projectName || deployment.deploymentId).substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[150px]" title={deployment.projectName || deployment.deploymentId}>
                    {deployment.projectName || deployment.deploymentId.split('-')[0]}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(deployment.status)}</TableCell>
              <TableCell className="text-zinc-400 font-mono text-sm">
                {deployment.port ? (
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    {deployment.port}
                  </span>
                ) : (
                  <span className="text-zinc-600">-</span>
                )}
              </TableCell>
              <TableCell className="text-zinc-500 text-sm">
                {formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus:outline-none transition-colors cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                    <DropdownMenuItem 
                      className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
                      onClick={() => handleAction('open', deployment.deploymentId)}
                      disabled={deployment.status !== 'running'}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>Open</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
                      onClick={() => handleAction('stop', deployment.deploymentId)}
                      disabled={deployment.status !== 'running'}
                    >
                      <Square className="mr-2 h-4 w-4 text-amber-400" />
                      <span>Stop</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
                      onClick={() => handleAction('start', deployment.deploymentId)}
                      disabled={deployment.status === 'running' || deployment.status === 'building'}
                    >
                      <Play className="mr-2 h-4 w-4 text-emerald-400" />
                      <span>Start</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="hover:bg-red-500/10 text-red-500 cursor-pointer focus:bg-red-500/20 focus:text-red-500"
                      onClick={() => handleAction('delete', deployment.deploymentId)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
