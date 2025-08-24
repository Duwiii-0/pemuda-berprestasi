// src/config/api.ts
const API_BASE_URL = 'http://localhost:3000/api';

// Helper untuk mendapatkan token dari React state
let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
};

export const getAuthToken = () => currentToken;

// API client dengan error handling
export const apiClient = {
  async post(url: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken && { 'Authorization': `Bearer ${currentToken}` })
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }
      
      return result;
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },

  async get(url: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          ...(currentToken && { 'Authorization': `Bearer ${currentToken}` })
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }
      
      return result;
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  async put(url: string, data: any) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken && { 'Authorization': `Bearer ${currentToken}` })
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }
      
      return result;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  async delete(url: string) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'DELETE',
        headers: {
          ...(currentToken && { 'Authorization': `Bearer ${currentToken}` })
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }
      
      return result;
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }
};

// Auth-specific API calls
export const authAPI = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async register(data: any) {
    return await apiClient.post('/auth/register', data);
  },

  async getProfile() {
    return await apiClient.get('/auth/profile');
  },

  logout() {
    setAuthToken(null);
  }
};