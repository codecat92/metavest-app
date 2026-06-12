// Base API client — connects to local development backend
// Ganti IP sesuai IP mesin kamu (cek pakai: ipconfig getifaddr en0)
const BASE_URL = 'http://192.168.1.24:8000/api';

// Backend response always wraps data in { message, data, data_count? }
export interface ApiResponse<T> {
  message: string;
  data: T;
  data_count?: number;
}

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Token management — todo: replace with AsyncStorage/SecureStore
let authToken: string | null = null;

export const setToken = (token: string) => {
  authToken = token;
};

export const getToken = () => authToken;

export const clearToken = () => {
  authToken = null;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = { ...defaultHeaders };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: object) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body: object) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
