'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError } from './api-client';

interface AuthenticatedUser {
  phoneOrUsername: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextValue {
  accessToken: string | null;
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (phoneOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwtPayload(token: string): AuthenticatedUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { phoneOrUsername: payload.phoneOrUsername, roles: payload.roles, permissions: payload.permissions };
  } catch {
    return null;
  }
}

/**
 * Holds the access token in memory ONLY — never localStorage/sessionStorage,
 * to limit XSS exposure (docs/ARCHITECTURE.md §6 threat model). On mount,
 * silently attempts a refresh using the httpOnly refresh-token cookie so a
 * page reload doesn't force a re-login as long as the refresh token is
 * still valid.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => (accessToken ? decodeJwtPayload(accessToken) : null), [accessToken]);

  useEffect(() => {
    apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
      .then((res) => setAccessToken(res.accessToken))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (phoneOrUsername: string, password: string) => {
    const res = await apiFetch<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneOrUsername, password }),
    });
    setAccessToken(res.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setAccessToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
