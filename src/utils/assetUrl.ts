import { BASE_URL } from '@/api/client';

const STORAGE_HOST = BASE_URL.replace(/\/api$/, '');

/**
 * Build a full, usable image/asset URL from a backend-provided path.
 * Handles null/empty, absolute (http/https), and relative paths.
 */
export function resolveAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${STORAGE_HOST}${normalized}`;
}
