import { api, ApiResponse } from './client';

export interface Mt5Account {
  id: number;
  user_id: string;
  account: string;
  password: string;
  mt5_server: string;
  created_at: string;
}

export interface Mt5Position {
  ticket?: number;
  symbol?: string;
  type?: number;
  volume?: number;
  open_price?: number;
  current_price?: number;
  profit?: number;
  swap?: number;
  comment?: string;
}

export const copytradeApi = {
  getSubscriberInfo: () =>
    api.get<ApiResponse<Mt5Account>>('/copytrades/subscriber/info'),

  getMt5Account: () =>
    api.get<ApiResponse<any>>('/copytrades/subscriber/mt5/account'),

  getMt5Positions: () =>
    api.get<ApiResponse<any>>('/copytrades/subscriber/mt5/positions-orders'),

  subscribe: (account: string, password: string, mt5Server: string) =>
    api.post<ApiResponse<any>>('/copytrades/subscribe', {
      account,
      password,
      mt5_server: mt5Server,
    }),

  unsubscribe: () =>
    api.post<ApiResponse<any>>('/copytrades/unsubscribe'),

  getArchive: () =>
    api.get<ApiResponse<any>>('/copytrades/archive/own/all'),
};
