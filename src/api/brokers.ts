import { api, ApiResponse } from './client';

export interface Broker {
  id: number;
  name: string;
  information: string;
  url: string;
  status: number;
}

export const brokerApi = {
  getAll: () =>
    api.get<ApiResponse<Broker[]>>('/provider-broker?page=1'),

  getById: (id: number) =>
    api.get<ApiResponse<Broker>>(`/provider-broker/${id}`),
};
