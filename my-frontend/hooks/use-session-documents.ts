import { useQuery } from '@tanstack/react-query';
import { documentService, DocumentAsset } from '@/lib/api/services/document';

export function useSessionDocuments(sessionId: string | null) {
  return useQuery({
    queryKey: ['session-documents', sessionId],
    queryFn: async (): Promise<DocumentAsset[]> => {
      if (!sessionId) return [];
      return await documentService.getSessionDocuments(sessionId);
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}
