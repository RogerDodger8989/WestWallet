import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from './api/api';
import type { User } from './api/api';

type AuthContextType = {
  user: User | null;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string) => Promise<void>;
  logout: () => void;
  authNotice: string | null;
  clearNotice: () => void;
  notifyAuth: (msg: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  });
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<number | null>(null);

  const scheduleRefresh = (token: string) => {
    try {
      const [, payloadB64] = token.split('.');
      const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
      const expSec = payloadJson?.exp as number | undefined;
      if (!expSec) return;
      const nowMs = Date.now();
      const expMs = expSec * 1000;
      const leadMs = 5 * 60 * 1000; // 5 min innan expiry
      const delay = Math.max(5_000, expMs - nowMs - leadMs); // minst 5s
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
      const id = window.setTimeout(async () => {
        try {
          await authAPI.refresh();
          const newToken = localStorage.getItem('accessToken');
          if (newToken) scheduleRefresh(newToken);
        } catch (e) {
          // Om refresh misslyckas, låt 401-interceptor sköta redirect/besked
        }
      }, delay);
      setRefreshTimer(id);
    } catch {
      // Ignorera decode-fel
    }
  };

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) setUser(JSON.parse(s));
    // Plocka upp eventuell pending authMessage från interceptor
    const stored = localStorage.getItem('authMessage');
    if (stored) {
      setAuthNotice(stored);
      localStorage.removeItem('authMessage');
    }
    const tok = localStorage.getItem('accessToken');
    if (tok) scheduleRefresh(tok);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authAPI.login(username, password);
    if (res.user) setUser(res.user);
    if (res.access_token) scheduleRefresh(res.access_token);
  };

  const register = async (username: string, password: string) => {
    await authAPI.register(username, password);
    await login(username, password);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    if (refreshTimer) {
      window.clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
  };

  const clearNotice = () => setAuthNotice(null);
  const notifyAuth = (msg: string) => setAuthNotice(msg);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, authNotice, clearNotice, notifyAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
