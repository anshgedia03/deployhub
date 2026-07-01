"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import {
    Bot,
    Download,
    Plus,
    UploadCloud,
    Send,
    PanelLeft,
    FileText,
    X,
} from "lucide-react";
import { type AttachedFileType } from "./ChatPage";
import { ChatMessage as ChatMessageComponent } from "@/app/[locale]/chat/components/chatMessage";
import { ReportCard } from "@/app/[locale]/chat/components/reportCard";
import StatusLoader from "./StatusLoader";
import { ChatChartRenderer } from "./ChatChartRenderer";

import { chatService, ChatMessage } from "@/lib/api/services/chat";
import { useSendMessage } from "@/hooks/use-chat-messages";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useInView } from "react-intersection-observer";

import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/ToastContext";
import { useTranslations } from "next-intl";
import { AxiosError } from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
    projectId: string;
    sessionId: string;
    onToggleSidebar?: () => void;
    attachedFiles: AttachedFileType[];
    onClearFiles: () => void;
    onRemoveFile: (index: number) => void;
    onFileSelected: (file: AttachedFileType) => void;
    onFileUpload?: () => void;
    onNewChat: () => void;
    onMessageSent?: () => void;
}

export function ChatArea({
    projectId,
    sessionId,
    onToggleSidebar,
    attachedFiles,
    onClearFiles,
    onRemoveFile,
    onFileSelected,
    onNewChat,
    onMessageSent
}: ChatAreaProps) {
    const t = useTranslations("Chat");
    const { user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bottomFileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [message, setMessage] = useState("");
    const [togglingMessageId, setTogglingMessageId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const {
        data: historyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingHistory
    } = useChatHistory({ projectId, sessionId });

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
    });

    const isFetchingRef = useRef(false);
    const lastFetchedCursorRef = useRef<string | null>(null);

    useEffect(() => {
        const lastPage = historyData?.pages[historyData.pages.length - 1];
        const nextCursor = lastPage?.nextCursor;

        if (inView && hasNextPage && !isFetchingNextPage && !isFetchingRef.current && nextCursor !== lastFetchedCursorRef.current) {
            isFetchingRef.current = true;
            lastFetchedCursorRef.current = nextCursor || null;

            fetchNextPage().finally(() => {
                setTimeout(() => {
                    isFetchingRef.current = false;
                }, 500);
            });
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, historyData]);

    useEffect(() => {
        lastFetchedCursorRef.current = null;
    }, [sessionId]);

    const messages = React.useMemo(() => {
        const historicalMessages = historyData?.pages.slice().reverse().flatMap(page => page.messages) || [];
        return Array.from(
            new Map(historicalMessages.map(msg => [msg._id, msg])).values()
        );
    }, [historyData?.pages]);

    const { mutate: sendMessageMutation, isPending: isSending } = useSendMessage({
        projectId,
        sessionId,
        onSuccess: (aiResponse) => {
            queryClient.setQueryData(['chatHistory', sessionId], (old: any) => {
                if (!old) return old;
                const newPages = [...old.pages];
                if (newPages.length > 0) {
                    newPages[0] = {
                        ...newPages[0],
                        messages: [...newPages[0].messages, aiResponse]
                    };
                }
                return { ...old, pages: newPages };
            });

            if (onMessageSent) {
                onMessageSent();
            }

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        },
        onError: (error) => {
            console.error("Failed to send message", error);
            let errorMsg = "Failed to send message";
            let errorDetail = "";

            if (new AxiosError(error)) {
                errorMsg = error.response?.data?.message || error.message || errorMsg;
                errorDetail = error.response?.data?.details || error.response?.data?.detail || "";
            }

            showToast(errorMsg, "error");

            const tempAiErrorMsg: ChatMessage = {
                _id: `error-${Date.now()}`,
                sessionId,
                role: 'model',
                content: {
                    error: true,
                    message: errorMsg,
                    summary: errorDetail || "I encountered an error while processing your request. Please try again."
                }
            };

            queryClient.setQueryData(['chatHistory', sessionId], (old: any) => {
                if (!old) return old;
                const newPages = [...old.pages];
                if (newPages.length > 0) {
                    newPages[0] = {
                        ...newPages[0],
                        messages: [...newPages[0].messages, tempAiErrorMsg]
                    };
                }
                return { ...old, pages: newPages };
            });

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLength = useRef(0);
    const lastScrollHeight = useRef(0);
    const prevLastMessageId = useRef<string | null>(null);

    useEffect(() => {
        prevMessagesLength.current = 0;
        lastScrollHeight.current = 0;
        prevLastMessageId.current = null;
    }, [sessionId]);

    useLayoutEffect(() => {
        if (!scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const lastMessageId = messages[messages.length - 1]?._id;

        const isInitialLoad = prevMessagesLength.current === 0 && messages.length > 0;
        const isNewMessageAtBottom = lastMessageId !== prevLastMessageId.current && messages.length > prevMessagesLength.current;
        const isHistoricalLoad = !isNewMessageAtBottom && messages.length > prevMessagesLength.current;

        if (isInitialLoad || isNewMessageAtBottom) {
            container.scrollTop = container.scrollHeight;
        } else if (isHistoricalLoad) {
            const newScrollHeight = container.scrollHeight;
            const heightDifference = newScrollHeight - lastScrollHeight.current;
            container.scrollTop = container.scrollTop + heightDifference;
        }

        lastScrollHeight.current = container.scrollHeight;
        prevMessagesLength.current = messages.length;
        prevLastMessageId.current = lastMessageId;
    }, [messages, sessionId]);

    useEffect(() => {
        if (isSending) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isSending]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024, sizes = ["Bytes", "Kb", "Mb", "Gb"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles) {
            Array.from(selectedFiles).forEach(file => {
                onFileSelected({ name: file.name, size: formatFileSize(file.size), raw: file });
            });
        }
        if (e.target) e.target.value = "";
    };

    const handleSendMessage = async () => {
        if ((!message.trim() && attachedFiles.length === 0) || isSending) return;

        const text = message.trim();
        const files = attachedFiles.filter(f => f.raw).map(f => f.raw as File);
        const attachedFileIds = attachedFiles.filter(f => f.id).map(f => f.id as string);
        const tempUserMsg: ChatMessage = {
            _id: Date.now().toString(),
            sessionId,
            role: 'user',
            content: text || (attachedFiles.length > 0 ? `Using ${attachedFiles.length} files: ${attachedFiles.map(f => f.name).join(", ")}` : ""),
            attachments: attachedFiles.map(f => ({
                name: f.name,
                url: f.url || "",
                type: f.raw?.type || "file"
            }))
        };

        queryClient.setQueryData(['chatHistory', sessionId], (old: any) => {
            if (!old) return {
                pages: [{ messages: [tempUserMsg], hasMore: false, nextCursor: null }],
                pageParams: [undefined]
            };
            const newPages = [...old.pages];
            if (newPages.length > 0) {
                newPages[0] = {
                    ...newPages[0],
                    messages: [...newPages[0].messages, tempUserMsg]
                };
            }
            return { ...old, pages: newPages };
        });

        setMessage("");
        if (attachedFiles.length > 0) onClearFiles();

        sendMessageMutation({ text, files, attachedFileIds });
    };

    const handleToggleDashboard = async (messageId: string, isOnDashboard: boolean) => {
        setTogglingMessageId(messageId);
        try {
            if (isOnDashboard) {
                await chatService.removeWidget(projectId, sessionId, messageId);
                showToast("Widget removed from dashboard", "success");
            } else {
                await chatService.addWidget(projectId, sessionId, messageId);
                showToast("Widget added to dashboard", "success");
            }

            queryClient.setQueryData(['chatHistory', sessionId], (old: any) => {
                if (!old) return old;
                const newPages = old.pages.map((page: any) => ({
                    ...page,
                    messages: page.messages.map((m: any) =>
                        m._id === messageId ? { ...m, onDashboard: !isOnDashboard } : m
                    )
                }));
                return { ...old, pages: newPages };
            });

            queryClient.invalidateQueries({ queryKey: ['dashboard-widgets', projectId, sessionId] });
        } catch (error) {
            console.error("Failed to toggle dashboard", error);
            showToast("Failed to update dashboard", "error");
        } finally {
            setTogglingMessageId(null);
        }
    };

    const renderAttachments = (attachments?: { name: string; url: string; type: string }[]) => {
        if (!attachments || attachments.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((att, i) => (
                    <div key={`${att.name}-${i}`} className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        <span className="text-[12px] font-medium text-slate-700 truncate max-w-[150px]">{att.name}</span>
                        {att.url && (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:bg-slate-200 rounded transition-colors" onClick={(e) => e.stopPropagation()}>
                                <Download className="w-3 h-3 text-slate-500" />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const MarkdownRenderer = ({ content }: { content: string }) => (
        <div className="prose prose-slate max-w-none text-[15px] leading-relaxed text-slate-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );

    const renderAIContent = (msg: ChatMessage, index: number) => {
        const { content, visualizationJSON, onDashboard } = msg;

        const isError = content && typeof content === 'object' && (
            content.error === 'Internal Server Error' ||
            content.statusCode === 500 ||
            content.message === 'AI Processing Error' ||
            content.error === true
        );

        if (isError) {
            return (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-900 mb-1">
                            {content.message || "System Error"}
                        </h4>
                        <div className="text-[14px] text-red-700 leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content.summary || "I hit a snag while thinking. Could you try asking that again?"}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            );
        }

        if (content && typeof content === 'object') {
            const viz = visualizationJSON || content.visualization;
            const vizData = visualizationJSON?.data || content.dataset?.records;

            return (
                <div className="flex flex-col gap-5 w-full">
                    {content.summary && (
                        <MarkdownRenderer content={content.summary} />
                    )}

                    {content.analysis && (
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                            <h4 className="text-sm font-bold text-slate-900 mb-2">Analysis</h4>
                            <div className="text-[14px] leading-relaxed text-slate-600">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content.analysis}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {viz && vizData && (
                        <ChatChartRenderer
                            viz={viz}
                            data={vizData}
                            onDashboard={!!onDashboard}
                            onToggleDashboard={() => handleToggleDashboard(msg._id, !!onDashboard)}
                            isLoading={togglingMessageId === msg._id}
                        />
                    )}

                    {content.warnings && content.warnings.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-2">
                            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                <X className="w-4 h-4 text-amber-600" /> Warnings
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                                {content.warnings.map((warning: string, i: number) => (
                                    <li key={i} className="text-[13px] text-amber-800">{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {content.key_insights && content.key_insights.length > 0 && (
                        <div className="bg-[#F9F7FF] rounded-xl p-5 border border-[#E9D5FF]">
                            <h4 className="text-[15px] font-bold text-[#6D28D9] mb-3 flex items-center gap-2">
                                <Bot className="w-4 h-4" /> Key Insights
                            </h4>
                            <ul className="space-y-3">
                                {content.key_insights.map((insight: string, i: number) => (
                                    <li key={`insight-${msg._id}-${i}`} className="flex gap-3 text-[14px] text-slate-700 leading-relaxed">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2 shrink-0" />
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {insight}
                                        </ReactMarkdown>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {content.needs_clarification && content.clarification_questions && content.clarification_questions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex flex-col gap-3">
                            <h4 className="text-[15px] font-bold text-blue-900 flex items-center gap-2">
                                <Bot className="w-4 h-4" /> Clarification Needed
                            </h4>
                            <ul className="space-y-2">
                                {content.clarification_questions.map((question: string, i: number) => (
                                    <li key={i} className="flex gap-2 text-[14px] text-blue-800">
                                        <span className="font-bold">{i + 1}.</span> {question}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        if (typeof content === 'string' && content.length > 0) {
            return (
                <MarkdownRenderer content={content} />
            );
        }

        return <ReportCard />;
    };

    return (
        <main className="flex-1 shadow-sm flex flex-col rounded-lg border border-border bg-background-child overflow-hidden h-full relative">

            <div data-tour="chat-header">
                {/* --- TOP TOOLBAR --- */}
                <header className="px-3 py-2 md:px-6 md:py-3 flex items-center justify-between gap-2 overflow-hidden z-10 shrink-0" id="tour-chat-header">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <button 
                            onClick={onToggleSidebar}
                            className="lg:hidden p-1 rounded hover:bg-background-selected text-foreground shrink-0 transition-colors"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                        
                        <div id="tour-chat-select-ai" className="flex-1 max-w-[200px]">
                            <div className="flex items-center justify-between border border-border rounded-md px-2 py-1 bg-white shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                <input 
                                    aria-invalid="false" 
                                    autoComplete="off" 
                                    readOnly
                                    className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-default" 
                                    type="text" 
                                    value="🤖 gemini-2.5-flash" 
                                />
                                <button className="p-0.5 hover:bg-gray-100 rounded text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code rotate-90 shrink-0"><path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <button className="h-8 w-8 items-center justify-center bg-background-selected rounded border border-transparent hover:border-border hidden sm:flex transition-colors">
                            <Download className="w-4 h-4 text-slate-600" />
                        </button>
                        
                        <button 
                            onClick={onNewChat}
                            className="h-8 w-8 sm:w-auto sm:h-8 sm:py-1 sm:px-3 flex items-center justify-center bg-background-selected rounded border border-transparent hover:border-border gap-2 transition-colors text-sm font-medium text-slate-700"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">{t("newChat")}</span>
                        </button>

                        <button 
                            onClick={onToggleSidebar}
                            className="lg:hidden p-1 rounded hover:bg-background-selected text-foreground transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-panel-right"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M15 3v18"></path></svg>
                        </button>
                    </div>
                </header>
            </div>

            {/* --- DYNAMIC SCROLLABLE MIDDLE AREA --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar">
                    {isLoadingHistory && messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 font-medium">{t("loadingHistory")}</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="flex flex-col items-center justify-end h-full relative w-full">
                                <div 
                                    className="absolute inset-0 opacity-50 !rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[70vh] aspect-square w-full" 
                                    style={{ 
                                        backgroundImage: "linear-gradient(rgb(229, 231, 235) 1px, transparent 1px), linear-gradient(90deg, rgb(229, 231, 235) 1px, transparent 1px)", 
                                        backgroundSize: "40px 40px", 
                                        maskImage: "radial-gradient(circle, black 20%, transparent 50%)" 
                                    }} 
                                />
                                <div className="z-10">
                                    <div className="text-center mb-4 md:mb-8 px-4">
                                        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1 md:mb-2">
                                            {t("goodMorning")}, {user?.name || "User"}
                                        </h1>
                                        <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">
                                            {t.rich("howCanIAssist", {
                                                highlight: (chunks) => <span className="text-primary">{chunks}</span>,
                                                assist: t("assist")
                                            })}
                                        </h2>
                                        <p className="text-sm md:text-base text-gray-800">{t("assistDescription")}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full max-w-2xl mb-4 md:mb-8 z-10">
                                <div className="bg-background-selected border-2 border-dashed rounded-lg p-4 md:p-8 text-center border-border">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3 md:mb-4">
                                            <svg width="50" height="47" viewBox="0 0 50 47" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-800 size-5 md:size-6">
                                                <path d="M28.672 29.433h-7.35c-3.175 0-5.075 1.9-5.075 5.075v7.35c0 3.175 1.9 5.075 5.075 5.075h7.35c3.175 0 5.075-1.9 5.075-5.075v-7.35c0-3.175-1.9-5.075-5.075-5.075m2.35 9.825c-.25.25-.625.425-1.025.45h-3.525l.025 3.475a1.58 1.58 0 0 1-.475 1.075c-.25.25-.625.425-1.025.425-.825 0-1.5-.675-1.5-1.5v-3.5l-3.5.025c-.825 0-1.5-.7-1.5-1.525s.675-1.5 1.5-1.5l3.5.025v-3.5c0-.825.675-1.525 1.5-1.525s1.5.7 1.5 1.525l-.025 3.475h3.525c.825 0 1.5.675 1.5 1.5-.025.425-.2.775-.475 1.075" fill="currentColor"></path>
                                                <path d="M45.425 37.394a13.8 13.8 0 0 1-4.5 2.775c-1.65.625-3.425-.575-3.425-2.35v-3.3a8.824 8.824 0 0 0-8.825-8.825h-7.35a8.824 8.824 0 0 0-8.825 8.825v3.95c0 1.375-1.125 2.5-2.5 2.5H8.875C2.75 40.044 0 35.069 0 30.619c0-4.2 2.45-8.85 7.775-10.15C6.3 14.644 7.55 9.169 11.35 5.194 15.675.67 22.575-1.13 28.525.72 34 2.394 37.85 6.894 39.225 13.144 44 14.22 47.825 17.82 49.35 22.82c1.65 5.425.15 11-3.925 14.575" fill="currentColor"></path>
                                            </svg>
                                        </div>
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2">{t("uploadFiles")}</h3>
                                        <p className="text-sm md:text-base text-gray-800 mb-4 md:mb-6">{t("uploadDescription")}</p>
                                        <div className="flex flex-col sm:row gap-3">
                                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-[14px] font-medium transition-colors shadow-sm cursor-pointer"
                                            >
                                                <UploadCloud className="w-4 h-4" /> {t("selectFiles")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-[39dvw] mx-auto flex flex-col gap-2 pb-6">
                            {hasNextPage && (
                                <div ref={loadMoreRef} className="text-center py-4 text-sm text-slate-500">
                                    {isFetchingNextPage ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading older messages...</span>
                                        </div>
                                    ) : (
                                        <span>Scroll up to load more</span>
                                    )}
                                </div>
                            )}

                            {messages.map((msg, index) => (
                                <ChatMessageComponent key={msg._id} role={msg.role === 'model' ? 'ai' : msg.role}>
                                    {msg.attachments && msg.attachments.length > 0 && renderAttachments(msg.attachments)}
                                    {msg.role === 'user' ? (
                                        typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                                    ) : (
                                        renderAIContent(msg, index)
                                    )}
                                </ChatMessageComponent>
                            ))}
                            {isSending && (
                                <ChatMessageComponent role="ai">
                                    <StatusLoader />
                                </ChatMessageComponent>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- CHAT INPUT SECTION --- */}
            <div className="px-3 py-2 md:px-6 md:py-3 shrink-0">
                <div className="relative max-w-4xl mx-auto" data-tour="chat-input">
                    <div className="p-1 rounded-2xl" style={{ background: "linear-gradient(90.69deg, rgb(213, 154, 232) 0%, rgb(179, 154, 232) 17.79%, rgb(154, 188, 232) 97.6%, rgb(231, 192, 243) 100%)" }}>
                        <div className="flex items-center flex-col p-1 bg-background-child rounded-lg border">
                            <div className="flex w-full items-center justify-between flex-col gap-3 px-4 py-3 bg-white rounded-lg border border-border shadow-sm">
                                
                                {attachedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2 w-full mb-1">
                                        {attachedFiles.map((file, index) => (
                                            <div key={`${file.name}-${index}`} className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                                <FileText className="w-4 h-4 text-[#8B5CF6] flex-shrink-0" />
                                                <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">
                                                    {file.name}
                                                </span>
                                                <button onClick={() => onRemoveFile(index)} className="text-slate-400 hover:text-slate-600 transition-colors ml-1">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex w-full items-center gap-3">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="What do you want analyse today?"
                                        className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-base resize-none min-h-[24px] max-h-32"
                                        rows={1}
                                    />
                                </div>
                                
                                <div className="flex w-full items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <button 
                                                onClick={() => bottomFileInputRef.current?.click()}
                                                className="w-8 h-8 flex items-center justify-center text-gray-800 hover:text-primary hover:bg-primary-light rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                            <input type="file" ref={bottomFileInputRef} className="hidden" multiple onChange={handleFileChange} />
                                        </div>
                                        <div className="relative">
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSendMessage}
                                        disabled={(!message.trim() && attachedFiles.length === 0) || isSending}
                                        className={cn(
                                            "p-2 rounded-full text-white transition-colors flex-shrink-0 shadow-sm",
                                            (message.trim() || attachedFiles.length > 0) && !isSending 
                                                ? "bg-primary hover:bg-primary-hover cursor-pointer" 
                                                : "bg-gray-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
