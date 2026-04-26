import axios, { AxiosError, type AxiosResponse } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

let onUnauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorizedHandler = handler;
}

function isLoginRequest(url?: string): boolean {
  if (!url) {
    return false;
  }
  const clean = url.split('?')[0];
  return clean.endsWith('/auth/login');
}

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem('iam_token');
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;

    if (status === 401 && !isLoginRequest(requestUrl)) {
      onUnauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);

export async function get<T>(url: string) {
  const response: AxiosResponse<T> = await api.get(url);
  return response.data;
}

export async function post<T>(url: string, data?: unknown) {
  const response: AxiosResponse<T> = await api.post(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: unknown) {
  const response: AxiosResponse<T> = await api.put(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown) {
  const response: AxiosResponse<T> = await api.patch(url, data);
  return response.data;
}

export async function del(url: string): Promise<void> {
  await api.delete(url);
}

export default api;
