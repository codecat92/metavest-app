export function formatMP(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0';
}
