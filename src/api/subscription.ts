import { api, ApiResponse } from './client';

// ── Types (selaras dengan backend PAYMENT_QRIS.md) ──

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price_idr: number;
}

export interface SubscriptionProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  meta?: any;
  plans: SubscriptionPlan[];
}

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'failed';

export interface Payment {
  id: string;
  order_id: string;
  plan_id: string;
  gateway: string;
  amount_idr: number;
  status: PaymentStatus;
  qr_string: string | null;
  qr_image_url: string | null;
  payment_url: string | null;
  expires_at: string | null;
  paid_at: string | null;
}

// ── API calls ──

/** GET /plans — katalog produk aktif + plan aktif (harga dari server). */
export const getPlans = () =>
  api.get<ApiResponse<SubscriptionProduct[]>>('/plans');

/** POST /subscriptions/checkout — buat payment + dapatkan data QRIS. */
export const checkout = (planId: string) =>
  api.post<ApiResponse<Payment>>('/subscriptions/checkout', { plan_id: planId });

/** GET /payments/{id} — status payment (untuk polling). */
export const getPayment = (id: string) =>
  api.get<ApiResponse<Payment>>(`/payments/${id}`);

export const subscriptionApi = {
  getPlans,
  checkout,
  getPayment,
};
