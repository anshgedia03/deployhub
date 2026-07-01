"use client";

import React from "react";
import { Search, FolderPlus, Upload, CheckCircle2, PanelLeft, ChevronLeft } from "lucide-react";
import { DialogBox } from "@/components/common/dialog-box";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { formatDistance } from "date-fns"
import { formatFileSize } from "@/utils/formatSize";

interface FileItem {
    id: string;
    name: string;
    type: 'project' | 'folder' | 'session' | 'file';
    url?: string;
    data?: any;
    updatedAt: string;
    chatSessions?: string[],
    createdAt: string
}

interface FileAreaProps {
    title: string;
    items: FileItem[];
    isLoading?: boolean;
    isActionLoading?: boolean;
    onToggleSidebar?: () => void;
    onBack?: () => void;
    onItemClick: (item: FileItem) => void;
    onCreateItem?: (name?: string) => void;
    createItemTitle?: string;
    onSearch?: (term: string) => void;
    searchTerm?: string;
    onSelectToggle?: () => void;
    isSelectionMode?: boolean;
    selectedIds?: string[];
    onItemSelect?: (id: string) => void;
    onFilterClick?: () => void;
    onDuplicate?: (item: FileItem) => void;
    emptyStateAction?: React.ReactNode;
    showUpload?: boolean;
}

export function FileArea({
    title,
    items,
    isLoading,
    isActionLoading,
    onToggleSidebar,
    onBack,
    onItemClick,
    onCreateItem,
    onSearch,
    searchTerm,
    isSelectionMode,
    selectedIds = [],
    onItemSelect,
    onSelectToggle,
    createItemTitle = "Create New Item",
    emptyStateAction,
    showUpload = false
}: FileAreaProps) {
    const t = useTranslations("FileManager");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [newItemName, setNewItemName] = React.useState("");
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    


    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newItemName.trim();

        if (!trimmedName) return;

        // Check for duplicate name locally
        const isDuplicate = items.some(item => item.name.toLowerCase() === trimmedName.toLowerCase());
        if (isDuplicate) {
            setErrorMessage(`An item with the name "${trimmedName}" already exists.`);
            return;
        }

        if (onCreateItem) {
            try {
                await onCreateItem(trimmedName);
                setIsCreateDialogOpen(false);
                setNewItemName("");
                setErrorMessage(null);
            } catch (error) {
                setErrorMessage("Failed to create item. Please try again.");
            }
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsCreateDialogOpen(open);
        if (!open) {
            setNewItemName("");
            setErrorMessage(null);
        }
    }

    return (
        <main className="w-full h-full shadow-sm p-4 flex flex-col rounded-lg border border-border bg-background-child overflow-hidden">
            {/* TOP TOOLBAR */}
            <div className="flex flex-col lg:flex-row w-full items-start lg:items-center pb-4 gap-4 lg:gap-2" id="tour-fm-toolbar">
                <div className="flex items-center gap-2 w-full lg:flex-1">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-1 rounded hover:bg-background-selected text-foreground shrink-0"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1 rounded hover:bg-background-selected text-foreground shrink-0 mr-1"
                        >
                            <ChevronLeft className="w-7 h-7" />
                        </button>
                    )}

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
                        <input
                            type="text"
                            placeholder={t("search")}
                            value={searchTerm}
                            onChange={(e) => onSearch?.(e.target.value)}
                            className="w-full bg-[#E7E7E7] border border-transparent rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:bg-white focus:border-primary transition-all placeholder:text-muted-foreground text-foreground shadow-sm"
                        />
                    </div>
                </div>

                <div id="tour-fm-actions" className="flex flex-wrap items-center justify-start lg:justify-end gap-2 w-full lg:w-auto">
                    {onCreateItem && (
                        <DialogBox
                            isOpen={isCreateDialogOpen}
                            onOpenChange={handleOpenChange}
                            dialogTitle={createItemTitle}
                            onSubmit={handleCreateSubmit}
                            componentForTrigger={
                                <button
                                    className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-muted text-sm font-medium text-foreground transition-colors whitespace-nowrap"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">{createItemTitle === "Create Folder" ? t("createFolder") : createItemTitle}</span>
                                </button>
                            }
                            componentForDialogContent={
                                <div className="py-4 flex flex-col gap-2">
                                    <Input
                                        placeholder={t("name")}
                                        value={newItemName}
                                        onChange={(e) => {
                                            setNewItemName(e.target.value);
                                            if (errorMessage) setErrorMessage(null);
                                        }}
                                        className={`h-10 text-base w-full ${errorMessage ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                        autoFocus
                                    />
                                    {errorMessage && (
                                        <p className="text-xs text-red-500 font-medium px-1">
                                            {errorMessage}
                                        </p>
                                    )}
                                </div>
                            }
                            componentForClosedDialog={<Button variant="outline">{t("cancel")}</Button>}
                            componentForDialogFooter={
                                <Button type="submit" disabled={isActionLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
                                    {isActionLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    {t("create")}
                                </Button>
                            }
                        />
                    )}
                    {showUpload && (
                        <button id="tour-fm-upload" className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-muted text-sm font-medium text-foreground transition-colors whitespace-nowrap">
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("upload")}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto pb-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-2xl text-gray-900">{title === t("myProjects") ? "Folders" : title}</h2>
                    {isSelectionMode && selectedIds.length > 0 && (
                        <span className="text-sm font-medium text-primary">{selectedIds.length} items selected</span>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium animate-pulse">{t("loading") || "Loading..."}</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <p className="text-muted-foreground font-medium">
                            {title === t("myProjects") ? t("noProjectsFound") :
                                title === t("chatSessions") ? t("noChatSessionsFound") :
                                    t("noSessionsFound")}
                        </p>
                        {emptyStateAction}
                    </div>
                ) : (
                    <div id="tour-fm-projects" className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4 mb-8">
                        {items.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-2 cursor-pointer group"
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            onItemSelect?.(item.id);
                                        } else if (item.type === 'file' && item.url) {
                                            window.open(item.url, '_blank');
                                        } else {
                                            onItemClick(item);
                                        }
                                    }}
                                >
                                    <div
                                        className={`bg-background border rounded p-4 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 aspect-[4/3] relative ${isSelected ? 'border-primary bg-primary/5' : 'border-border'
                                            }`}
                                    >
                                        <svg
                                            width="128"
                                            height="100"
                                            viewBox="0 0 128 100"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-full h-auto max-w-[100px]"
                                        >
                                            <path
                                                d="M11.174 100C5.003 100 0 95.167 0 89.205V6.169C0 2.76 2.859 0 6.385 0h13.103c1.86 0 3.67.568 5.173 1.625l8.992 6.315a9 9 0 0 0 5.172 1.625h68.05c3.526 0 6.385 2.762 6.385 6.169v8.624S57.485 100 11.174 100"
                                                fill={isSelected ? "hsl(var(--primary))" : "#b98bf8"}
                                            />
                                            <path
                                                d="M127.939 30.524v58.678c0 2.981-1.25 5.68-3.272 7.634-2.023 1.953-4.816 3.161-7.902 3.161H11.173c6.171 0 11.174-4.833 11.174-10.795V30.524c0-3.407 2.859-6.169 6.385-6.169h92.822c3.527 0 6.385 2.762 6.385 6.169"
                                                fill={isSelected ? "hsl(var(--primary) / 0.8)" : "#d6bbfb"}
                                            />
                                        </svg>

                                        {isSelectionMode && (
                                            <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                                                }`}>
                                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-between gap-0.5 px-1">
                                        <div className="flex justify-between items-center">
                                            <p className={`font-semibold truncate max-w-[150px] ${isSelected ? 'text-primary' : 'text-foreground'}`}>{item.name}</p>
                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                                {item.type === 'session' ? (item.data.attachmentCount || 0) : (item.data.chatSessionIds?.length ?? 0)} {item.type === 'session' ? 'Files' : 'Sessions'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            <div className="flex gap-1">
                                                {item.type==='project' && <span>{ item.data.documentsCount && formatFileSize(item.data.totalDocumentsSize) === '0' ? null : formatFileSize(item.data.totalDocumentsSize) } {item.data.totalDocumentsSize > 0 && '•'}</span>}
                                                {item.type==='session' && <span>{ item.data.attachmentCount && formatFileSize(item.data.totalAttachmentSize) === '0' ? null : formatFileSize(item.data.totalAttachmentSize) } {item.data.totalAttachmentSize > 0 && '•'}</span>}
                                                <span> {formatDistance(item.updatedAt ?? item.createdAt, Date.now(), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
