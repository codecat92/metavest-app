import { api, ApiResponse, getToken, BASE_URL } from './client';

export interface Wallet {
  id_wallet: string;
  user_id: string;
  user_type: number;
  balance: number;
  status?: number;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'purchase' | 'refund' | 'adjustment';
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  balance_before: number;
  balance_after: number | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface WalletBalance {
  balance: number;
  total_historical_deposit: number;
  total_transactions: number;
  pending_count: number;
  approved_count: number;
  pending_amount: number;
}

export const walletApi = {
  getById: () =>
    api.get<ApiResponse<Wallet>>('/wallet/byid'),

  requestTopUp: () =>
    api.post<ApiResponse<any>>('/wallet/request-top-up'),

  withdraw: (amount: number) =>
    api.post<ApiResponse<any>>('/wallet/withdraw', { amount }),

  submitTopup: async (amount: number, proofImageUri: string) => {
    const formData = new FormData();
    formData.append('amount', String(amount));
    formData.append('image_file', {
      uri: proofImageUri,
      name: 'proof.jpg',
      type: 'image/jpeg',
    } as any);
    const token = getToken();
    const res = await fetch(`${BASE_URL}/wallet/topup`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
      return json;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Server returned invalid response (${res.status})`);
      }
      throw e;
    }
  },

  getTransactions: (filters?: { type?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.from) params.append('from', filters.from);
    if (filters?.to) params.append('to', filters.to);
    const qs = params.toString();
    return api.get<ApiResponse<WalletTransaction[]>>(`/wallet/transactions${qs ? '?' + qs : ''}`);
  },

  getBalance: () =>
    api.get<ApiResponse<WalletBalance>>('/wallet/balance'),

  downloadReportUrl: (from?: string, to?: string): string => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString();
    const token = getToken();
    return `${BASE_URL}/wallet/report?${qs ? qs + '&' : ''}token=${token}`;
  },
};
