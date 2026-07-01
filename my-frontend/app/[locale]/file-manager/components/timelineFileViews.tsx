"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Search, Upload, PanelLeft, MoreVertical, FileText, Download, Trash2, ChevronLeft,
    Image as ImageIcon, FileCode, FileSpreadsheet, File as FileIcon
} from "lucide-react";
import { ChatSession } from "@/lib/api/services/chat";
import { documentService, DocumentAsset } from "@/lib/api/services/document";
import { useTranslations } from "next-intl";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useToast } from "@/contexts/ToastContext";
import { formatDistance } from "date-fns";
import { formatFileSize } from "@/utils/formatSize";

export function TimelinesFilesView({ onToggleSidebar, onBackToSession, session }: { onToggleSidebar: () => void, onBackToSession: () => void, session: ChatSession }) {
    const t = useTranslations("FileManager");
    const { showToast } = useToast();
    const [files, setFiles] = useState<DocumentAsset[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchFiles = async (showInitialLoader = false) => {
        if (!session?._id) return;
        if (showInitialLoader) setIsInitialLoading(true);
        try {
            const docs = await documentService.getSessionDocuments(session._id, debouncedSearchTerm);
            setFiles(docs);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(true);
    }, [session?._id, debouncedSearchTerm]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session?._id) return;

        try {
            setIsActionLoading(true);
            await documentService.uploadDocument(file, session._id);
            showToast(t("fileUploaded"), "success");
            await fetchFiles();
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsActionLoading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleDelete = async (docId: string) => {
        setIsDeletingId(docId);
        setIsActionLoading(true);
        try {
            await documentService.deleteDocument(docId);
            setFiles(prev => prev.filter(f => f._id !== docId));
        } catch (error) {
            console.error("Failed to delete document", error);
        } finally {
            setIsDeletingId(null);
            setIsActionLoading(false);
        }
    };

   

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
        if (mimeType.includes('csv') || mimeType.includes('spreadsheet') || mimeType.includes('excel'))
            return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('python'))
            return <FileCode className="w-8 h-8 text-amber-500" />;
        return <FileIcon className="w-8 h-8 text-slate-400" />;
    };

    const renderPreview = (file: DocumentAsset) => {
        if (file.mimeType.startsWith('image/')) {
            return (
                <img
                    src={file.cloudinaryUrl}
                    alt={file.originalFilename}
                    className="w-full h-full object-cover"
                />
            );
        }
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-2">
                {getFileIcon(file.mimeType)}
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {file.mimeType.split('/')[1] || 'FILE'}
                </span>
            </div>
        );
    };

    return (
        <main className="w-full h-full shadow-sm p-4 flex flex-col rounded-lg border border-border bg-background-child overflow-hidden relative">
            {/* Subtle Action Loader (Top-Right) */}
            {isActionLoading && (
                <div className="absolute top-4 right-4 z-[60] flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[12px] font-bold text-foreground">{t("processing") || "Processing..."}</span>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
            />

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row w-full items-start lg:items-center pb-4 gap-4 lg:gap-2">
                <div className="flex items-center gap-2 w-full lg:flex-1">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden p-1 rounded hover:bg-background-selected text-foreground shrink-0"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={onBackToSession}
                        className="p-1 rounded hover:bg-background-selected text-foreground shrink-0 mr-1"
                        title="Back to Session"
                    >
                        <ChevronLeft className="w-7 h-7" />
                    </button>

                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
                        <input
                            type="text"
                            placeholder={t("search")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#E7E7E7] border border-transparent rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:bg-white focus:border-primary transition-all placeholder:text-muted-foreground text-foreground shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-muted text-sm font-medium text-foreground transition-colors whitespace-nowrap"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">{t("upload")}</span>
                    </button>
                </div>
            </div>

            {/* All Files Grid */}
            <div className="flex-1 overflow-y-auto">
                <h2 className="font-semibold text-2xl text-gray-900 mb-4">{t("allFiles")}</h2>

                {isInitialLoading && files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground font-medium animate-pulse">{t("loading")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
                        {files.map((file) => (
                            <div key={file._id} className="flex flex-col gap-2 cursor-pointer group">
                                {/* File Thumbnail Container */}
                                <div
                                    onClick={() => window.open(file.cloudinaryUrl, '_blank')}
                                    className="bg-background border border-border rounded p-0 aspect-[4/3] flex items-center justify-center overflow-hidden relative group-hover:shadow-md transition-all"
                                >
                                    {renderPreview(file)}
                                </div>

                                {/* File Info */}
                                <div className="flex items-start justify-between px-0.5">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate pr-2" title={file.originalFilename}>{file.originalFilename}</p>
                                        <span className="flex items-baseline gap-1 text-[11px] text-muted-foreground">
                                        <p>{formatFileSize(file.size)} &bull; </p>
                                        <p>{formatDistance(file.createdAt!, Date.now(), { addSuffix: true})}</p>
                                        </span>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 outline-none"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 bg-white border border-border shadow-lg rounded-md py-1.5">
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={file.cloudinaryUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-muted transition-colors outline-none cursor-pointer"
                                                >
                                                    <Download className="w-4 h-4 text-muted-foreground" /> {t("download")}
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => { handleDelete(file._id); }}
                                                disabled={isDeletingId === file._id}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-destructive hover:bg-destructive/5 transition-colors outline-none cursor-pointer disabled:opacity-50"
                                            >
                                                {isDeletingId === file._id ? (
                                                    <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                {t("deleteFile")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                        {files.length === 0 && (
                            <p className="col-span-full text-muted-foreground text-sm italic">{t("noFilesInSession")}</p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
