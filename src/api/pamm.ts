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

export interface BrokerDetail {
  id: number;
  broker_id: number;
  logo_url: string | null;
  year_established: string | null;
  platform: string | null;
  address: string | null;
  min_deposit: string | null;
  spread_forex: string | null;
  max_leverage: string | null;
  licenses: { name: string; type: string }[] | null;
  description: string[] | null;
  investor_url: string | null;
  pamm_url: string | null;
  status: number;
}

export interface BrokerWithDetail {
  id: number;
  name: string;
  information: string;
  url: string;
  detail: BrokerDetail;
}

export interface PammBanner {
  id: number;
  image_url: string;
  title: string | null;
  link_type: 'broker' | 'url' | 'none';
  broker_id: number | null;
  external_url: string | null;
  sort_order: number;
  is_active: number;
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

  getBanners: () =>
    api.get<{ data: PammBanner[]; data_count: number }>('/pamm/banners'),

  getBrokers: () =>
    api.get<{ data: BrokerWithDetail[]; data_count: number }>('/pamm/brokers'),

  getBrokerDetail: (brokerId: number) =>
    api.get<ApiResponse<BrokerWithDetail>>(`/pamm/brokers/${brokerId}`),

  addPammSubmission: (brokerId: number, userName: string) =>
    api.post<{ message: string; data: any }>('/pamm/add', {
      id_broker: String(brokerId),
      user_name: userName,
      status: 1,
    }),
};
