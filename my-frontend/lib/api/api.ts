'use client';

import axios from 'axios';
import { apiClient } from './apiClient';
import { RESPONSE_CODES, API_METHODS } from '@/constants/api';
import { buildUrl } from '@/utils/urlBuilder';
import { showToastGlobal } from '@/contexts/ToastContext';

interface ApiParams<T = any> {
  method: keyof typeof API_METHODS;
  endpoint: string;
  data?: T;
  showToast?: boolean;
  headers?: Record<string, string>;
  pathParams?: Record<string, string>;
  queryParams?: Record<string, string>;
  isMultipart?: boolean;
  skipAuth?: boolean;
  module?: string;
  baseUrl?: string;
  signal?: AbortSignal;
}

/** Shape of error payload we read for toast messages (backend may send message/detail). */
interface ErrorResponseData {
  message?: string | string[];
  detail?: string;
}

/** Prefer typing R explicitly or validating the response (e.g. Zod) at call sites. */
export const api = async <T = any, R = any>({
  endpoint,
  method,
  data,
  showToast = false,
  headers = {},
  pathParams = {},
  queryParams = {},
  isMultipart = false,
  skipAuth = false,
  module = '', // Default to empty if no versioning prefix is used by default
  baseUrl,
  signal,
}: ApiParams<T>): Promise<R> => {
  const isServer = typeof window === 'undefined';

  const relativeUrl = buildUrl(endpoint, pathParams, module);
  const configHeaders: Record<string, string> = {
    ...headers,
  };

  if (isMultipart) {
    // Axios will automatically set the correct Content-Type with boundary for FormData
  } else if (!configHeaders['Content-Type']) {
    configHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    url: baseUrl ? `${baseUrl.replace(/\/$/, '')}${relativeUrl}` : relativeUrl,
    method,
    data,
    headers: configHeaders,
    params: queryParams,
    skipAuth,
    signal,
  } as any;

  try {
    const response = await apiClient(config);
    // Show success toast if requested and message exists
    if (showToast && !isServer && response.data?.message) {
      showToastGlobal(response.data.message, 'success');
    }

    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    const response = error.response;
    if (!response) {
      throw error;
    }

    const errData = response.data as ErrorResponseData | undefined;
    const rawMsg = errData?.message ?? errData?.detail;
    const msg = Array.isArray(rawMsg) ? rawMsg[0] : rawMsg;

    if (showToast && !isServer) {
      const status = response.status;
      const toastMsg = msg || (status === RESPONSE_CODES.TOO_MANY_REQUEST ? 'Too many requests' :
        status === RESPONSE_CODES.INTERNAL_SERVER_ERROR ? 'Something went wrong!' :
          status === RESPONSE_CODES.UNAUTHORIZED ? 'Unauthorized' :
            status === RESPONSE_CODES.FORBIDDEN ? 'Access forbidden' :
              status === RESPONSE_CODES.BAD_REQUEST ? 'Invalid request' :
                `Request failed with status ${status}`);

      showToastGlobal(toastMsg, status === RESPONSE_CODES.TOO_MANY_REQUEST ? 'warning' : 'error');
    }

    throw error;
  }
};
