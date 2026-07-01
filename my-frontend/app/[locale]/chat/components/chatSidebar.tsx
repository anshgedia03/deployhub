"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, FileText, TextCursorInput, FolderMinus, Plus, MessageCircleMore, EllipsisVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { type AttachedFileType } from "./ChatPage";
import { ChatSession } from "@/lib/api/services/chat";
import { DocumentAsset } from "@/lib/api/services/document";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/contexts/ToastContext";
import { useProjectStore } from "@/store/useProjectStore";

interface ChatSidebarProps {
    projectId: string;
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    files: DocumentAsset[];
    onSelectSession: (session: ChatSession) => void;
    onNewSession: () => void;
    onRenameSession: (id: string, newName: string) => void;
    onDeleteRequest: (type: "session" | "file", name: string, id?: string) => void;
    onFileSelected: (file: AttachedFileType) => void;
    onFileUpload?: () => void;
    onSearch?: (term: string) => void;
    isOpen?: boolean;
}

export function ChatSidebar({
    sessions,
    currentSession,
    files,
    onSelectSession,
    onNewSession,
    onRenameSession,
    onDeleteRequest,
    onFileSelected,
    onSearch,
    isOpen
}: ChatSidebarProps) {
    const t = useTranslations("Chat");
    const { showToast } = useToast();
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const isFirstSearchRef = useRef(true);

    const currentProject = useProjectStore(state => state.currentProject);

    useEffect(() => {
        // Skip the initial empty search to avoid redundant fetch on mount
        if (isFirstSearchRef.current && searchTerm === "") {
            isFirstSearchRef.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            if (onSearch) {
                onSearch(searchTerm);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, onSearch]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024, sizes = ["Bytes", "Kb", "Mb", "Gb"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
    };

    const isActionLoading = useProjectStore(state => state.isActionLoading);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected({ name: file.name, size: formatFileSize(file.size), raw: file });
        }
    };

    const startRename = (session: ChatSession) => {
        setRenamingId(session._id);
        setRenameValue(session.title);
    };

    const submitRename = async (id: string, originalTitle: string) => {
        const trimmedValue = renameValue.trim().replace(/[\u3164\u200B\u200C\uFEFF\s]/g, "");
        if (!trimmedValue || trimmedValue === " ") {
            showToast("Session name cannot be empty", "error");
            setRenamingId(null);
            return;
        }

        if (trimmedValue === originalTitle) {
            setRenamingId(null);
            return;
        }

        try {
            await onRenameSession(id, trimmedValue);
            showToast("Session renamed successfully", "success");
        } catch (error: any) {
            console.error("Failed to rename session", error);
            showToast(error.response.data.message, "error");
        }
        setRenamingId(null);
    };

    return (
        <aside
            ref={sidebarRef}
            id="tour-chat-sidebar"
            className={cn(
                "w-64 shadow-sm p-4 flex flex-col rounded-lg border border-border bg-background-child",
                "fixed inset-y-2 left-2 z-50 transition-transform duration-300 transform lg:static lg:transform-none lg:inset-auto lg:h-full",
                "h-[calc(100vh-16px)]",
                isOpen ? "translate-x-0" : "-translate-x-[110%] lg:translate-x-0"
            )}
        >
            {/* Header with Project Name and Search */}
            <div className="pb-4 space-y-2 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 truncate pr-2">
                        {currentProject?.name || t("sessions")}
                    </h2>
                    <button
                        onClick={onNewSession}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={t("newChat")}
                    >
                        <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
                <div className="relative flex items-center bg-[#E7E7E7] rounded-md px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <Search className="w-5 h-5 text-foreground mr-2 shrink-0" />
                    <input
                        type="text"
                        placeholder={t("searchSessions")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-500"
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="py-2 flex flex-col flex-1 gap-1 overflow-y-auto max-h-52 custom-scrollbar">
                {sessions.map((session) => (
                    <div
                        key={session._id}
                        onClick={() => onSelectSession(session)}
                        className={cn(
                            "p-2 rounded relative group cursor-pointer transition-colors",
                            currentSession?._id === session._id
                                ? "bg-background-selected"
                                : "hover:bg-background-selected/50"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0" aria-label={session.title}>
                                <MessageCircleMore
                                    className={cn(
                                        "w-4 h-4 shrink-0",
                                        currentSession?._id === session._id ? "text-gray-800" : "text-gray-500"
                                    )}
                                />
                                {renamingId === session._id ? (
                                    <input
                                        autoFocus
                                        value={renameValue}
                                        disabled={isActionLoading}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onBlur={() => !isActionLoading && submitRename(session._id, session.title)}
                                        onKeyDown={(e) => e.key === "Enter" && !isActionLoading && submitRename(session._id, session.title)}
                                        className="text-sm font-medium bg-white border border-primary rounded px-1 w-full outline-none"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className={cn(
                                        "text-sm font-medium truncate",
                                        currentSession?._id === session._id ? "text-gray-800" : "text-gray-600"
                                    )}>
                                        {session.title}
                                    </span>
                                )}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1 rounded opacity-0 opacity-100 data-[state=open]:opacity-100 transition-opacity"
                                    >
                                        <EllipsisVertical className="w-4 h-4 text-gray-600" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-100 shadow-lg rounded-lg py-1">
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); startRename(session); }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <TextCursorInput className="w-4 h-4" /> {t("renameSession")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onDeleteRequest("session", session.title, session._id); }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                    >
                                        <FolderMinus className="w-4 h-4" /> {t("deleteSession")}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>

            {/* Files List */}
            <div className="py-4 border-t flex flex-col flex-1 gap-1 overflow-y-auto custom-scrollbar">
                <h2 className="font-semibold text-gray-900 mb-2">{t("files")}</h2>
                <div className="space-y-1">
                    {files.map((file) => (
                        <div
                            key={file._id}
                            onClick={() => onFileSelected({
                                name: file.originalFilename,
                                size: "",
                                url: file.cloudinaryUrl,
                                id: file._id
                            })}
                            className="p-2 hover:bg-background-selected rounded relative group cursor-pointer transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0" aria-label={file.originalFilename}>
                                    <FileText className="w-4 h-4 text-gray-800 shrink-0" />
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                        {file.originalFilename}
                                    </span>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                                        >
                                            <EllipsisVertical className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-100 shadow-lg rounded-lg py-1">
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onFileSelected({
                                                    name: file.originalFilename,
                                                    size: "",
                                                    url: file.cloudinaryUrl,
                                                    id: file._id
                                                });
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4" /> {t("selectFile")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteRequest("file", file.originalFilename, file._id);
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                        >
                                            <FolderMinus className="w-4 h-4" /> {t("deleteFile")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                    {files.length === 0 && (
                        <p className="text-xs text-gray-400 px-2 italic">{t("noFilesInSession")}</p>
                    )}
                </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
        </aside>
    );
}
