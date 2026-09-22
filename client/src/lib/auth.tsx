import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { tokenStore } from './api';
import type { AdminUser } from './types';

interface AuthState {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({ admin: null, loading: true, login: async () => undefined, logout: async () => undefined, refresh: async () => undefined });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    // Probe the session when we hold a token OR we're inside the admin area
    // (the HTTP-only cookie may still carry a valid session even if local storage is empty).
    const onAdmin = window.location.pathname.startsWith('/admin');
    if (!tokenStore.get() && !onAdmin) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setAdmin(data.admin);
    } catch (err: any) {
      // Only a definitive 401/403 ends the session; network hiccups keep the current state.
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        tokenStore.clear();
        setAdmin(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.token);
    setAdmin(data.admin);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    setAdmin(null);
  };

  return <AuthCtx.Provider value={{ admin, loading, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}
