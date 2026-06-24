import { api, ApiResponse } from './client';

interface TradeUrlResponse {
  url: string;
}

export const settingsApi = {
  getTradeUrl: () =>
    api.get<ApiResponse<TradeUrlResponse>>('/settings/trade-url'),
};
