import { api, ApiResponse, BASE_URL } from './client';

// Host file statis (uploads) = BASE_URL tanpa "/api". Dipakai untuk membangun
// URL gambar agar TIDAK bergantung pada APP_URL backend (yang bisa salah di
// staging/IP sementara). Pola sama dengan ProfileScreen (STORAGE_HOST).
const STORAGE_HOST = BASE_URL.replace(/\/api\/?$/, '');

/**
 * Bangun URL gambar final dari icon_path (relatif) dengan host API.
 * Fallback: bila hanya tersedia icon_url absolut (mis. ber-host localhost yang
 * tidak reachable), ganti origin-nya dengan STORAGE_HOST.
 */
export function resolveAssetUrl(iconPath?: string | null, iconUrl?: string | null): string | null {
  if (iconPath) {
    return `${STORAGE_HOST}/${String(iconPath).replace(/^\/+/, '')}`;
  }
  if (iconUrl) {
    // Ambil path-nya saja, lalu tempel ke STORAGE_HOST yang benar.
    const m = String(iconUrl).match(/^https?:\/\/[^/]+(\/.*)$/);
    if (m) return `${STORAGE_HOST}${m[1]}`;
    if (iconUrl.startsWith('/')) return `${STORAGE_HOST}${iconUrl}`;
    return iconUrl;
  }
  return null;
}

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
  icon_path?: string | null;
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
  icon_path: string | null;
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
