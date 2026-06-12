import { api, ApiResponse } from './client';

export interface PAMMEntry {
  id: number;
  id_broker: string;
  id_user: string;
  status: number;
  broker_name?: string;
  user_name?: string;
  created_at: string;
}

export interface PAMMListResponse {
  data: PAMMEntry[];
  data_count: number;
}

export const pammApi = {
  getAll: () =>
    api.get<PAMMListResponse>('/pamm/all'),

  getByPage: (page = 1) =>
    api.get<PAMMListResponse>(`/pamm?page=${page}`),

  getByUser: () =>
    api.get<PAMMListResponse>('/pamm/user'),

  getById: (id: number) =>
    api.get<ApiResponse<PAMMEntry>>(`/pamm/${id}`),

  create: (idBroker: string, userName: string, status: number) =>
    api.post<ApiResponse<PAMMEntry>>('/pamm/add', {
      id_broker: idBroker,
      user_name: userName,
      status,
    }),
};
