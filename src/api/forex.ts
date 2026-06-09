import { api } from './client';

export interface ForexCurrency {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
}

export const forexApi = {
  getCurrencies: () => api.get<ForexCurrency[]>('/forex/curr'),
};