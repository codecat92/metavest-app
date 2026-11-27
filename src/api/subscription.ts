import { api, ApiResponse, BASE_URL, getToken } from './client';

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

export type PaymentStatus = 'pending' | 'awaiting_verification' | 'paid' | 'failed' | 'expired';

export interface Payment {
  id: string;
  order_id: string;
  plan_id: string;
  amount_idr: number;
  status: PaymentStatus;
  qris_image_url: string | null;
  proof_uploaded: boolean;
  reject_reason: string | null;
  paid_at: string | null;
}

// ── API calls ──

/** GET /plans — katalog produk aktif + plan aktif (harga dari server). */
export const getPlans = () =>
  api.get<ApiResponse<SubscriptionProduct[]>>('/plans');

/** POST /subscriptions/checkout — buat payment + dapatkan QRIS statis Metavest. */
export const checkout = (planId: string) =>
  api.post<ApiResponse<Payment>>('/subscriptions/checkout', { plan_id: planId });

/** GET /payments/{id} — status payment (refresh manual). */
export const getPayment = (id: string) =>
  api.get<ApiResponse<Payment>>(`/payments/${id}`);

/**
 * POST /payments/{id}/proof — unggah bukti transfer (multipart field `proof`).
 * Hasil: status menjadi 'awaiting_verification'.
 * Pakai fetch langsung (FormData) — pola sama dengan wallet.submitTopup.
 */
export const uploadProof = async (
  paymentId: string,
  file: { uri: string; name: string; type: string },
): Promise<ApiResponse<Payment>> => {
  const formData = new FormData();
  formData.append('proof', file as any);

  const token = getToken();
  const res = await fetch(`${BASE_URL}/payments/${paymentId}/proof`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Server returned invalid response (${res.status})`);
  }
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json;
};

/** URL gambar bukti transfer (untuk dipratinjau oleh pemilik payment). */
export const getProofUrl = (paymentId: string) => `${BASE_URL}/payments/${paymentId}/proof`;

/** GET /subscriptions/my — daftar langganan user (dashboard "Langganan Saya"). */
export const getMySubscriptions = () =>
  api.get<ApiResponse<MySubscription[]>>('/subscriptions/my');

export const subscriptionApi = {
  getPlans,
  checkout,
  getPayment,
  uploadProof,
  getProofUrl,
  getMySubscriptions,
};
