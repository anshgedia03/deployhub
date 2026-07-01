"use client";

import { useState, useEffect } from "react";
import { FileSidebar } from "@/app/[locale]/file-manager/components/fileSidebar";
import { FileArea } from "@/app/[locale]/file-manager/components/fileArea";
import { TimelinesFilesView } from "@/app/[locale]/file-manager/components/timelineFileViews";
import { useProjectStore } from "@/store/useProjectStore";
import { useFileManagerStore } from "@/store/useFileManagerStore";

import { useTranslations } from "next-intl";

export default function FileManagerPage() {
    const t = useTranslations("FileManager");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { view, setView } = useFileManagerStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);
    
    const { 
        projects,
        sessions, 
        currentProject,
        currentSession,
        isLoading,
        isSessionsLoading,
        isActionLoading,
        fetchProjects,
        fetchSessions,
        selectProject,
        createProject,
        duplicateProject,
        selectSession,
    } = useProjectStore();

    useEffect(() => {
        if (view === "projects") {
            fetchProjects(debouncedSearchTerm);
        } else if (view === "sessions" && currentProject) {
            fetchSessions(currentProject._id, undefined, debouncedSearchTerm);
        }
    }, [view, currentProject?._id, debouncedSearchTerm, fetchProjects, fetchSessions]);

    const handleCreateProject = async (name?: string) => {
        if (name) {
            await createProject(name);
        }
    };

    const handleItemSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds([]);
    };

    const displayItems = (items: any[]) => items;

    return (
        <div  className="flex h-[calc(100dvh-78px)] gap-1 overflow-hidden relative">
                
            {/* Sidebar with all navigation triggers */}
            <FileSidebar
                onSelectProject={() => setView("sessions")}
                onSelectSession={() => setView("files")}
                isOpen={isSidebarOpen}
            />

            <div className="flex-1 h-full overflow-hidden">
                {/* Level 1: List Projects */}
                {view === "projects" && (
                    <FileArea
                        title={t("myProjects")}
                        items={displayItems(projects.map(p => ({ 
                            id: p._id, 
                            name: p.name, 
                            type: 'project', 
                            data: p,
                            createdAt: p.createdAt,
                            updatedAt: p.updatedAt
                        })))}
                        isLoading={isLoading}
                        isActionLoading={isActionLoading}
                        searchTerm={searchTerm}
                        onSearch={setSearchTerm}
                        onCreateItem={handleCreateProject}
                        createItemTitle={t("createProject")}
                        isSelectionMode={isSelectionMode}
                        onSelectToggle={toggleSelectionMode}
                        selectedIds={selectedIds}
                        onItemSelect={handleItemSelect}
                        onDuplicate={(item) => duplicateProject(item.id)}
                        onItemClick={(item) => {
                            selectProject(item.data);
                            setView("sessions");
                        }}
                    />
                )}

                {/* Level 3: List Sessions inside "Chat Sessions" folder */}
                {view === "sessions" && currentProject && (
                    <FileArea
                        title={t("chatSessions")}
                        items={displayItems(sessions.map(s => ({ 
                            id: s._id, 
                            name: s.title, 
                            type: 'session', 
                            data: s,
                            createdAt: s.createdAt,
                            updatedAt: s.updatedAt
                        })))}
                        isLoading={isSessionsLoading}
                        isActionLoading={isActionLoading}
                        onBack={() => setView("projects")}
                        searchTerm={searchTerm}
                        onSearch={setSearchTerm}
                        isSelectionMode={isSelectionMode}
                        onSelectToggle={toggleSelectionMode}
                        selectedIds={selectedIds}
                        onItemSelect={handleItemSelect}
                        onDuplicate={(item) => duplicateProject(item.id)}
                        onItemClick={(item) => {
                            selectSession(item.data);
                            setView("files");
                        }}
                    />
                )}

                {/* Level 4: List Files in the selected Session */}
                {view === "files" && currentSession && (
                    <TimelinesFilesView
                        onToggleSidebar={() => setIsSidebarOpen(true)}
                        onBackToSession={() => setView("sessions")}
                        session={currentSession}
                    />
                )}
            </div>
        </div>
    );
}