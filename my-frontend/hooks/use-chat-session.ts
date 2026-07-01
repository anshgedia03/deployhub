import { useProjectStore } from '@/store/useProjectStore';
import { useCallback } from 'react';

export function useChatSession() {
  const {
    currentProject,
    sessions,
    currentSession,
    isLoading,
    isSessionsLoading,
    hasFetchedSessions,
    createSession,
    selectSession,
    renameSession,
    deleteSession,
    fetchSessions
  } = useProjectStore();

  const projectId = currentProject?._id || null;

  const handleFetchSessions = useCallback(async (search: string) => {
    if (!projectId) return;
    await fetchSessions(projectId, undefined, search);
  }, [projectId, fetchSessions]);

  const handleCreateSession = useCallback(async (overrideProjectId?: string) => {
    const id = overrideProjectId || projectId;
    if (!id) return;
    return await createSession(id);
  }, [projectId, createSession]);

  const handleRenameSession = useCallback(async (sessionId: string, title: string) => {
    if (!projectId) return;
    await renameSession(projectId, sessionId, title);
  }, [projectId, renameSession]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!projectId) return;
    await deleteSession(projectId, sessionId);
  }, [projectId, deleteSession]);

  return {
    projectId,
    sessions,
    currentSession,
    isLoading,
    isSessionsLoading,
    hasFetchedSessions,
    createSession: handleCreateSession,
    selectSession,
    renameSession: handleRenameSession,
    deleteSession: handleDeleteSession,
    fetchSessions: handleFetchSessions,
  };
}
