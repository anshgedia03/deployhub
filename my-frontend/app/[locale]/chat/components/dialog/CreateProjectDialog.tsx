"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { DialogBox } from "@/components/common/dialog-box";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const validateProjectName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return "Project name cannot be empty or only whitespaces.";
    if (trimmed.length > 60) return "Project name cannot exceed 60 characters.";
    if (!/[a-zA-Z]/.test(trimmed)) return "Project name must contain at least one letter and cannot be only numbers.";
    return null;
};

interface CreateProjectDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
    isOpen,
    onOpenChange
}: CreateProjectDialogProps) {
    const [newProjectName, setNewProjectName] = useState("");
    const [createProjectError, setCreateProjectError] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);

    const createProject = useProjectStore((state) => state.createProject);

    const handleCreateProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const name = newProjectName.trim();

        const validationError = validateProjectName(name);
        if (validationError) {
            setCreateProjectError(validationError);
            return;
        }

        setIsCreatingProject(true);
        try {
            const newProject = await createProject(name);
            if (newProject?._id) {
                // Project created & selected by the store, now auto-create a session
                await useProjectStore.getState().createSession(newProject._id);
                
            }
            handleOpenChange(false);
        } catch (error) {
            setCreateProjectError("Failed to create project. Please try again.");
        } finally {
            setIsCreatingProject(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
        if (!open) {
            setNewProjectName("");
            setCreateProjectError(null);
        }
    };

    return (
        <DialogBox
            isOpen={isOpen}
            onOpenChange={handleOpenChange}
            dialogTitle="Create New Project"
            onSubmit={handleCreateProjectSubmit}
            componentForDialogContent={
                <div className="py-4 flex flex-col gap-2">
                    <Input
                        placeholder="Enter project name"
                        value={newProjectName}
                        onChange={(e) => {
                            setNewProjectName(e.target.value);
                            if (createProjectError) setCreateProjectError(null);
                        }}
                        className={`h-10 text-base w-full ${
                            createProjectError ? "border-red-500 focus-visible:ring-red-500" : ""
                        }`}
                        autoFocus
                    />
                    {createProjectError && (
                        <p className="text-xs text-red-500 font-medium px-1">
                            {createProjectError}
                        </p>
                    )}
                </div>
            }
            componentForClosedDialog={<Button variant="outline">Cancel</Button>}
            componentForDialogFooter={
                <Button
                    type="submit"
                    disabled={isCreatingProject}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    {isCreatingProject ? "Creating..." : "Create Project"}
                </Button>
            }
        />
    );
}
