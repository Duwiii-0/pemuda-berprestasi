// src/context/authContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import toast from 'react-hot-toast';

// Token management dengan localStorage yang proper
const tokenManager = {
  getToken: (): string | null => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        console.log('✅ Token retrieved from localStorage');
        return token;
      }
      console.log('📋 No token found in localStorage');
      return null;
    } catch (error) {
      console.error('❌ Failed to get token from localStorage:', error);
      return null;
    }
  },
  
  setToken: (token: string): void => {
    try {
      localStorage.setItem('auth_token', token);
      console.log('✅ Token saved to localStorage');
      // Backup ke window object juga
      (window as any).__auth_token = token;
    } catch (error) {
      console.error('❌ Failed to save token to localStorage:', error);
      // Fallback ke window object
      (window as any).__auth_token = token;
    }
  },
  
  removeToken: (): void => {
    try {
      localStorage.removeItem('auth_token');
      console.log('✅ Token removed from localStorage');
    } catch (error) {
      console.error('❌ Failed to remove token from localStorage:', error);
    }
    // Clear window object juga
    delete (window as any).__auth_token;
  },

  // Tambahan: Save user data juga
  saveUserData: (userData: any): void => {
    try {
      localStorage.setItem('user_data', JSON.stringify(userData));
      console.log('✅ User data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
    }
  },

  getUserData: (): any | null => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
      return null;
    }
  },

  clearUserData: (): void => {
    try {
      localStorage.removeItem('user_data');
      console.log('✅ User data cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
    }
  }
};

// API helper function dengan better error handling
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = tokenManager.getToken();
  
  // Jika logout dan tidak ada token, jangan throw error
  if (endpoint === '/auth/logout' && !token) {
    return { success: true, message: 'Already logged out' };
  }
  
  console.log(🌐 Making API request to: ${endpoint});
  
  const response = await fetch(${import.meta.env.VITE_API_URL}${endpoint}, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': Bearer ${token} }),
      ...options.headers,
    },
  });

  console.log(📡 API Response: ${response.status} ${response.statusText});

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Untuk logout, jika 401 (Unauthorized), anggap sukses karena sudah logout
    if (endpoint === '/auth/logout' && response.status === 401) {
      return { success: true, message: 'Token expired, logout successful' };
    }
    
    throw new Error(errorData.message || HTTP error! status: ${response.status});
  }

  const responseData = await response.json();
  console.log('✅ API Response data:', responseData);
  return responseData;
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
  role: 'ADMIN' | 'PELATIH' | 'ADMIN_KOMPETISI';
  admin?: {
    id_admin: number;
    nama_admin: string;
  };
  pelatih?: {
    id_pelatih: number;
    nama_pelatih: string;
    id_dojang: number;
    no_telp: string;
    kota: string;
    provinsi: string;
    alamat: string;
    tanggal_lahir: string;
    nik: string;
    jenis_kelamin: 'LAKI_LAKI' | 'PEREMPUAN' | null;  
  };
  admin_kompetisi?: {
    id_admin_kompetisi: number;
    nama: string;
    id_kompetisi: number;
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
  isAdminKompetisi: boolean;
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
        setToken(savedToken);
        
        // Try to get user data from localStorage first
        const savedUserData = tokenManager.getUserData();
        if (savedUserData) {
          console.log('📋 Restored user data from localStorage:', savedUserData);
          setUser(savedUserData);
        }

        try {
          // Verify token with server
          const response = await authAPI.verifyToken();
          if (response.success && response.data?.user) {
            console.log('✅ Token valid, user authenticated:', response.data.user);
            setUser(response.data.user);
            tokenManager.saveUserData(response.data.user);
          } else {
            console.log('❌ Token invalid, clearing stored data');
            tokenManager.removeToken();
            tokenManager.clearUserData();
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          tokenManager.removeToken();
          tokenManager.clearUserData();
          setToken(null);
          setUser(null);
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
      console.log('📊 Login API Response:', response);

      if (response.success && response.data) {
        const { token: newToken, user: userData } = response.data;
        console.log('✅ Login successful:', userData.email, userData.role);
        console.log('🔑 Received token:', newToken ? 'Yes' : 'No');

        // Store token and user data
        tokenManager.setToken(newToken);
        tokenManager.saveUserData(userData);
        setToken(newToken);
        setUser(userData);

        toast.success(Selamat datang, ${userData.admin?.nama_admin || userData.pelatih?.nama_pelatih || userData.email}!);

        return {
          success: true,
          message: response.message || 'Login successful'
        };
      } else {
        console.log('❌ Login failed - No token in response');
        return {
          success: false,
          message: response.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error('Email atau password salah');
      return {
        success: false,
        message: (error as any)?.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // ===== LOGOUT FUNCTION =====
  const logout = () => {
    console.log('🚪 Logging out user...');
    
    // Clear state immediately
    setUser(null);
    setToken(null);
    tokenManager.removeToken();
    tokenManager.clearUserData();
    
    // Optional: Call backend logout endpoint
    authAPI.logout().then(() => {
      console.log('✅ Backend logout successful');
    }).catch((error) => {
      console.log('⚠️ Backend logout failed, but local logout completed:', error);
    });
    
    toast.success('Berhasil logout');
    console.log('✅ Logout completed');
  };

  // ===== REGISTER FUNCTION =====
  const register = async (userData: any): Promise<{success: boolean; message: string}> => {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        console.log('✅ Registration successful');
        toast.success('Registrasi berhasil!');
      } else {
        console.log('❌ Registration failed:', response.message);
        toast.error(response.message || 'Registrasi gagal');
      }
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('❌ Registration error:', error);
      toast.error(errorMessage);
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
  const isAdminKompetisi = user?.role === 'ADMIN_KOMPETISI';
  const userName = user?.admin?.nama_admin || user?.pelatih?.nama_pelatih || user?.admin_kompetisi?.nama || user?.email || 'User';

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
    isAdminKompetisi,
    userName,
  };

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