import { api, ApiResponse } from './client';

export interface UserTrader {
  id: string;
  name: string;
  email: string;
  description: string | null;
  profile_image_src: string | null;
  status: number;
  follow_status?: string;
  created_at?: string;
}

export interface UserTraderListResponse {
  data: UserTrader[];
  data_count: number;
}

export const followApi = {
  getActive: (page = 1) =>
    api.get<UserTraderListResponse>(`/user-traders/active?page=${page}`),

  getFollowed: (page = 1) =>
    api.get<UserTraderListResponse>(`/user-traders/followed/list?page=${page}`),

  follow: (traderId: string) =>
    api.post<ApiResponse<any>>('/user-traders/followed/create', {
      trader_id: [traderId],
      follow_status: [1],
    }),
};
