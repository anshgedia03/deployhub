import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, SendMessageDto } from '@/lib/api/services/chat';

interface UseSendMessageProps {
  projectId: string;
  sessionId: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useSendMessage({ projectId, sessionId, onSuccess, onError }: UseSendMessageProps) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageDto) =>
      chatService.sendMessage(projectId, sessionId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session-documents', sessionId] });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
      queryClient.invalidateQueries({ queryKey: ['session-documents', sessionId] });
    },
  });
}
