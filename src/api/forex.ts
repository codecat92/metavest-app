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

export const forexApi = {
  getCurrencies: () =>
    api.get<ForexListResponse>('/forex/curr'),

  getPrice: (symbol: string) =>
    api.post<ForexQuote>('/forex/percentage', { symbol }),
};
