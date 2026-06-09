import { api } from './client';

export interface Trader {
  id: number;
  name: string;
  id_broker: string;
  server: string;
  description: string | null;
  profile_image_src: string | null;
  url: string;
  status: number;
}

export interface TraderResponse {
  data: Trader[];
  current_page: number;
  last_page: number;
  total: number;
}

export const tradersApi = {
  getAll: (page = 1) => api.get<TraderResponse>(`/trader?page=${page}`),
  getById: (id: number) => api.get<Trader>(`/trader/${id}`),
};