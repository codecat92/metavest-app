import { api, ApiResponse } from './client';

export interface CopyTradeSlot {
  slot_id: string;
  status: string; // queued | waiting_credentials | active | ready | releasing | error
  copy_enabled: boolean;
  volume_ratio: number;
  slot?: any;
}

export interface Mt5AccountData {
  slot_id?: string;
  age_sec?: number;
  balance?: number;
  equity?: number;
  margin?: number;
  margin_free?: number;
  profit?: number;
  currency?: string;
  leverage?: number;
}

export interface Mt5Position {
  ticket?: number;
  symbol?: string;
  side?: string; // BUY | SELL
  volume?: number;
  price_open?: number;
  price_current?: number;
  sl?: number;
  tp?: number;
  profit?: number;
  swap?: number;
  time?: number;
  master_ticket?: number | null;
}

export const copytradeApi = {
  subscribe: (account: string, password: string, mt5Server: string, volumeRatio = 1.0) =>
    api.post<ApiResponse<{ slot_id: string; status: string }>>('/copytrades/subscribe', {
      account,
      password,
      mt5_server: mt5Server,
      volume_ratio: volumeRatio,
    }),

  activate: () =>
    api.post<ApiResponse<{ slot_id: string; status: string }>>('/copytrades/activate', {}),

  getStatus: () =>
    api.get<ApiResponse<CopyTradeSlot | null>>('/copytrades/status'),

  toggleCopy: (enabled: boolean, volumeRatio?: number) =>
    api.post<ApiResponse<any>>('/copytrades/copy', {
      enabled,
      ...(volumeRatio !== undefined ? { volume_ratio: volumeRatio } : {}),
    }),

  getAccount: () =>
    api.get<ApiResponse<Mt5AccountData>>('/copytrades/account'),

  getPositions: () =>
    api.get<ApiResponse<{ slot_id?: string; age_sec?: number; positions: Mt5Position[] }>>(
      '/copytrades/positions'
    ),

  unsubscribe: () =>
    api.post<ApiResponse<any>>('/copytrades/unsubscribe'),
};
