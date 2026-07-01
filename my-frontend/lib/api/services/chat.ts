import { api } from '../api';
import { API_METHODS } from '@/constants/api';

export interface ChatSession {
  _id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  filesCount?: number;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'ai' | 'model';
  content: any;
  visualizationJSON?: {
    chartType: "bar" | "line" | "area" | "pie" | "composed" | "geo";
    chartTitle: string;
    xKey: string;
    yKeys: string[];
    data: any[];
  } | null;
  onDashboard?: boolean;
  attachments?: { name: string; url: string; type: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SendMessageDto {
  text?: string;
  files?: File[];
  attachedFileIds?: string[];
}

export const chatService = {
  createSession: (projectId: string) =>
    api<any, ChatSession>({
      method: API_METHODS.POST,
      endpoint: '/project/:projectId/chats',
      pathParams: { projectId },
      data: {},
    }),

  listSessions: (projectId: string, search?: string) =>
    api<any, ChatSession[]>({
      method: API_METHODS.GET,
      endpoint: '/project/:projectId/chats',
      pathParams: { projectId },
      queryParams: search ? { search } : {},
    }),

  renameSession: (projectId: string, id: string, title: string) =>
    api<{ title: string }, { success: boolean; message: string; data: ChatSession }>({
      method: API_METHODS.PATCH,
      endpoint: '/project/:projectId/chats/:id/rename',
      pathParams: { projectId, id },
      data: { title },
    }),

  sendMessage: (projectId: string, id: string, data: SendMessageDto) => {
    const formData = new FormData();
    if (data.text) formData.append('text', data.text);
    
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }

    if (data.attachedFileIds && data.attachedFileIds.length > 0) {
      data.attachedFileIds.forEach((fileId) => {
        formData.append('attachedFileIds', fileId);
      });
    }

    return api<FormData, ChatMessage>({
      method: API_METHODS.POST,
      endpoint: '/project/:projectId/chats/:id/messages',
      pathParams: { projectId, id },
      data: formData,
      isMultipart: true,
    });
  },

  getHistory: (projectId: string, id: string, beforeTimestamp?: string) =>
    api<any, { messages: ChatMessage[]; hasMore: boolean; nextCursor: string | null }>({
      method: API_METHODS.GET,
      endpoint: '/project/:projectId/chats/:id/history',
      pathParams: { projectId, id },
      queryParams: beforeTimestamp ? { beforeTimestamp } : undefined,
    }),

  deleteSession: (projectId: string, id: string) =>
    api<any, { success: boolean }>({
      method: API_METHODS.DELETE,
      endpoint: '/project/:projectId/chats/:id',
      pathParams: { projectId, id },
    }),

  addWidget: (projectId: string, sessionId: string, messageId: string) =>
    api<any, { success: boolean }>({
      method: API_METHODS.PATCH,
      endpoint: '/dashboard/project/:projectId/chatsession/:sessionId/messages/:messageId/addWidget',
      pathParams: { projectId, sessionId, messageId },
    }),

  removeWidget: (projectId: string, sessionId: string, messageId: string) =>
    api<any, { success: boolean }>({
      method: API_METHODS.PATCH,
      endpoint: '/dashboard/project/:projectId/chatsession/:sessionId/messages/:messageId/removeWidget',
      pathParams: { projectId, sessionId, messageId },
    }),
};
