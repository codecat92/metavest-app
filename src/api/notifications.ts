import { api, ApiResponse } from './client';

export interface Notification {
  id: number;
  user_id: string;
  user_type: number;
  subject: string;
  message: string;
  created_at: string;
}

export const notificationApi = {
  getAll: (page = 1) =>
    api.get<ApiResponse<Notification[]>>(`/user-notification/all-auth?page=${page}`),

  getById: (id: number) =>
    api.get<ApiResponse<Notification>>(`/user-notification/by-id/${id}`),
};
