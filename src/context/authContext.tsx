// src/context/authContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../config/api';

interface User {
  id: number;
  email: string;
  role: string;
  nama?: string;
  nama_pelatih?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPelatih: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        setToken(response.token);
      } else {
        throw new Error(response.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    authAPI.logout();
  };

  // Auto-load user profile saat ada token
  useEffect(() => {
    const loadUserProfile = async () => {
      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.user);
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUserProfile();
  }, [token]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'ADMIN',
    isPelatih: user?.role === 'PELATIH'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};