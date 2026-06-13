import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API client — staging backend on Render.com
const BASE_URL = 'https://metavest-backend.onrender.com/api';

const TOKEN_KEY = 'metavest_auth_token';

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

// Token management — persisted with AsyncStorage
let authToken: string | null = null;

// Load persisted token on startup
AsyncStorage.getItem(TOKEN_KEY).then((stored) => {
  if (stored) authToken = stored;
});

export const setToken = async (token: string) => {
  authToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => authToken;

export const clearToken = async () => {
  authToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// Check if a stored token exists (for auto-login)
export const hasStoredToken = async (): Promise<boolean> => {
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  if (stored) {
    authToken = stored;
    return true;
  }
  return false;
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
