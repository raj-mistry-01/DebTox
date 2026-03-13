import { User } from '@/types';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock current user for scaffolding
const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatarUrl: undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    // Stub — replace with real API call
    await new Promise((r) => setTimeout(r, 500));
    setCurrentUser({ ...MOCK_USER, email });
    setIsAuthenticated(true);
  };

  const register = async (name: string, email: string, _password: string) => {
    // Stub — replace with real API call
    await new Promise((r) => setTimeout(r, 500));
    setCurrentUser({ id: 'user-new', name, email });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
