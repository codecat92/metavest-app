import { api, setToken, clearToken, ApiResponse } from './client';

// --- Types matching backend response shapes ---

interface LoginStep1Data {
  type: 'user' | 'trader';
  id_user?: string;
  id?: string;
  email: string;
  phone_number?: string;
}

interface LoginStep2Data {
  type: 'user' | 'trader';
  access_token: string;
  token_type: 'Bearer';
  token_expiration_time: string;
  id_user?: string;
  id?: string;
  email: string;
  phone_number?: string;
  fcm_token: string;
}

interface RegisterData {
  access_token: string;
  token_type: 'Bearer';
}

export interface User {
  id_user: string;
  name: string;
  email: string;
  phone_number: string | null;
  profile_image_src: string | null;
  membership_status: number;
  referral_code: string;
  referral_code_2: string;
  ktp_verified: number;
  passport_verified: number;
}

export interface RegisterPayload {
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  referral_code_2: string;
  invitation_code?: string;
  phone_number?: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

// Helper: generate a simple FCM token for dev (production would use real device token)
const getFcmToken = (): string => {
  return `dev-fcm-${Date.now()}`;
};

export const authApi = {
  /**
   * Login — step 1: verify credentials, get user type + id
   * Then step 2: exchange for Sanctum token
   */
  login: async (email: string, password: string): Promise<LoginResult> => {
    // Step 1: verify credentials
    const step1 = await api.post<ApiResponse<LoginStep1Data>>('/login', {
      email,
      password,
    });

    const userId = step1.data.id_user ?? step1.data.id;
    if (!userId) {
      throw new Error('Login failed: no user ID returned');
    }

    // Step 2: get Sanctum token
    const step2 = await api.post<ApiResponse<LoginStep2Data>>('/login-token', {
      user_id: userId,
      fcm_token: getFcmToken(),
    });

    const accessToken = step2.data.access_token;
    setToken(accessToken);

    // Fetch user profile
    const profileResponse = await api.get<User>('/auth-user');
    const user = profileResponse as unknown as User;

    return {
      token: accessToken,
      user,
    };
  },

  /**
   * Register new user — returns token directly
   */
  register: async (payload: RegisterPayload): Promise<LoginResult> => {
    const response = await api.post<ApiResponse<RegisterData>>('/register', {
      first_name: payload.first_name,
      last_name: payload.last_name ?? undefined,
      email: payload.email,
      password: payload.password,
      referral_code_2: payload.referral_code_2,
      invitation_code: payload.invitation_code ?? undefined,
      phone_number: payload.phone_number ?? undefined,
    });

    const token = response.data.access_token;
    setToken(token);

    // Fetch user profile with the new token
    const profileResponse = await api.get<User>('/auth-user');
    const user = profileResponse as unknown as User;

    return { token, user };
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } finally {
      clearToken();
    }
  },
};
