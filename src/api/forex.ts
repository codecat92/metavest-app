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

export const forexApi = {
  getCurrencies: () =>
    api.get<ForexListResponse>('/forex/curr'),
};
