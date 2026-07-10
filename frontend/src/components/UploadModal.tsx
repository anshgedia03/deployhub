"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileArchive, CheckCircle, AlertCircle, Loader2, GitBranch, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiUrl, getAuthHeaders } from "@/config/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: (deploymentId?: string) => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [deployType, setDeployType] = useState<"zip" | "git">("zip");
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [envVars, setEnvVars] = useState("");
  const [showEnv, setShowEnv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const validateProjectName = (val: string) => {
    if (!val) {
      setNameError("Project name is required.");
      return false;
    }
    const regex = /^[a-z0-9_-]+$/;
    if (!regex.test(val)) {
      setNameError("Only lowercase alphanumeric characters, dashes (-), and underscores (_) are allowed.");
      return false;
    }
    setNameError(null);
    return true;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles.length > 0) {
      setError("Please upload a valid .zip file under 100MB.");
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const handleUpload = async () => {
    if (!file) return;
    if (!validateProjectName(projectName)) return;

    setUploadStatus("uploading");
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectName", projectName.trim());
    if (envVars.trim()) {
      formData.append("envVars", envVars.trim());
    }

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", getApiUrl("/deploy"), true);
      
      const authHeaders = getAuthHeaders();
      if (authHeaders.Authorization) {
        xhr.setRequestHeader("Authorization", authHeaders.Authorization);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStatus("success");
          setUploadProgress(100);
          const response = JSON.parse(xhr.responseText);
          toast.success("Upload successful! Project building started.");
          onClose(response.deploymentId);
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            setError(err.error || "Upload failed");
            toast.error(err.error || "Upload failed");
          } catch {
            setError("Upload failed");
            toast.error("Upload failed");
          }
          setUploadStatus("error");
        }
      };

      xhr.onerror = () => {
        setError("Network error occurred during upload.");
        toast.error("Network error occurred during upload.");
        setUploadStatus("error");
      };

      xhr.send(formData);
    } catch (err) {
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
      setUploadStatus("error");
    }
  };

  const handleGitDeploy = async () => {
    if (!validateProjectName(projectName)) return;
    if (!gitUrl.trim()) {
      setError("Git Repository URL is required.");
      return;
    }

    setUploadStatus("uploading");
    setError(null);
    setUploadProgress(30);

    try {
      const response = await fetch(getApiUrl("/deploy/github"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          gitUrl: gitUrl.trim(),
          branch: branch.trim() || "main",
          envVars: envVars.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger git deployment");
      }

      setUploadStatus("success");
      setUploadProgress(100);
      toast.success("Git deployment triggered successfully!");
      onClose(data.deploymentId);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      toast.error(err.message || "An unexpected error occurred.");
      setUploadStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setProjectName("");
    setGitUrl("");
    setBranch("main");
    setEnvVars("");
    setShowEnv(false);
    setError(null);
    setNameError(null);
    setUploadProgress(0);
    setUploadStatus("idle");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Deploy Project</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Provide a project name and source configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {uploadStatus === "idle" && (
            <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setDeployType("zip");
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  deployType === "zip"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                ZIP Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeployType("git");
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  deployType === "git"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Git Repository
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            {uploadStatus === "idle" && (
              <div className="space-y-1.5">
              <label htmlFor="projectName" className="text-sm font-medium text-zinc-300">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                placeholder="e.g. my-awesome-app"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  validateProjectName(e.target.value);
                }}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
              />
              {nameError && (
                <p className="text-xs text-red-500">{nameError}</p>
              )}
            </div>
          )}

          {uploadStatus === "idle" && (
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${deployType === "zip" && !file ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer mt-1
                    ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/50"}
                  `}
                >
                  <input {...getInputProps()} />
                  <UploadCloud className={`w-12 h-12 mb-4 ${isDragActive ? "text-blue-500" : "text-zinc-500"}`} />
                  <p className="text-sm font-medium text-center">
                    {isDragActive ? "Drop the ZIP file here" : "Drag & drop a ZIP file here, or click to select"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">Maximum file size: 100MB</p>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === "idle" && (
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${deployType === "git" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <label htmlFor="gitUrl" className="text-sm font-medium text-zinc-300">
                  Git Repository URL
                </label>
                <input
                  id="gitUrl"
                  type="text"
                  placeholder="https://github.com/username/repo.git"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="branch" className="text-sm font-medium text-zinc-300">
                  Branch
                </label>
                <div className="relative">
                  <input
                    id="branch"
                    type="text"
                    placeholder="main"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
                  />
                  <GitBranch className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

          {uploadStatus === "idle" && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
              <button
                type="button"
                onClick={() => setShowEnv(!showEnv)}
                className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-zinc-300 hover:bg-zinc-800/40 transition-colors"
              >
                <span>Environment Variables (.env)</span>
                <span className="text-xs text-zinc-500">{showEnv ? "Collapse" : "Expand"}</span>
              </button>
              {showEnv && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-955/40 space-y-2">
                  <p className="text-xs text-zinc-500">
                    Specify custom environment variables for your application container (e.g. <code>KEY=VALUE</code>).
                  </p>
                  <textarea
                    placeholder="DATABASE_URL=mongodb://...&#10;API_KEY=xyz123&#10;# This is a comment"
                    value={envVars}
                    onChange={(e) => setEnvVars(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 font-mono resize-y"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {deployType === "zip" && (file || uploadStatus !== "idle") && (
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded">
                  <FileArchive className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file?.name}</p>
                  <p className="text-xs text-zinc-500">
                    {file ? (file.size / (1024 * 1024)).toFixed(2) : "0"} MB
                  </p>
                </div>
                {uploadStatus === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              </div>

              {uploadStatus !== "idle" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-zinc-400">
                    <span>
                      {uploadStatus === "uploading" ? "Uploading..." : "Upload Complete"}
                    </span>
                    <span>{Math.min(uploadProgress, 100)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </div>
          )}

          {deployType === "git" && uploadStatus !== "idle" && (
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded">
                  <Terminal className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Cloning Git Repository</p>
                  <p className="text-xs text-zinc-500">
                    {gitUrl} ({branch})
                  </p>
                </div>
                {uploadStatus === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-zinc-400">
                  <span>
                    {uploadStatus === "uploading" ? "Connecting and cloning..." : "Cloning and verification complete"}
                  </span>
                  <span>{Math.min(uploadProgress, 100)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onClose()} disabled={uploadStatus === "uploading"}>
            Cancel
          </Button>
          {uploadStatus === "success" ? (
            <Button onClick={() => onClose()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Done
            </Button>
          ) : (
            <Button
              onClick={deployType === "zip" ? (file ? handleUpload : undefined) : handleGitDeploy}
              disabled={(deployType === "zip" ? !file : !gitUrl) || uploadStatus === "uploading"}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deploying
                </>
              ) : (
                "Deploy"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

