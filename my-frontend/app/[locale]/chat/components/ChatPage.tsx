"use client";

import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/app/[locale]/chat/components/chatSidebar";
import { ChatArea } from "@/app/[locale]/chat/components/chatArea";
import { Clock, TrendingUp, PanelLeft } from "lucide-react";
import { usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useChatSession } from "@/hooks/use-chat-session";
import { useSessionDocuments } from "@/hooks/use-session-documents";
import { useTranslations } from "next-intl";
import { useProjectStore } from "@/store/useProjectStore";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { ModuleSelectionModal } from "./dialog/ModuleSelectionDialog";
import { CreateProjectDialog } from "./dialog/CreateProjectDialog";
import { DeleteConfirmationModal } from "./dialog/DeleteConfirmationDialog";

export type AttachedFileType = { name: string; size: string; raw?: File; url?: string; id?: string };
export type ModalType = { type: "session" | "file"; name: string; id?: string } | null;


export default function ChatPage() {
    const t = useTranslations("Chat");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFileType[]>([]);
    const [modal, setModal] = useState<ModalType>(null);

    // Create Project dialog state
    const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);

    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryClient = useQueryClient();
    const {
        projectId,
        sessions,
        currentSession,
        isLoading,
        isSessionsLoading,
        hasFetchedSessions,
        createSession,
        selectSession,
        renameSession,
        deleteSession,
        fetchSessions: onSearchSessions
    } = useChatSession();

    const isStoreLoading = useProjectStore(state => state.isLoading);

    const handleSelectSession = (session: any) => {
        selectSession(session);
        const params = new URLSearchParams(searchParams.toString());
        params.set("sessionId", session._id);
        if (projectId) {
            params.set("projectId", projectId);
        }
        const nextUrl = `${pathname}?${params.toString()}`;
        // Use pushState to avoid redundant RSC fetch on session selection
        window.history.pushState(null, '', nextUrl);
    };

    const fetchProjects = useProjectStore(state => state.fetchProjects);
    const projects = useProjectStore(state => state.projects);
    const selectProject = useProjectStore(state => state.selectProject);
    const deleteDocument = useProjectStore(state => state.deleteDocument);
    const { showToast } = useToast();

    const hasAttemptedAutoCreate = useRef<string | null>(null);

    // Auto-create session if project is selected but has no sessions
    useEffect(() => {
        const canAutoCreate = 
            projectId && 
            !isLoading && 
            !isStoreLoading && 
            !isSessionsLoading && 
            hasFetchedSessions &&
            sessions.length === 0 && 
            !currentSession;

        if (canAutoCreate) {
            if (hasAttemptedAutoCreate.current !== projectId) {
                hasAttemptedAutoCreate.current = projectId;
                createSession(projectId);
            }
        }
    }, [projectId, sessions, currentSession, isLoading, isStoreLoading, isSessionsLoading, hasFetchedSessions, createSession]);

    const { data: files = [] } = useSessionDocuments(currentSession?._id || null);

    const handleDeleteConfirm = async () => {

        if (modal?.type === "session" && modal.id) {
            try {
                await deleteSession(modal.id);
                showToast(t("sessionDeleted"), "success");
            } catch (error) {
                console.error("Failed to delete session", error);
            }
        } else if (modal?.type === "file" && modal.id) {
            try {
                await deleteDocument(modal.id);
                showToast(t("fileDeleted"), "success");
                handleFileUpload();
            } catch (error) {
                console.error("Failed to delete document", error);
            }
        }
        setModal(null);
    };

    // When there is no project, show Create Project dialog instead of module selection
    const handleNewSessionOrProjectTrigger = () => {
        if (!projectId) {
            setIsCreateProjectDialogOpen(true);
        } else {
            setIsModuleModalOpen(true);
        }
    };

    const handleModuleSelect = async (moduleName: string) => {
        try {
            setIsModuleModalOpen(false);

            let targetProjectId = projectId;

            // If no project is selected, try to select the first one
            if (!targetProjectId) {
                if (projects.length > 0) {
                    selectProject(projects[0]);
                    targetProjectId = projects[0]._id;
                } else {
                    // Fetch projects if not loaded
                    await fetchProjects();
                    const updatedProjects = useProjectStore.getState().projects;
                    if (updatedProjects.length > 0) {
                        selectProject(updatedProjects[0]);
                        targetProjectId = updatedProjects[0]._id;
                    }
                }
            }

            if (!targetProjectId) {
                showToast("no project is created", "error");
                return;
            }

            const newSession = await createSession(targetProjectId);
            
            if (newSession) {
                // select new session
                selectSession(newSession);
                
                // Refresh documents for the new session
                handleFileUpload(newSession._id);

                // update url params
                const params = new URLSearchParams(searchParams.toString());
                params.set("sessionId", newSession._id);
                params.set("projectId", targetProjectId);
                window.history.pushState(null, '', `${pathname}?${params.toString()}`);
            }
        } catch (error) {
            console.error("Failed to create session", error);
        }
    };

    const handleFileUpload = async (sessionId?: string) => {
        const id = sessionId || currentSession?._id;
        if (id) {
            queryClient.invalidateQueries({ queryKey: ['session-documents', id] });
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] sm:h-[calc(115dvh-5px)] md:h-[91dvh] gap-1 sm:gap-2 overflow-hidden relative">

            {/* Mobile Overlay Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-[40] lg:hidden backdrop-blur-sm transition-opacity cursor-pointer"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* The Left File Sidebar */}
            <ChatSidebar
                projectId={projectId || ""}
                sessions={sessions}
                currentSession={currentSession}
                files={files}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSessionOrProjectTrigger}
                onRenameSession={renameSession}
                onDeleteRequest={(type, name, id) => setModal({ type, name, id })}
                onFileSelected={(file) => setAttachedFiles(prev => [...prev, file])}
                onFileUpload={handleFileUpload}
                onSearch={onSearchSessions}
                isOpen={isSidebarOpen}
            />

            {/* The Main Chat Interface */}
            {projectId && currentSession ? (
                <ChatArea
                    projectId={projectId}
                    sessionId={currentSession._id}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                    attachedFiles={attachedFiles}
                    onClearFiles={() => setAttachedFiles([])}
                    onRemoveFile={(index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                    onFileSelected={(file) => setAttachedFiles(prev => [...prev, file])}
                    onFileUpload={handleFileUpload}
                    onNewChat={handleNewSessionOrProjectTrigger}
                    onMessageSent={handleFileUpload}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center relative">
                    {/* Mobile Sidebar Toggle - Visible only when no session is active */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors lg:hidden cursor-pointer"
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>

                    {isLoading || isSessionsLoading || (projectId && !hasFetchedSessions) ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">{t("loadingHistory")}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 max-w-sm">
                            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-[#8B5CF6]">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{t("noActiveSession")}</h3>
                                <p className="text-slate-500 mb-6 leading-relaxed">Create a new chat session to start analyzing your trends with AI assistance.</p>
                            </div>
                            <button
                                onClick={handleNewSessionOrProjectTrigger}
                                className="w-full flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#773CDD] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Clock className="w-5 h-5" />
                                {t("newChat")}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- MODULE SELECTION MODAL --- */}
            <ModuleSelectionModal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                onSelectModule={handleModuleSelect}
            />

            {/* --- CREATE PROJECT DIALOG --- */}
            <CreateProjectDialog
                isOpen={isCreateProjectDialogOpen}
                onOpenChange={setIsCreateProjectDialogOpen}
            />

            {/* --- GLOBAL DELETE CONFIRMATION MODAL --- */}
            <DeleteConfirmationModal
                modal={modal}
                onClose={() => setModal(null)}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}   