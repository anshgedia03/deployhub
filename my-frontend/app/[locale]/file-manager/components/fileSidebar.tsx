"use client";

import { useState } from "react";
import {
    Search,
    Folder,
    FolderOpen,
    ChevronDown,
    ChevronRight,
    MessageSquare,
    MessageCircleMore,
    BarChart2
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { ChatSession } from "@/lib/api/services/chat";
import { Project } from "@/lib/api/services/project";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface FileSidebarProps {
    onSelectProject?: (project: Project) => void;
    onSelectSession?: (session: ChatSession) => void;
    // Navigation triggers for the main view area
    onOpenChatSession?: () => void;
    onOpenFolders?: () => void;
    onOpenTimelines?: () => void;   
    isOpen?: boolean;
}

export function FileSidebar({
    onSelectProject,
    onSelectSession,
    onOpenChatSession,
    onOpenFolders,
    onOpenTimelines,
    isOpen
}: FileSidebarProps) {
    const t = useTranslations("FileManager");
    const { projects, sessions, selectProject, selectSession } = useProjectStore();

    const [expandedProj, setExpandedProj] = useState<string | null>(null);
    const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <aside 
            className={cn(
                "w-64 h-[calc(100vh-32px)] lg:h-full shadow-sm p-4 flex flex-col rounded-lg border border-border bg-background-child",
                "fixed inset-y-4 left-2 z-50 transition-transform duration-300 transform lg:static lg:transform-none",
                isOpen ? "translate-x-0" : "-translate-x-[110%] lg:translate-x-0"
            )}
        >

            {/* Header & Search */}
            <div className="pb-4 border-b space-y-2">
                <h2 className="font-semibold text-gray-900">{t("files")}</h2>
                <div className="relative flex items-center bg-[#E7E7E7] rounded-md px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Search className="w-5 h-5 text-foreground mr-2 shrink-0" strokeWidth={2} />
                    <input
                        type="text"
                        placeholder={t("search")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-500 text-slate-900"
                    />
                </div>
            </div>

            {/* Folders List */}
            <div className="py-2 flex flex-col flex-1 gap-1 overflow-y-auto custom-scrollbar pr-1">
                <nav className="space-y-1">
                    {filteredProjects.map((project) => {
                        const isProjExpanded = expandedProj === project._id;
                        const isFolderExpanded = expandedFolder === project._id;

                        return (
                            <div key={project._id} className="flex flex-col gap-1">

                                {/* LEVEL 1: Main Project Folder */}
                                <button
                                    onClick={() => {
                                        setExpandedProj(isProjExpanded ? null : project._id);
                                        selectProject(project);
                                        if (onSelectProject) onSelectProject(project);
                                        if (onOpenFolders) onOpenFolders();
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left cursor-pointer",
                                        isProjExpanded 
                                            ? "bg-background-selected/50 text-slate-900" 
                                            : "hover:bg-background-selected text-slate-700"
                                    )}
                                >
                                    <div className="shrink-0">
                                        {isProjExpanded ? (
                                            <FolderOpen className="w-5 h-5" strokeWidth={2} />
                                        ) : (
                                            <Folder className="w-5 h-5" strokeWidth={2} />
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold truncate flex-1">
                                        {project.name}
                                    </span>
                                </button>

                                {/* LEVEL 2: Chat Sessions Category */}
                                {isProjExpanded && (
                                    <div className="flex flex-col gap-1 mt-1">
                                        <button
                                            onClick={() => {
                                                setExpandedFolder(isFolderExpanded ? null : project._id);
                                                if (onOpenChatSession) onOpenChatSession();
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-2 py-1 rounded-lg transition-all text-left cursor-pointer",
                                                isFolderExpanded 
                                                    ? "bg-background-selected/50 text-slate-900" 
                                                    : "hover:bg-background-selected text-slate-700"
                                            )}
                                        >
                                            <div className="ml-4 shrink-0">
                                                {isFolderExpanded ? (
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                                ) : (
                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                                )}
                                            </div>
                                            <div className="shrink-0">
                                                <MessageCircleMore className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-semibold flex-1">
                                                {t("chatSession")}
                                            </span>
                                        </button>

                                        {/* LEVEL 3: Individual Dynamic Sessions */}
                                        {isFolderExpanded && (
                                            <div className="flex flex-col gap-1">
                                                {sessions.length > 0 ? (
                                                    sessions.map((session) => {
                                                        const isSelected = selectedSessionId === session._id;

                                                        return (
                                                            <button
                                                                key={session._id}
                                                                onClick={() => {
                                                                    setSelectedSessionId(session._id);
                                                                    selectSession(session);
                                                                    if (onSelectSession) onSelectSession(session);
                                                                    if (onOpenTimelines) onOpenTimelines();
                                                                }}
                                                                className={cn(
                                                                    "w-full flex items-center gap-2 px-2 py-1 rounded-lg transition-all text-left cursor-pointer",
                                                                    isSelected 
                                                                        ? "bg-background-selected text-slate-900" 
                                                                        : "hover:bg-background-selected text-slate-700"
                                                                )}
                                                            >
                                                                <div className="ml-12 shrink-0">
                                                                    <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="!size-5 fill-current">
                                                                        <path d="M46.6355 40.8062H45.8027V8.32656C45.8027 7.66394 45.5395 7.02845 45.071 6.5599C44.6024 6.09135 43.9669 5.82812 43.3043 5.82812H31.6449C30.9823 5.82812 30.3468 6.09135 29.8783 6.5599C29.4097 7.02845 29.1465 7.66394 29.1465 8.32656V15.8219H19.9855C19.3229 15.8219 18.6874 16.0851 18.2189 16.5536C17.7503 17.0222 17.4871 17.6577 17.4871 18.3203V25.8156H9.9918C9.32917 25.8156 8.69368 26.0789 8.22513 26.5474C7.75659 27.0159 7.49336 27.6514 7.49336 28.3141V40.8062H6.66055C5.99792 40.8062 5.36243 41.0695 4.89388 41.538C4.42534 42.0066 4.16211 42.6421 4.16211 43.3047C4.16211 43.9673 4.42534 44.6028 4.89388 45.0713C5.36243 45.5399 5.99792 45.8031 6.66055 45.8031H46.6355C47.2982 45.8031 47.9337 45.5399 48.4022 45.0713C48.8708 44.6028 49.134 43.9673 49.134 43.3047C49.134 42.6421 48.8708 42.0066 48.4022 41.538C47.9337 41.0695 47.2982 40.8062 46.6355 40.8062ZM34.1434 10.825H40.8059V40.8062H34.1434V10.825ZM22.484 20.8187H29.1465V40.8062H22.484V20.8187ZM12.4902 30.8125H17.4871V40.8062H12.4902V30.8125Z"></path>
                                                                    </svg>
                                                                </div>
                                                                <span className="text-sm font-semibold truncate flex-1">
                                                                    {session.title}
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="ml-12 px-2 py-1 text-xs text-slate-400 italic font-medium">
                                                        {t("noSessionsFound")}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}