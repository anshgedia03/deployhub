import { api } from '../api';
import { API_METHODS } from '@/constants/api';

export interface DocumentAsset {
  _id: string;
  originalFilename: string;
  mimeType: string;
  cloudinaryUrl: string;
  geminiFileUri: string;
  processingStatus: 'processing' | 'ready' | 'failed';
  createdAt?: string;
  updatedAt?: string;
  size: number
}

export const documentService = {
  uploadDocument: (file: File, sessionId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    return api<FormData, any>({
      method: API_METHODS.POST,
      endpoint: '/document',
      data: formData,
      isMultipart: true,
      showToast: false,
    });
  },

  getSessionDocuments: (sessionId: string, search?: string) =>
    api<any, DocumentAsset[]>({
      method: API_METHODS.GET,
      endpoint: '/document/all/:sessionId',
      pathParams: { sessionId },
      queryParams: search ? { search } : {},
    }),

  getDocumentMetadata: (documentId: string) =>
    api<any, DocumentAsset>({
      method: API_METHODS.GET,
      endpoint: '/document/:documentId',
      pathParams: { documentId },
    }),

  deleteDocument: (documentId: string) =>
    api<any, { success: boolean }>({
      method: API_METHODS.DELETE,
      endpoint: '/document/:documentId',
      pathParams: { documentId },
      showToast: true,
    }),
};
