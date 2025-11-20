const API_BASE_URL = process.env.REACT_APP_API_URL;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// ✅ PERBAIKAN: handleResponse dengan error handling yang lebih robust
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  let data: any = null;
  
  try {
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (parseError) {
    console.error('Error parsing response:', parseError);
    data = null;
  }

  if (!response.ok) {
    // ✅ PERBAIKAN: Throw object dengan struktur yang benar
    const error = {
      status: response.status,
      data: data,
      message: data?.message || `HTTP error! status: ${response.status}`
    };
    
    console.log('🚨 API Error:', error);
    throw error;
  }

  return data;
};

export const apiClient = {
  get: (url: string) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    }).then(handleResponse),

  post: (url: string, data?: any) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    }).then(handleResponse),

  put: (url: string, data?: any) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    }).then(handleResponse),

  delete: (url: string) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    }).then(handleResponse),

  // ✅ PERBAIKAN: postFormData dengan error handling yang lebih baik
  postFormData: (url: string, formData: FormData) => {
    console.log('📡 Making FormData POST request to:', `${API_BASE_URL}${url}`);
    
    return fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        // Don't set Content-Type for FormData - browser will set it automatically with boundary
      },
      body: formData,
    }).then(async (response) => {
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      try {
        return await handleResponse(response);
      } catch (error) {
        console.error('📡 handleResponse error:', error);
        throw error;
      }
    }).catch((error) => {
      console.error('📡 Network or parsing error:', error);
      throw error;
    });
  },

  putFormData: (url: string, formData: FormData) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: formData,
    }).then(handleResponse),
};