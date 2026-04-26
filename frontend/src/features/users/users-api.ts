import { del, get, patch, post } from '@/services/api';
import type {
  CreateUserInput,
  CreateUserResponse,
  ListUsersResponse,
  UpdateUserInput,
  UserResponse,
} from './types';

type ListUsersParams = {
  q?: string;
  isActive?: boolean;
};

function toUsersUrl(params?: ListUsersParams): string {
  const query = new URLSearchParams();

  if (params?.q) {
    const q = params.q.trim();
    if (q.length > 0) {
      query.set('q', q);
    }
  }
  if (typeof params?.isActive === 'boolean') {
    query.set('isActive', String(params.isActive));
  }

  const encoded = query.toString();
  return encoded.length > 0 ? `/users?${encoded}` : '/users';
}

export function listUsersRequest(params?: ListUsersParams) {
  return get<ListUsersResponse>(toUsersUrl(params));
}

export function getUserRequest(id: number) {
  return get<UserResponse>(`/users/${id}`);
}

export function createUserRequest(payload: CreateUserInput) {
  return post<CreateUserResponse>('/users', payload);
}

export function updateUserRequest(id: number, payload: UpdateUserInput) {
  return patch<UserResponse>(`/users/${id}`, payload);
}

export function deleteUserRequest(id: number) {
  return del(`/users/${id}`);
}

export function activateUserRequest(id: number) {
  return post<UserResponse>(`/users/${id}/activate`);
}

export function deactivateUserRequest(id: number) {
  return post<UserResponse>(`/users/${id}/deactivate`);
}

export function resetUserPasswordRequest(id: number) {
  return post<{ temporaryPassword: string }>(`/users/${id}/reset-password`);
}
