import { api, ApiResponse } from './client';

export const otpApi = {
  sendOtp: (destination: string, type = 0, userType = 'user') =>
    api.post<ApiResponse<any>>('/otp/send', {
      destination,
      type,
      user_type: userType,
    }),

  verifyOtp: (id: string, code: string) =>
    api.post<ApiResponse<any>>('/otp/verify-miss', {
      id,
      code,
    }),
};
