import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as loginRequest } from '../services/api';
import type { LoginResponse, UserRole } from '../types/models';

type AuthContextValue = {
  user: LoginResponse | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  role: UserRole | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    const raw = localStorage.getItem('gsh_user');
    return raw ? JSON.parse(raw) as LoginResponse : null;
  });

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    login: async (username: string, password: string) => {
      const response = await loginRequest(username, password);
      localStorage.setItem('gsh_token', response.accessToken);
      localStorage.setItem('gsh_user', JSON.stringify(response));
      setUser(response);
    },
    logout: () => {
      localStorage.removeItem('gsh_token');
      localStorage.removeItem('gsh_user');
      setUser(null);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
