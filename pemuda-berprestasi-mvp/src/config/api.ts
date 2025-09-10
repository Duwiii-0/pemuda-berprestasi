const API_BASE_URL = process.env.REACT_APP_API_URL;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  let data: any = null;
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw { status: response.status, data };
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

  postFormData: (url: string, formData: FormData) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: formData,
    }).then(handleResponse),

  // ✅ TAMBAHAN: putFormData method
  putFormData: (url: string, formData: FormData) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: formData,
    }).then(handleResponse),
};