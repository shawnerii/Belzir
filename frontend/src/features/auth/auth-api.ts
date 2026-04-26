import { post } from '@/services/api';

export type LoginResponse = {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: { id: number; email: string; username: string; role: string };
};

export function loginRequest(usernameOrEmail: string, password: string) {
  return post<LoginResponse>('/auth/login', { usernameOrEmail, password });
}

export function logoutRequest() {
  return post<void>('/auth/logout');
}
