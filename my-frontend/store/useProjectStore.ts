import { create } from 'zustand';
import { projectService, Project } from '@/lib/api/services/project';
import { chatService, ChatSession } from '@/lib/api/services/chat';
import { documentService } from '@/lib/api/services/document';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  isSessionsLoading: boolean;
  hasFetchedSessions: boolean;
  isInitialFetched: boolean;
  isActionLoading: boolean;

  lastFetchedProjectId: string | null;
  lastFetchedSessionId: string | null;
  lastFetchedSearch: string | null;
  lastFetchedProjectsSearch: string | null;

  fetchProjects: (search?: string) => Promise<void>;
  createProject: (name: string) => Promise<Project | undefined>;
  updateProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  resetProjectState: () => void;

  fetchSessions: (projectId: string, sessionId?: string, search?: string) => Promise<void>;
  selectProject: (project: Project, sessionId?: string) => Promise<void>;
  selectSession: (session: ChatSession) => void;
  createSession: (projectId: string) => Promise<ChatSession | undefined>;
  renameSession: (projectId: string, sessionId: string, title: string) => Promise<void>;
  deleteSession: (projectId: string, sessionId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

const initialProjectState = {
  projects: [],
  currentProject: null,
  sessions: [],
  currentSession: null,
  isLoading: false,
  isSessionsLoading: false,
  hasFetchedSessions: false,
  isInitialFetched: false,
  isActionLoading: false,
  lastFetchedProjectId: null,
  lastFetchedSessionId: null,
  lastFetchedSearch: null,
  lastFetchedProjectsSearch: null,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialProjectState,

  resetProjectState: () => {
    set(initialProjectState);
  },

  fetchProjects: async (search?: string) => {
    const { isInitialFetched, isLoading, currentProject, lastFetchedProjectsSearch } = get();
    if (isLoading) return;

    const normalizedSearch = search || null;

    // Redundancy check
    // If it's a "fetch all" request and we already did one, skip
    if (search === undefined && isInitialFetched) {
      return;
    }
    // If it's a search request and it's the same as the last one, skip
    if (search !== undefined && normalizedSearch === lastFetchedProjectsSearch) {
      return;
    }

    set({
      isLoading: true,
      lastFetchedProjectsSearch: normalizedSearch
    });

    try {
      const projects = await projectService.findAll(search);
      let nextProject = currentProject;

      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get("projectId");
      const urlSessionId = urlParams.get("sessionId");

      // If searching and currentProject is not in results, or no currentProject, select the first one
      if (projects.length > 0) {
        const urlProject = urlProjectId ? projects.find(p => p._id === urlProjectId) : null;
        const isCurrentInResults = currentProject && projects.some(p => p._id === currentProject._id);
        
        if (urlProject) {
          nextProject = urlProject;
        } else if (!isCurrentInResults) {
          nextProject = projects[0];
        }
      } else {
        nextProject = null;
      }

      set((state) => ({
        projects,
        currentProject: nextProject,
        isInitialFetched: search === undefined ? true : state.isInitialFetched
      }));

      // If project changed, fetch its sessions
      // Optimization: If there's a projectId in the URL, let Header.tsx handle the fetch via selectProject
      if (nextProject && nextProject._id !== currentProject?._id && !urlProjectId) {
        await get().fetchSessions(nextProject._id, urlSessionId || undefined);
      }

    } catch (error) {
      console.error('Failed to fetch projects', error);
      set({ lastFetchedProjectsSearch: null });
    } finally {
      set({ isLoading: false });
    }
  },

  selectProject: async (project: Project, sessionId?: string) => {
    const { currentProject, currentSession } = get();

    // If project is already selected and session matches (or is null), don't re-select
    if (currentProject?._id === project._id &&
      (sessionId === undefined || currentSession?._id === sessionId)) {
      return;
    }

    set((state) => ({
      currentProject: project,
      currentSession: state.currentProject?._id === project._id ? state.currentSession : null,
      hasFetchedSessions: state.currentProject?._id === project._id ? state.hasFetchedSessions : false
    }));
    await get().fetchSessions(project._id, sessionId);
  },

  createProject: async (name: string) => {
    set({ isLoading: true, lastFetchedProjectId: null });
    try {
      const newProject = await projectService.create({ name });
      set((state) => ({ projects: [...state.projects, newProject] }));
      await get().selectProject(newProject);
      return newProject;
    } catch (error) {
      console.error('Failed to create project', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id, name) => {
    set({ isActionLoading: true });
    try {
      const updated = await projectService.update(id, { name });
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? { ...p, ...updated } : p)),
        currentProject: state.currentProject?._id === id ? { ...state.currentProject, ...updated } : state.currentProject,
      }));
    } catch (error) {
      console.error('Failed to update project', error);
      throw error;
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isActionLoading: true });
    try {
      await projectService.delete(id);
      const remaining = get().projects.filter((p) => p._id !== id);
      set({ projects: remaining });
      if (get().currentProject?._id === id) {
        if (remaining.length > 0) {
          // Select the most recent project (assuming first in array)
          await get().selectProject(remaining[0]);
        } else {
          set({ currentProject: null, sessions: [], currentSession: null });
        }
      }
    } catch (error) {
      console.error('Failed to delete project', error);
      throw error;
    } finally {
      set({ isActionLoading: false });
    }
  },

  duplicateProject: async (id) => {
    set({ isLoading: true, isActionLoading: true, lastFetchedProjectId: null });
    try {
      const duplicated = await projectService.duplicate(id);
      set((state) => ({ projects: [duplicated, ...state.projects] }));
      await get().selectProject(duplicated);
    } catch (error) {
      console.error('Failed to duplicate project', error);
    } finally {
      set({ isLoading: false, isActionLoading: false });
    }
  },

  fetchSessions: async (projectId: string, sessionId?: string, search?: string) => {
    let normalizedSessionId = sessionId || null;
    const normalizedSearch = search || null;

    // If no sessionId passed, try to get from URL
    if (!normalizedSessionId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      normalizedSessionId = urlParams.get("sessionId");
    }

    // Redundancy check
    const {
      isSessionsLoading,
      lastFetchedProjectId,
      lastFetchedSessionId,
      lastFetchedSearch
    } = get();

    if (
      isSessionsLoading ||
      (lastFetchedProjectId === projectId &&
        lastFetchedSessionId === normalizedSessionId &&
        lastFetchedSearch === normalizedSearch)
    ) {
      return;
    }

    set({
      isSessionsLoading: true,
      lastFetchedProjectId: projectId,
      lastFetchedSessionId: normalizedSessionId,
      lastFetchedSearch: normalizedSearch
    });

    try {
      const sessions = await chatService.listSessions(projectId, search);

      // Sort sessions by createdAt descending (newer first)
      const sortedSessions = sessions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      let nextSession = null;
      if (normalizedSessionId) {
        nextSession = sortedSessions.find(s => s._id === normalizedSessionId) || null;
      }

      // If no explicit sessionId requested, or requested session not found
      if (!nextSession) {
        const currentSession = get().currentSession;
        // Check if current session is still in the results
        if (currentSession && sortedSessions.some(s => s._id === currentSession._id)) {
          nextSession = currentSession;
        } else if (!normalizedSearch && sortedSessions.length > 0) {
          // Only fallback to the most recent session if NOT searching
          nextSession = sortedSessions[0];
        } else {
          // During search, if current session is not in results, keep it as is
          nextSession = currentSession;
        }
      }

      set({
        sessions: sortedSessions,
        currentSession: nextSession,
        hasFetchedSessions: true,
      });
    } catch (error) {
      console.error('Failed to fetch sessions', error);
      // Reset lastFetched on error to allow retry
      set({
        lastFetchedProjectId: null,
        lastFetchedSessionId: null,
        lastFetchedSearch: null
      });
    } finally {
      set({ isSessionsLoading: false });
    }
  },

  selectSession: (session: ChatSession) => {
    set({ currentSession: session, lastFetchedSessionId: session._id });
  },

  createSession: async (projectId: string) => {
    set({ isActionLoading: true, lastFetchedSessionId: null });
    try {
      const newSession = await chatService.createSession(projectId);
      set((state) => ({ sessions: [newSession, ...state.sessions], currentSession: newSession }));
      return newSession;
    } catch (error) {
      console.error('Failed to create session', error);
      throw error;
    } finally {
      set({ isActionLoading: false });
    }
  },

  renameSession: async (projectId, sessionId, title) => {
    set({ isActionLoading: true, lastFetchedSessionId: null });
    try {
      const response = await chatService.renameSession(projectId, sessionId, title);
      const updated = response.data;
      set((state) => ({
        sessions: state.sessions.map((s) => (s._id === sessionId ? updated : s)),
        currentSession: state.currentSession?._id === sessionId ? updated : state.currentSession,
      }));
    } catch (error) {
      console.error('Failed to rename session', error);
      throw error;
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteSession: async (projectId, sessionId) => {
    set({ isActionLoading: true, lastFetchedSessionId: null });
    try {
      await chatService.deleteSession(projectId, sessionId);
      const remaining = get().sessions.filter((s) => s._id !== sessionId);
      set({ sessions: remaining });
      if (get().currentSession?._id === sessionId) {
        // Select the most recent session (assuming first in array)
        set({ currentSession: remaining.length > 0 ? remaining[0] : null });
      }
    } catch (error) {
      console.error('Failed to delete session', error);
      throw error;
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteDocument: async (documentId) => {
    set({ isActionLoading: true });
    try {
      await documentService.deleteDocument(documentId);
    } catch (error) {
      console.error('Failed to delete document', error);
      throw error;
    } finally {
      set({ isActionLoading: false });
    }
  },
}));
