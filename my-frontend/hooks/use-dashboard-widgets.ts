import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/lib/api/api';
import { API_METHODS } from '@/constants/api';

export interface WidgetData {
  _id: string; // The message ID
  visualizationJSON: {
    chartType: string;
    chartTitle: string;
    xKey: string;
    yKeys: string[];
    data: Record<string, any>[];
  };
}

export interface WidgetsResponse {
  success: boolean;
  data: WidgetData[];
}

export function useDashboardWidgets() {
  const queryClient = useQueryClient();
  
  const { currentProject, currentSession } = useProjectStore();
  const projectId = currentProject?._id || null;
  const chatSessionId = currentSession?._id || null;

  const {
    data: widgetsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-widgets', projectId, chatSessionId],
    queryFn: async (): Promise<WidgetsResponse> => {
      if (!projectId || !chatSessionId) {
        throw new Error("Missing projectId or chatSessionId");
      }

      const response = await api<undefined, WidgetsResponse>({
        method: API_METHODS.GET,
        endpoint: `/dashboard/project/${projectId}/chatsession/${chatSessionId}/getWidgets`,
      });

      return response;
    },
    enabled: !!projectId && !!chatSessionId && currentSession?.projectId === projectId,
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async ({ messageId }: { messageId: string }) => {
      if (!projectId || !chatSessionId) {
        throw new Error("Missing projectId or chatSessionId");
      }

      const response = await api<undefined, { success: boolean }>({
        method: API_METHODS.PATCH,
        endpoint: `/dashboard/project/${projectId}/chatsession/${chatSessionId}/messages/${messageId}/removeWidget`,
      });

      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch widgets query
      queryClient.invalidateQueries({ queryKey: ['dashboard-widgets', projectId, chatSessionId] });
      
      // Also invalidate chat history so "On Dashboard" state updates in ChatArea
      if (chatSessionId) {
        queryClient.invalidateQueries({ queryKey: ['chatHistory', chatSessionId] });
      }
    },
  });

  return {
    widgetsData,
    isLoading,
    error,
    refetch,
    deleteWidget: deleteWidgetMutation.mutate,
    isDeleting: deleteWidgetMutation.isPending,
  };
}
