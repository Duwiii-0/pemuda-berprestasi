// src/context/authContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ===== API CONFIGURATION =====
const API_BASE_URL = 'http://localhost:3000/api';

// Token management (using memory storage for Claude.ai compatibility)
const tokenManager = {
  getToken: (): string | null => (window as any).__auth_token || null,
  setToken: (token: string): void => { 
    (window as any).__auth_token = token; 
  },
  removeToken: (): void => { 
    delete (window as any).__auth_token; 
  }
};

// API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = tokenManager.getToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// API endpoints
const authAPI = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  logout: () => 
    apiRequest('/auth/logout', { method: 'POST' }),
  
  verifyToken: () => 
    apiRequest('/auth/verify', { method: 'GET' }),

  register: (userData: any) =>
    apiRequest('/auth/register', {
      method: 'POST', 
      body: JSON.stringify(userData),
    }),
};

// ===== TYPE DEFINITIONS =====
interface User {
  id_akun: number;
  email: string;
  role: 'ADMIN' | 'PELATIH';
  admin?: {
    id_admin: number;
    nama: string;
  };
  pelatih?: {
    id_pelatih: number;
    nama: string;
  };
}

interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<{success: boolean; message: string}>;
  logout: () => void;
  register: (userData: any) => Promise<{success: boolean; message: string}>;
  
  // Computed values
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPelatih: boolean;
  userName: string;
}

// ===== CONTEXT CREATION =====
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ===== INITIALIZATION =====
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔄 Initializing authentication...');
      
      const savedToken = tokenManager.getToken();
      if (savedToken) {
        console.log('🔍 Found saved token, verifying...');
        try {
          const response = await authAPI.verifyToken();
          if (response.success && response.data?.user) {
            console.log('✅ Token valid, user authenticated:', response.data.user.email);
            setUser(response.data.user);
            setToken(savedToken);
          } else {
            console.log('❌ Token invalid, removing...');
            tokenManager.removeToken();
          }
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          tokenManager.removeToken();
        }
      } else {
        console.log('📋 No saved token found');
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // ===== LOGIN FUNCTION =====
  const login = async (email: string, password: string): Promise<{success: boolean; message: string}> => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        
        console.log('✅ Login successful:', userData.email, userData.role);
        
        // Store token and user data
        tokenManager.setToken(newToken);
        setToken(newToken);
        setUser(userData);
        
        return {
          success: true,
          message: response.message || 'Login successful'
        };
      } else {
        console.log('❌ Login failed:', response.message);
        return {
          success: false,
          message: response.message || 'Login failed'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // ===== LOGOUT FUNCTION =====
  const logout = () => {
    console.log('🚪 Logging out user...');
    
    // Clear state
    setUser(null);
    setToken(null);
    tokenManager.removeToken();
    
    // Optional: Call backend logout endpoint
    authAPI.logout().catch((error) => {
      console.error('⚠️ Logout API call failed:', error);
    });
    
    console.log('✅ Logout completed');
  };

  // ===== REGISTER FUNCTION =====
  const register = async (userData: any): Promise<{success: boolean; message: string}> => {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await authAPI.register(userData);
      
      console.log(response.success ? '✅ Registration successful' : '❌ Registration failed:', response.message);
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('❌ Registration error:', error);
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // ===== COMPUTED VALUES =====
  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === 'ADMIN';
  const isPelatih = user?.role === 'PELATIH';
  const userName = user?.admin?.nama || user?.pelatih?.nama || user?.email || 'User';

  // ===== CONTEXT VALUE =====
  const value: AuthContextType = {
    // State
    user,
    token,
    loading,
    
    // Actions
    login,
    logout,
    register,
    
    // Computed
    isAuthenticated,
    isAdmin,
    isPelatih,
    userName,
  };

  // Debug logging (remove in production)
  useEffect(() => {
    console.log('🔍 Auth State:', {
      isAuthenticated,
      role: user?.role,
      userName,
      hasToken: !!token
    });
  }, [isAuthenticated, user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===== HOOK =====
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};