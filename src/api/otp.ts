import { api, ApiResponse } from './client';

export interface OtpResponse {
  otp_code: string;
  expiration_time: string;
}

export const otpApi = {
  sendOtp: (destination: string, type = 0, userType = 'user') =>
    api.post<ApiResponse<OtpResponse>>('/otp/send', {
      destination,
      type,
      user_type: userType,
    }),

  verifyOtp: (userId: string, code: string) =>
    api.post<ApiResponse<any>>('/otp/verify-miss', {
      id: userId,
      code,
    }),
};
