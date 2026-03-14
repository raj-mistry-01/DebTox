import { User } from '@/types';
import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { getToken, removeToken, saveToken, getUser, saveUser, removeUser } from '@/services/storage';
import { router } from 'expo-router';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string, upiId?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  updateProfile: (name?: string, phone?: string, upiId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token and user on app start
  useEffect(() => {
    restoreToken();
  }, []);

  const restoreToken = async () => {
    try {
      const token = await getToken();
      const user = await getUser();
      
      if (token && user) {
        apiClient.setToken(token);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to restore token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.signIn(email, password);
      
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        upiId: response.user.upiId,
      };

      apiClient.setToken(response.accessToken);
      await saveToken(response.accessToken);
      await saveUser(user);

      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    console.log('Google Login started auth');
    try {
      setIsLoading(true);
      const response = await apiClient.googleSignIn(idToken);

      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        avatarUrl: response.user.avatarUrl,
      };

      console.log('Google Login successful, user:', user);

      apiClient.setToken(response.accessToken);
      await saveToken(response.accessToken);
      await saveUser(user);

      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('Google sdfklajsfasfja;skfj');
      console.log('Google error');
      // console.error('Google Login failed:', error);
      throw error;
    } finally {
      console.log('Google settale');
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, upiId?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.signUp(name, email, password, upiId);
      
      const user: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
      };

      apiClient.setToken(response.accessToken);
      await saveToken(response.accessToken);
      await saveUser(user);

      setCurrentUser(user);
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      apiClient.clearToken();
      await removeToken();
      await removeUser();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (name?: string, phone?: string, upiId?: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.updateProfile(name, phone, upiId);
      
      const updatedUser: User = {
        ...currentUser!,
        ...(response.user || {}),
      };

      await saveUser(updatedUser);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        isLoading,
        login,
        googleLogin,
        register,
        logout,
        restoreToken,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
