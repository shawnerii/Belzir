import axios, { type AxiosResponse } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
});

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response: AxiosResponse<T> = await api.get(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown) {
  const response: AxiosResponse<T> = await api.post(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown) {
  const response: AxiosResponse<T> = await api.patch(url, data);
  return response.data;
}

export default api;
