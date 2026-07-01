"use client";

import { TourButton } from "@/components/common/tour-button";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useProjectStore } from "@/store/useProjectStore";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useFileManagerStore } from "@/store/useFileManagerStore";
import { Plus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";


import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";

export function Header() {
    const pathname = usePathname();
    const t = useTranslations("Header");
    const { showToast } = useToast();
    const { view, setView } = useFileManagerStore();
    const isDashboardPage = pathname?.startsWith("/dashboard");
    const isFileManagerPage = pathname?.startsWith("/file-manager");
    const { user } = useAuthStore();

    const {
        projects,
        currentProject,
        fetchProjects,
        selectProject,
        sessions,
        currentSession,
        selectSession,
        createSession,
        fetchSessions,
        isSessionsLoading,
        hasFetchedSessions
    } = useProjectStore();

    const searchParams = useSearchParams();
    const router = useRouter();

    const handleCreateBoard = async () => {
        if (currentProject?._id) {
            await createSession(currentProject._id);
            router.push("/chat");
        } else {
            showToast("select a project", "error");
        }
    };

    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (!hasFetchedRef.current && projects.length === 0) {
            hasFetchedRef.current = true;
            fetchProjects();
        }
    }, [fetchProjects, projects.length]);

    // Fetch sessions if project is selected but sessions are not fetched
    useEffect(() => {
        if (currentProject?._id && !hasFetchedSessions && !isSessionsLoading) {
            fetchSessions(currentProject._id, searchParams.get("sessionId") || undefined);
        }
    }, [currentProject?._id, hasFetchedSessions, isSessionsLoading, fetchSessions, searchParams]);

    // --- SINGLE SOURCE OF TRUTH: SYNC URL AND STORE ---
    useEffect(() => {
        if (projects.length === 0) return;

        const urlProjectId = searchParams.get("projectId");
        const urlSessionId = searchParams.get("sessionId");
        
        const storeProjectId = currentProject?._id;
        const storeSessionId = currentSession?._id;

        // 1. URL -> Store Sync (Priority: URL wins if valid)
        if (urlProjectId && urlProjectId !== storeProjectId) {
            const project = projects.find(p => p._id === urlProjectId);
            if (project) {
                selectProject(project, urlSessionId || undefined);
                return;
            }
        }

        if (urlSessionId && urlSessionId !== storeSessionId) {
            const session = sessions.find(s => s._id === urlSessionId);
            if (session) {
                selectSession(session);
                return;
            }
        }

        // 2. Store -> URL Sync (Only for pages that depend on these IDs)
        if (isDashboardPage || pathname === "/chat") {
            const params = new URLSearchParams(searchParams.toString());
            let changed = false;

            // Ensure Project ID is in URL
            if (storeProjectId && urlProjectId !== storeProjectId) {
                params.set("projectId", storeProjectId);
                changed = true;
            }

            // Ensure Session ID is in URL and valid
            if (storeSessionId && urlSessionId !== storeSessionId) {
                params.set("sessionId", storeSessionId);
                changed = true;
            } else if (!storeSessionId && urlSessionId && !isSessionsLoading) {
                // If store has no session but URL does, and we are not loading sessions,
                // the URL session is likely invalid/deleted
                params.delete("sessionId");
                changed = true;
            } else if (urlSessionId && !isSessionsLoading && !sessions.some(s => s._id === urlSessionId)) {
                // If URL has a session ID that doesn't exist in current sessions list and we are not loading
                if (storeSessionId) {
                    params.set("sessionId", storeSessionId);
                } else {
                    params.delete("sessionId");
                }
                changed = true;
            }

            if (changed) {
                const nextUrl = `${pathname}?${params.toString()}`;
                const currentUrl = `${pathname}?${searchParams.toString()}`;
                if (nextUrl !== currentUrl) {
                    // Use window.history.replaceState for silent updates that don't trigger RSC fetch
                    window.history.replaceState(null, '', nextUrl);
                }
            }
        }

    }, [
        pathname, 
        isDashboardPage, 
        projects, 
        sessions, 
        currentProject?._id, 
        currentSession?._id, 
        searchParams, 
        selectProject, 
        selectSession,
        isSessionsLoading
    ]);

    // UI Actions change the URL, which triggers the sync effect above
    const handleProjectChange = (p: typeof projects[0]) => {
        // If not on a page that uses URL for state, select directly
        if (!isDashboardPage && pathname !== "/chat") {
            selectProject(p);
        }

        if (p._id === currentProject?._id) {
            if (pathname === "/home" || pathname === "/" || pathname === "/en/home" || pathname === "/de/home") {
                const params = new URLSearchParams(searchParams.toString());
                params.set("projectId", p._id);
                router.push(`/dashboard?${params.toString()}`);
            }
            return;
        }
        
        const params = new URLSearchParams(searchParams.toString());
        params.set("projectId", p._id);
        params.delete("sessionId"); // Clear session when project changes

        // If on home page, redirect to dashboard
        const isHomePage = pathname === "/home" || pathname === "/" || pathname === "/en/home" || pathname === "/de/home";
        const targetPath = isHomePage ? "/dashboard" : pathname;

        router.push(`${targetPath}?${params.toString()}`);
    };

    const handleSessionChange = (s: typeof sessions[0]) => {
        if (s._id === currentSession?._id) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set("sessionId", s._id);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <header className="h-14 border-b md:px-6 shrink-0 border flex items-center justify-between border-border bg-background-child px-4 py-3 rounded-lg gap-1">
            <div id="tour-header-workspace" className="flex items-center gap-1 sm:gap-2 text-muted-foreground min-w-0 flex-1">
                <SidebarTrigger className="-ml-1" />
                {isFileManagerPage ? (
                    <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                        <span 
                            className="text-sm sm:text-md text-muted-foreground hover:text-foreground transition-colors font-medium shrink-0"
                            onClick={() => setView("projects")}
                        > 
                        {user?.name} Workspace
                        </span>
                        {currentProject && (view === "sessions" || view === "files") && (
                            <>
                                <span className="text-muted-foreground mx-1 shrink-0 pointer-events-none">/</span>
                                <span 
                                    className="cursor-pointer text-sm sm:text-md text-muted-foreground hover:text-foreground transition-colors font-medium inline-block truncate max-w-[80px] sm:max-w-[120px]"
                                    onClick={() => setView("sessions")}
                                    title={currentProject.name}
                                >
                                    {currentProject.name}
                                </span>
                            </>
                        )}
                        {currentSession && view === "files" && (
                            <>
                                <span className="text-muted-foreground mx-1 shrink-0 pointer-events-none">/</span>
                                <span 
                                    className="cursor-pointer text-sm sm:text-md text-muted-foreground hover:text-foreground transition-colors font-medium inline-block truncate max-w-[80px] sm:max-w-[120px]"
                                    onClick={() => setView("files")}
                                    title={currentSession.title}
                                >
                                    {currentSession.title}
                                </span>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <span className="text-sm sm:text-md text-muted-foreground hover:text-foreground transition-colors hidden md:inline shrink-0"> 
                            {user?.name ? (
                                `${user.name.length > 10 ? user.name.slice(0, 10) + "..." : user.name} ${t("workspace")}`
                            ) : (
                                t("workspace")
                            )} / 
                        </span>

                        {/* Project Dropdown */}
                        <div className="flex items-center min-w-0">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-background-selected hover:bg-background-selected/80 disabled:cursor-not-allowed"
                                        disabled={projects.length <= 1}
                                    >
                                        <span className="inline-block truncate max-w-[50px] sm:max-w-[80px] lg:max-w-[140px]" title={currentProject?.name || ""}>
                                            {currentProject?.name || (projects.length > 0 ? t("selectProject") : t("noProject"))}
                                        </span>
                                        {projects.length > 1 && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m6 9 6 6 6-6" /></svg>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {projects.map((p) => (
                                        <DropdownMenuItem 
                                            key={p._id} 
                                            onClick={() => handleProjectChange(p)} 
                                            title={p.name} 
                                            className="cursor-pointer truncate max-w-[200px]"
                                        >
                                            {p.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Session Dropdown (Dashboard Only) */}
                        {isDashboardPage && (
                            <div className="flex items-center min-w-0">
                                <span className="text-muted-foreground mx-1 shrink-0 pointer-events-none">/</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-background-selected hover:bg-background-selected/80 disabled:cursor-not-allowed"
                                            disabled={sessions.length <= 1}
                                        >
                                            <span className="inline-block truncate max-w-[50px] sm:max-w-[80px] lg:max-w-[140px]" title={currentSession?.title || ""}>
                                                {currentSession?.title || (sessions.length > 0 ? t("selectSession") : t("noSessions"))}
                                            </span>
                                            {sessions.length > 1 && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 shrink-0"><path d="m6 9 6 6 6-6" /></svg>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {sessions.map((s) => (
                                            <DropdownMenuItem 
                                                key={s._id} 
                                                onClick={() => handleSessionChange(s)} 
                                                title={s.title} 
                                                className="cursor-pointer truncate max-w-50"
                                            >
                                                {s.title}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
                <TourButton />
                {isDashboardPage && (
                    <Button 
                        onClick={handleCreateBoard}
                        className="bg-[#8752E0] hover:bg-purple-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4"
                    >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 " />
                        <span className="hidden sm:inline">{t("createBoard")}</span>
                    </Button>
                )}
            </div>

        </header>
    );
}
