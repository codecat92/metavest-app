import { api, ApiResponse, BASE_URL, getToken } from './client';

export interface CopyTradeSlot {
  slot_id: string;
  status: string; // queued | waiting_credentials | active | ready | releasing | error
  copy_enabled: boolean;
  volume_ratio: number;
  error?: string | null;
  can_trade?: boolean | null;
  connected?: boolean | null;
  algo_trading?: boolean | null;
  has_open_positions?: boolean | null;
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

const TIMEOUT_MS = 45000;

/**
 * Request dengan timeout eksplisit (AbortController). Dipakai khusus copy-trade
 * supaya kalau bridge/backend hang, UI tidak menggantung selamanya.
 */
async function requestWithTimeout<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: object
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Request failed');
    }
    return json as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Koneksi ke server trading timeout. Coba lagi.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const copytradeApi = {
  subscribe: (account: string, password: string, mt5Server: string, volumeRatio = 1.0) =>
    requestWithTimeout<ApiResponse<{ slot_id: string; status: string }>>(
      '/copytrades/subscribe',
      'POST',
      { account, password, mt5_server: mt5Server, volume_ratio: volumeRatio }
    ),

  activate: () =>
    requestWithTimeout<ApiResponse<{ slot_id: string; status: string }>>(
      '/copytrades/activate',
      'POST',
      {}
    ),

  getStatus: () =>
    requestWithTimeout<ApiResponse<CopyTradeSlot | null>>('/copytrades/status', 'GET'),

  toggleCopy: (enabled: boolean, volumeRatio?: number) =>
    requestWithTimeout<ApiResponse<any>>('/copytrades/copy', 'POST', {
      enabled,
      ...(volumeRatio !== undefined ? { volume_ratio: volumeRatio } : {}),
    }),

  getAccount: () =>
    requestWithTimeout<ApiResponse<Mt5AccountData>>('/copytrades/account', 'GET'),

  getPositions: () =>
    requestWithTimeout<ApiResponse<{ slot_id?: string; age_sec?: number; positions: Mt5Position[] }>>(
      '/copytrades/positions',
      'GET'
    ),

  unsubscribe: () =>
    requestWithTimeout<ApiResponse<any>>('/copytrades/unsubscribe', 'POST'),
};
