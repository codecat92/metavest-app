// This is the base API client for all requests to backend
// Base URL points to the production server
const BASE_URL = 'http://157.66.4.40:8080/api';

// Default headers for all requests
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Token storage — we'll use a simple in-memory store for now
// Later we'll replace this with AsyncStorage for persistence
let authToken: string | null = null;

export const setToken = (token: string) => {
  authToken = token;
};

export const getToken = () => authToken;

export const clearToken = () => {
  authToken = null;
};

// Core fetch wrapper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = { ...defaultHeaders };

  // Attach auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// HTTP methods
export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint),

  post: <T>(endpoint: string, body: object) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: object) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};