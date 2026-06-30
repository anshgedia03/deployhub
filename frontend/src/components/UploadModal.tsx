"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileArchive, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
import { getApiUrl } from "@/config/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: (deploymentId?: string) => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

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

    try {
      // Create a local XHR request to track progress
      const xhr = new XMLHttpRequest();
      xhr.open("POST", getApiUrl("/deploy"), true);

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
          // If we receive a deploymentId, we can bubble it up 
          // but for now we just handle it on "Done" click.
          // Let's pass it to onClose instead!
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

  const handleReset = () => {
    setFile(null);
    setProjectName("");
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
            Provide a project name and upload your application source code as a ZIP file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
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

          {uploadStatus === "idle" && !file && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
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
          )}

          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {(file || uploadStatus !== "idle") && (
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
              onClick={file ? handleUpload : undefined}
              disabled={!file || uploadStatus === "uploading"}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading
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
