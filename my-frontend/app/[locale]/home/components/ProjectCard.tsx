"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useMutation } from "@tanstack/react-query";
import { Folder, MoreHorizontal, Edit2, Copy, Trash2 } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { Project } from "@/lib/api/services/project";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DialogBox } from "@/components/common/dialog-box";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const validateProjectName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Project name cannot be empty or only whitespaces.";
  if (trimmed.length > 30) return "Project name cannot exceed 30 characters.";
  if (!/[a-zA-Z]/.test(trimmed)) return "Project name must contain at least one letter and cannot be only numbers.";
  return null;
};

export function ProjectCard({ project, t }: { project: Project; t: any }) {
  const router = useRouter();
  const { selectProject, updateProject, deleteProject, duplicateProject } = useProjectStore();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const handleProjectClick = () => {
    selectProject(project);
    router.push("/dashboard");
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project._id),
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      showToast("Project deleted successfully", "success");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (name: string) => updateProject(project._id, name),
    onSuccess: () => {
      setIsRenameDialogOpen(false);
      showToast("Project updated successfully", "success");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateProject(project._id),
    onSuccess: () => {
      showToast("Project duplicated successfully", "success");
    },
  });

  const handleRename = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = renameValue.trim();

    if (name === project.name) {
      setIsRenameDialogOpen(false);
      setRenameError(null);
      return;
    }

    const validationError = validateProjectName(name);
    if (validationError) {
      setRenameError(validationError);
      return;
    }

    updateMutation.mutate(name);
  };

  const handleDeleteProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    deleteMutation.mutate();
  };

  return (
    <>
      <div data-tour="home-project-card" onClick={handleProjectClick}>
        <div className="relative">
          <div className="bg-background-child rounded-sm p-2 shadow-sm border border-border hover:shadow-sm max-h-56 transition-shadow cursor-pointer">
            <div
              className="w-full relative rounded-sm flex aspect-square items-center justify-center max-h-44"
              style={{ background: 'linear-gradient(135deg, rgb(158, 119, 237) 0%, rgb(49, 27, 96) 100%)' }}
            >
              <Folder
                size={40}
                className="absolute top-[8%] left-[8%] text-white fill-white"
                strokeWidth={2}
              />
            </div>
            <div className="flex items-center justify-between m-2">
              <h3 className="font-medium text-gray-900 truncate flex-1" aria-label={project.name}>
                {project.name}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 hover:bg-background-selected rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenameDialogOpen(true); }} className="cursor-pointer">
                    <Edit2 size={14} className="mr-2" /> {t("rename")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(); }} disabled={duplicateMutation.isPending} className="cursor-pointer">
                    <Copy size={14} className="mr-2" /> {duplicateMutation.isPending ? t("duplicating") : t("duplicate")}
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 size={14} className="mr-2" /> {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <DialogBox
        isOpen={isRenameDialogOpen}
        onOpenChange={(open) => {
          setIsRenameDialogOpen(open);
          if (!open) setRenameError(null);
        }}
        dialogTitle="Rename Project"
        onSubmit={handleRename}
        componentForDialogContent={
          <div className="py-4 flex flex-col gap-2">
            <Input 
              value={renameValue} 
              onChange={(e) => {
                setRenameValue(e.target.value);
                if (renameError) setRenameError(null);
              }} 
              className={`h-10 text-base w-full ${renameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              autoFocus 
            />
            {renameError && (
              <p className="text-xs text-red-500 font-medium px-1">
                {renameError}
              </p>
            )}
          </div>
        }
        componentForClosedDialog={<Button variant="outline">{t("cancel")}</Button>}
        componentForDialogFooter={
          <Button type="submit" disabled={updateMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
            {updateMutation.isPending ? t("saveChanges") : t("save")}
          </Button>
        }
      />

      <DialogBox
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        dialogTitle={t("deleteProject")}
        onSubmit={handleDeleteProject}
        componentForDialogContent={
          <div className="py-4 text-sm text-gray-600">
            {t("deleteConfirm")} <span className="font-semibold text-gray-900">{project.name}</span>?
          </div>
        }
        componentForClosedDialog={<Button variant="outline">{t("cancel")}</Button>}
        componentForDialogFooter={
          <Button type="submit" disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
            {deleteMutation.isPending ? t("deleting") : t("delete")}
          </Button>
        }
      />
    </>
  );
}
