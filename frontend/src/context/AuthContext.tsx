import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rxresolve_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const u = await api.getMe();
          setUser(u);
        } catch {
          // Token expired or invalid, auto-login with default practice staff for demo
          await demoLogin('PRACTICE_STAFF');
        }
      } else {
        // Auto-login with default demo user on first visit
        await demoLogin('PRACTICE_STAFF');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const demoLogin = async (role: UserRole) => {
    try {
      const res = await api.demoLogin(role);
      localStorage.setItem('rxresolve_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    } catch (err) {
      console.error('Demo login failed', err);
    }
  };

  const login = async (email: string, password?: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('rxresolve_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('rxresolve_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: UserRole) => {
    await demoLogin(role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
