import { api, ApiResponse } from './client';

export interface Wallet {
  id_wallet: string;
  user_id: string;
  user_type: number;
  balance: number;
  status?: number;
}

export interface WalletHistoryItem {
  id: number;
  id_wallet: string;
  type: string;
  amount: number;
  status: number;
  created_at: string;
  identifier?: string;
  transfer_type?: number;
}

export interface WalletHistoryResponse {
  data: WalletHistoryItem[];
  data_count: number;
}

export const walletApi = {
  getById: () =>
    api.get<ApiResponse<Wallet>>('/wallet/byid'),

  getHistory: (page = 1) =>
    api.get<WalletHistoryResponse>(`/wallet/history?page=${page}`),

  requestTopUp: () =>
    api.post<ApiResponse<any>>('/wallet/request-top-up'),

  validateTopUp: (amount: number) =>
    api.post<ApiResponse<any>>('/wallet/top-up', { amount }),

  withdraw: (amount: number) =>
    api.post<ApiResponse<any>>('/wallet/withdraw', { amount }),
};
