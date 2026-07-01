import { useInfiniteQuery } from '@tanstack/react-query';
import { chatService } from '@/lib/api/services/chat';

interface UseChatHistoryProps {
  projectId: string;
  sessionId: string;
}

export function useChatHistory({ projectId, sessionId }: UseChatHistoryProps) {
  return useInfiniteQuery({
    queryKey: ['chatHistory', sessionId],
    
    queryFn: ({ pageParam }) => 
      chatService.getHistory(projectId, sessionId, pageParam as string | undefined),
      
    initialPageParam: undefined as string | undefined,
    
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined;
    },
    
    staleTime: 1000 * 60 * 5, 
  });
}
