import { api, ApiResponse } from './client';

export interface ForexCurrency {
  symbol: string;
  currency_group: string;
  currency_base: string;
  currency_quote: string;
}

export interface ForexListResponse {
  data: ForexCurrency[];
  count: number;
  status: string;
}

export interface ForexQuote {
  symbol: string;
  close: string;
  change: string;
  percent_change: string;
  open: string;
  high: string;
  low: string;
}

// Simple in-memory cache with TTL
const cache: Record<string, { data: any; expiry: number }> = {};
const cacheGet = (key: string): any | null => {
  const entry = cache[key];
  if (entry && Date.now() < entry.expiry) return entry.data;
  delete cache[key];
  return null;
};
const cacheSet = (key: string, data: any, ttlMs: number) => {
  cache[key] = { data, expiry: Date.now() + ttlMs };
};

// Delay helper to spread out API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const forexApi = {
  getCurrencies: async () => {
    const cached = cacheGet('forex_curr');
    if (cached) return cached as ForexListResponse;

    const result = await api.get<ForexListResponse>('/forex/curr');
    cacheSet('forex_curr', result, 5 * 60 * 1000); // 5 min TTL
    return result;
  },

  getTimeSeries: async (symbol: string, interval = '1h') => {
    const key = `forex_ts_${symbol}_${interval}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    await delay(200);
    const result = await api.post<any>('/forex/time', { symbol, time: interval });
    cacheSet(key, result, 15 * 60 * 1000);
    return result;
  },

  getPrice: async (symbol: string) => {
    const key = `forex_price_${symbol}`;
    const cached = cacheGet(key);
    if (cached) return cached as ForexQuote;

    // Small delay between requests to avoid rate limiting
    await delay(200);

    const result = await api.post<ForexQuote>('/forex/percentage', { symbol });
    cacheSet(key, result, 15 * 60 * 1000); // 15 min TTL
    return result;
  },
};
