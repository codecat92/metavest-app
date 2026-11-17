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
  icon_url?: string | null;
  starting_price_idr?: number | null;
  is_subscribed?: boolean;
  current_ends_at?: string | null;
  days_remaining?: number | null;
  plans: SubscriptionPlan[];
}

export interface MySubscription {
  id: string;
  product_id: string;
  product_name: string | null;
  product_code: string | null;
  icon_url: string | null;
  ends_at: string | null;
  is_active: boolean;
  days_remaining: number;
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

/** GET /subscriptions/my — daftar langganan user (dashboard "Langganan Saya"). */
export const getMySubscriptions = () =>
  api.get<ApiResponse<MySubscription[]>>('/subscriptions/my');

export const subscriptionApi = {
  getPlans,
  checkout,
  getPayment,
  getMySubscriptions,
};
