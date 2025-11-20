// API Client dengan error handling yang diperbaiki
const API_BASE_URL = 'https://cjvmanagementevent.com/api';

interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
}

interface ApiError {
  status: number;
  data: any;
  message: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // ✅ PERBAIKAN: Method untuk handle response dan error
  private async handleResponse<T>(response: Response): Promise<T> {
    let responseData;
    
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse response JSON:', parseError);
      // Jika tidak bisa parse JSON, buat structure minimal
      responseData = { 
        message: `HTTP ${response.status}: ${response.statusText}`,
        success: false 
      };
    }

    if (!response.ok) {
      // ✅ PERBAIKAN: Throw structured error object
      const apiError: ApiError = {
        status: response.status,
        data: responseData,
        message: responseData?.message || `HTTP error! status: ${response.status}`
      };
      throw apiError;
    }

    return responseData;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("auth_token");
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // ✅ PERBAIKAN: Re-throw structured error
      if (error.status) {
        // Already structured error from handleResponse
        throw error;
      } else {
        // Network or other error
        throw {
          status: 0,
          data: null,
          message: error.message || 'Network error'
        };
      }
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ✅ PERBAIKAN: postFormData dengan error handling yang lebih baik
  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem("auth_token");
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let browser set it automatically
      },
      body: formData,
    };

    try {
      console.log('📤 Sending FormData to:', `${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      console.log('📡 Response status:', response.status);
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ postFormData error:', error);
      
      // ✅ PERBAIKAN: Re-throw structured error
      if (error.status) {
        // Already structured error from handleResponse
        throw error;
      } else {
        // Network or other error
        throw {
          status: 0,
          data: null,
          message: error.message || 'Network error during FormData upload'
        };
      }
    }
  }

  // ✅ PERBAIKAN: putFormData dengan error handling yang konsisten
  async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem("auth_token");
    
    const config: RequestInit = {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let browser set it automatically
      },
      body: formData,
    };

    try {
      console.log('📤 Sending PUT FormData to:', `${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      console.log('📡 Response status:', response.status);
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ putFormData error:', error);
      
      // ✅ PERBAIKAN: Re-throw structured error
      if (error.status) {
        throw error;
      } else {
        throw {
          status: 0,
          data: null,
          message: error.message || 'Network error during FormData upload'
        };
      }
    }
  }
}

export const apiClient = new APIClient(API_BASE_URL);
export default apiClient;