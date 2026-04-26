import { createContext } from 'react';

export type AuthUser = {
  id: number;
  email: string;
  role: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export class TokenExpiredError extends Error {
  constructor(message = 'Token is expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}
