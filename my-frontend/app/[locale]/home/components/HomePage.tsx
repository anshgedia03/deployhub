"use client";

import { DialogBox } from "@/components/common/dialog-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/contexts/ToastContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, List, Plus, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { useTranslations } from "next-intl";
import { ProjectCard } from "./ProjectCard";
import { ProjectListItem } from "./ProjectListItem";

const validateProjectName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Project name cannot be empty or only whitespaces.";
  if (trimmed.length > 30) return "Project name cannot exceed 30 characters.";
  if (!/[a-zA-Z]/.test(trimmed)) return "Project name must contain at least one letter and cannot be only numbers.";
  return null;
};


export default function Page() {
  const t = useTranslations("Home");
  const [showBanner, setShowBanner] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    projects,
    isLoading,
    createProject,
    fetchProjects: fetchStoreProjects
  } = useProjectStore();

  const isFirstRender = useRef(true);

  useEffect(() => {
    // 1. Handle Search: If not the first render, any change to debouncedSearchQuery 
    // (including clearing to "") should trigger a fetch.
    if (!isFirstRender.current) {
      fetchStoreProjects(debouncedSearchQuery);
      return;
    }

    // 2. Handle Initial Load: Only trigger if projects haven't been fetched yet.
    if (!useProjectStore.getState().isInitialFetched) {
      fetchStoreProjects();
    }

    isFirstRender.current = false;
  }, [debouncedSearchQuery, fetchStoreProjects]);

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => createProject(data.name),
    onSuccess: () => {
      setNewProjectName("");
      setIsCreateDialogOpen(false);
      setCreateError(null);
      showToast("Project created successfully", "success");
    },
    onError: () => {
      setCreateError("Failed to create project. Please try again.");
    }
  });

  const handleCreateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newProjectName.trim();

    const validationError = validateProjectName(name);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    if (projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setCreateError(`Project with name "${name}" already exists.`);
      return;
    }

    createMutation.mutate({ name });
  };

  const handleOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setNewProjectName("");
      setCreateError(null);
    }
  };

  // We now fetch projects directly from the server based on search query
  const displayProjects = projects;

  return (
    <div className="space-y-8 border border-border rounded-xl p-2 md:p-4 mb-2 bg-primary-foreground h-full overflow-y-auto">
      {showBanner && (
        <div className="relative overflow-hidden p-4 sm:p-6 rounded-sm" style={{ background: 'linear-gradient(270.26deg, #9D6BFF 0%, #6F4DC8 18.34%, #352D8C 71.63%, #200134 100.37%)' }}>
          <div className="absolute pointer-events-none w-80 h-64" style={{ width: '320px', height: '100%', transform: 'rotate(40deg)', background: '#FF00A6', filter: 'blur(50px)', top: '0%', bottom: '0%', right: '20%', borderRadius: '50%' }}></div>
          <div className="relative z-10">
            <div className="relative z-10">
              <div className="flex items-start sm:items-center justify-between mb-2">
                <h1 className="text-white text-xl sm:text-2xl font-semibold">{t("bannerTitle")}</h1>
                <button onClick={() => setShowBanner(false)} className="text-white hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/90 text-sm sm:text-base">{t("bannerDescription")}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border sm:gap-0">
        <div className="flex items-center gap-3">
          <div data-tour="home-view-toggle">
            <div className="flex items-center gap-2 mx-4">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-gray-200" : "hover:bg-gray-100"}`}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                  <path d="M4 0H1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1m0 4H1V1h3zm6-4H7a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1m0 4H7V1h3zM4 6H1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1m0 4H1V7h3zm6-4H7a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1m0 4H7V7h3z" fill="currentColor"></path>
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-gray-200" : "hover:bg-gray-100"}`}
              >
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4">
                  <path d="M11 5.5H1a1 1 0 0 0-1 1V9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1M11 9H1V6.5h10zm0-9H1a1 1 0 0 0-1 1v2.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1m0 3.5H1V1h10z" fill="currentColor"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div data-tour="home-search">
            <div className="relative w-full sm:w-64">
              <div className="flex items-center border border-border hover:border-gray-400 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors rounded-md px-3 py-1 bg-transparent h-10">
                <Search size={16} className="text-muted-foreground mr-2" />
                <input
                  placeholder={t("searchPlaceholder")}
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground h-full text-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div data-tour="home-new-project">
            <DialogBox
              isOpen={isCreateDialogOpen}
              onOpenChange={handleOpenChange}
              componentForTrigger={
                <button 
                  className="inline-flex items-center justify-center rounded-[8px] text-sm font-medium transition-colors bg-[#8652e0] hover:bg-[#8652e0]/90 text-white h-10 px-4 w-full sm:w-auto" 
                  type="button"
                >
                  <Plus size={16} className="mr-2" />
                  {t("newProject")}
                </button>
              }
              dialogTitle={t("createProjectTitle")}
              onSubmit={handleCreateProject}
              componentForDialogContent={
                <div className="py-4 flex flex-col gap-2">
                  <Input
                    placeholder={t("projectNamePlaceholder")}
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                      if (createError) setCreateError(null);
                    }}
                    className={`h-10 text-base w-full ${createError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    autoFocus
                  />
                  {createError && (
                    <p className="text-xs text-red-500 font-medium px-1">
                      {createError}
                    </p>
                  )}
                </div>
              }
              componentForClosedDialog={<Button variant="outline">{t("cancel")}</Button>}
              componentForDialogFooter={
                <Button type="submit" disabled={createMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                  {createMutation.isPending ? t("creating") : t("create")}
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <div className="-mt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 animate-pulse bg-gray-100 rounded-sm" />
            ))}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {displayProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    t={t}
                  />
                ))}

                {/* New Project Placeholder Grid */}
                <DialogBox
                  isOpen={isCreateDialogOpen}
                  onOpenChange={handleOpenChange}
                  componentForTrigger={
                    <div className="hover:bg-background-selected max-h-56 rounded-sm p-2 flex items-center justify-center shadow-sm border border-border hover:shadow-sm transition-shadow cursor-pointer group">
                      <div className="w-full aspect-square flex flex-col gap-8 items-center justify-center">
                        <div className="p-4 bg-primary-light rounded-full">
                          <Plus className="w-8 h-8 text-foreground" />
                        </div>
                        <h3 className="font-medium text-gray-800">{t("newProject")}</h3>
                      </div>
                    </div>
                  }
                  dialogTitle={t("createProjectTitle")}
                  onSubmit={handleCreateProject}
                  componentForDialogContent={
                    <div className="py-4 flex flex-col gap-2">
                      <Input
                        placeholder={t("projectNamePlaceholder")}
                        value={newProjectName}
                        onChange={(e) => {
                          setNewProjectName(e.target.value);
                          if (createError) setCreateError(null);
                        }}
                        className={`h-10 text-base w-full ${createError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        autoFocus
                      />
                      {createError && (
                        <p className="text-xs text-red-500 font-medium px-1">
                          {createError}
                        </p>
                      )}
                    </div>
                  }
                  componentForClosedDialog={
                    <Button variant="outline" className="p-4 text-base font-semibold">{t("cancel")}</Button>
                  }
                  componentForDialogFooter={
                    <Button type="submit" disabled={createMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                      {createMutation.isPending ? t("creating") : t("create")}
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-3">
                {displayProjects.map((project) => (
                  <ProjectListItem
                    key={project._id}
                    project={project}
                    t={t}
                  />
                ))}

                {/* New Project Placeholder List */}
                <DialogBox
                  isOpen={isCreateDialogOpen}
                  onOpenChange={handleOpenChange}
                  componentForTrigger={
                    <Card id="tour-home-new-project" className="border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer group">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <Plus size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium">{t("createProjectTitle")}</p>
                          <p className="text-gray-500 text-sm">{t("startNewProject")}</p>
                        </div>
                      </CardContent>
                    </Card>
                  }
                  dialogTitle={t("createProjectTitle")}
                  onSubmit={handleCreateProject}
                  componentForDialogContent={
                    <div className="py-4 flex flex-col gap-2">
                      <Input
                        placeholder={t("projectNamePlaceholder")}
                        value={newProjectName}
                        onChange={(e) => {
                          setNewProjectName(e.target.value);
                          if (createError) setCreateError(null);
                        }}
                        className={`h-10 text-base w-full ${createError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        autoFocus
                      />
                      {createError && (
                        <p className="text-xs text-red-500 font-medium px-1">
                          {createError}
                        </p>
                      )}
                    </div>
                  }
                  componentForClosedDialog={
                    <Button variant="outline" className="w-full sm:w-auto text-base font-medium">{t("cancel")}</Button>
                  }
                  componentForDialogFooter={
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="w-full sm:w-auto text-base font-medium bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {createMutation.isPending ? t("creating") : t("create")}
                    </Button>
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
