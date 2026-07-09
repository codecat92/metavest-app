import { api, ApiResponse } from './client';

export interface Signal {
  id: number;
  trader_id: string;
  trader_name: string | null;
  trader_avatar_url: string | null;
  currency: number;
  currency_name: string;
  signal_type: number;
  signal_type_name: string;
  open_price: string;
  take_profit: string;
  stop_loss: string;
  risk_per_one_trade: string;
  potential_profit: string;
  risk_reward_ratio: number | null;
  price: number;
  price_value: number;
  price_name: string;
  signal_execution: number;
  notes: string | null;
  clicks: number;
  likes: number;
  shares: number;
  is_liked: number;
  created_at: string;
  created_at_formatted: string;
  total_signals: number;
  info: Record<string, any> | null;
  payment_info: Record<string, any> | null;
}

export interface SignalListResponse {
  data: Signal[];
  data_count: number;
}

export interface CreateSignalRequest {
  currency: number;
  signal_type: number;
  price: number;
  price_value?: number | null;
  open_price: string;
  take_profit: string;
  stop_loss: string;
  risk_per_one_trade: string;
  potential_profit: string;
  notes?: string | null;
}

export interface UpdateSignalRequest {
  id: number;
  currency?: number;
  signal_type?: number;
  price?: number;
  price_value?: number | null;
  open_price?: string;
  take_profit?: string;
  stop_loss?: string;
  risk_per_one_trade?: string;
  potential_profit?: string;
  notes?: string | null;
}

export const signalsApi = {
  getAll: (page = 1) =>
    api.get<SignalListResponse>(`/signals/all?page=${page}`),

  getById: (id: number) =>
    api.get<ApiResponse<Signal>>(`/signals/${id}`),

  like: (id: number) =>
    api.post<ApiResponse<any>>(`/signals/like/${id}`),

  unlike: (id: number) =>
    api.post<ApiResponse<any>>(`/signals/unlike/${id}`),

  share: (id: number) =>
    api.post<ApiResponse<any>>(`/signals/share/${id}`),

  click: (id: number) =>
    api.post<ApiResponse<any>>(`/signals/click/${id}`),

  execute: (id: number) =>
    api.post<ApiResponse<any>>('/signals/execute', { id }),

  // Trader CRUD
  create: (data: CreateSignalRequest) =>
    api.post<ApiResponse<Signal>>('/user-traders/signals/create', data),

  update: (data: UpdateSignalRequest) =>
    api.post<ApiResponse<Signal>>('/user-traders/signals/update', data),

  delete: (id: number) =>
    api.post<ApiResponse<any>>('/user-traders/signals/delete', { id }),

  getOwn: (page = 1) =>
    api.get<SignalListResponse>(`/user-traders/signals/own?page=${page}`),
};
