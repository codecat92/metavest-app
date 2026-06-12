import { api, ApiResponse } from './client';

export interface Signal {
  id: number;
  trader_id: string;
  currency: number;
  signal_type: number;
  open_price: string;
  take_profit: string;
  stop_loss: string;
  risk_per_one_trade: string;
  potential_profit: string;
  signal_execution: number;
  notes: string | null;
  clicks: number;
  likes: number;
  shares: number;
  created_at: string;
}

export interface SignalListResponse {
  data: Signal[];
  data_count: number;
}

export const signalsApi = {
  getAll: (page = 1) =>
    api.get<SignalListResponse>(`/signals/all?page=${page}`),

  getById: (id: number) =>
    api.get<ApiResponse<Signal>>(`/signals/${id}`),
};
