// client/src/utils/format.ts
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatOrdinalDate(iso: string | null | undefined): { day: number; suffix: string; monthYear: string; formatted: string } {
  if (!iso) return { day: 0, suffix: '', monthYear: '', formatted: '—' };
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { day: 0, suffix: '', monthYear: '', formatted: iso };
  const day = d.getDate();
  const j = day % 10, k = day % 100;
  const suffix = (j === 1 && k !== 11) ? 'st' : (j === 2 && k !== 12) ? 'nd' : (j === 3 && k !== 13) ? 'rd' : 'th';
  const monthYear = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return { day, suffix, monthYear, formatted: `${day}${suffix} ${monthYear}` };
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export const interpolate = (text: string, data: Record<string, string>): string =>
  text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => data[k] ?? '');

/** Builds an absolute verification URL, falling back to the current origin when base is missing/relative. */
export function resolveVerifyUrl(baseUrl: string | null | undefined, token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const base = baseUrl && /^https?:\/\//i.test(baseUrl) ? baseUrl.replace(/\/+$/, '') : origin;
  return `${base}/verify/${token}`;
}