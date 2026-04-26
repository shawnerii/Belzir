import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from '@/services/api';
import { AuthContext, TokenExpiredError, type AuthUser, type AuthContextValue } from './auth-context';

type JwtPayload = {
  id: number;
  email: string;
  role: string;
  exp: number;
};

const TOKEN_KEY = 'iam_token';

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
}

function parseJwt(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payloadText = decodeBase64Url(parts[1]);
  const payload = JSON.parse(payloadText) as Partial<JwtPayload>;

  if (
    typeof payload.id !== 'number' ||
    typeof payload.email !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    throw new Error('JWT payload is missing required claims');
  }

  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    exp: payload.exp,
  };
}

function isExpired(exp: number): boolean {
  return exp <= Math.floor(Date.now() / 1000);
}

function getInitialAuthState(): { token: string | null; user: AuthUser | null } {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (!storedToken) {
    return { token: null, user: null };
  }

  try {
    const payload = parseJwt(storedToken);
    if (isExpired(payload.exp)) {
      localStorage.removeItem(TOKEN_KEY);
      return { token: null, user: null };
    }

    return {
      token: storedToken,
      user: { id: payload.id, email: payload.email, role: payload.role },
    };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ token, user }, setAuthState] = useState(() => getInitialAuthState());

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthState({ token: null, user: null });
  }, []);

  const login = useCallback((nextToken: string) => {
    const payload = parseJwt(nextToken);
    if (isExpired(payload.exp)) {
      throw new TokenExpiredError();
    }

    localStorage.setItem(TOKEN_KEY, nextToken);
    setAuthState({
      token: nextToken,
      user: { id: payload.id, email: payload.email, role: payload.role },
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      window.location.replace('/login');
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
