import { api, setToken, clearToken } from './client';

export interface LoginResponse {
  token: string;
  user: {
    id_user: string;
    name: string;
    email: string;
    profile_image_src: string | null;
    membership_status: number;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', { email, password });
    // Store token immediately after login
    setToken(response.token);
    return response;
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/register', payload);
    setToken(response.token);
    return response;
  },

  logout: async () => {
    try {
      await api.post('/logout', {});
    } finally {
      clearToken();
    }
  },
};