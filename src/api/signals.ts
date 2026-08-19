import { api, ApiResponse, getToken, BASE_URL } from './client';

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
  is_trader_subscribed: boolean; // computed server-side, true if active subscription exists for current user+trader
  subscription_price?: number;   // metapoints/month, only present when price_value > 0
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

export const PIP_DECIMALS: Record<number, number> = {
  1: 5, 2: 2, 3: 5, 4: 3, 5: 5, 6: 5, 7: 3, 8: 3, 9: 5, 10: 5, 11: 5,
};

export function formatPrice(value: any, currencyId: number): string {
  const num = Number(value);
  if (isNaN(num)) return '-';
  const decimals = PIP_DECIMALS[currencyId] ?? 5;
  const normalized = num / Math.pow(10, decimals);
  return normalized.toFixed(decimals);
}

export interface TraderSubscriptionSuccess {
  expires_at: string;
  metapoint_paid: number;
  wallet_balance: number;
}

export interface TraderSubscriptionError {
  error: string;
  required?: number;
  balance?: number;
  expires_at?: string;
}

export const signalsApi = {
  getAll: (page = 1) =>
    api.get<SignalListResponse>(`/signals/all?page=${page}`),

  getByTrader: (traderId: string, page = 1) =>
    api.get<SignalListResponse>(`/signals/all?page=${page}&trader_id=${traderId}`),

  getFollowed: (page = 1) =>
    api.get<SignalListResponse>(`/signals/followed?page=${page}`),

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

  /**
   * Subscribe ke trader (bulanan, Metapoint). Pakai raw fetch agar body 402/409
   * yang terstruktur bisa dibaca (api.post helper membuang body pada non-2xx).
   */
  subscribeTrader: async (traderId: string): Promise<{ status: number; data: TraderSubscriptionSuccess | TraderSubscriptionError }> => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/trader-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ trader_id: traderId }),
    });
    const json = await res.json();
    return { status: res.status, data: json };
  },

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
