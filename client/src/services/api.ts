// client/src/services/api.ts — all data access goes through the Node API (never JSON files directly)
import type { AuditEntry, Certificate, SecurityStatus, Settings, Template, VerifyResponse } from '../types';

let csrfToken: string | null = null;
export const setCsrf = (t: string | null): void => { csrfToken = t; };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> ?? {}) };
  if (init.body && !(init.body instanceof Blob)) headers['Content-Type'] = 'application/json';
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(init.method ?? '')) headers['x-csrf-token'] = csrfToken;
  const res = await fetch(`/api${path}`, { ...init, headers, credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(body.error ?? 'Request failed'), { status: res.status });
  }
  const ct = res.headers.get('content-type') ?? '';
  return (ct.includes('json') ? res.json() : res.text()) as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ username: string; csrfToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  session: () => request<{ username: string; csrfToken: string }>('/auth/session'),

  verify: (id: string) => request<VerifyResponse>(`/verify/${encodeURIComponent(id)}`),
  certificates: (params = '') => request<{ items: Certificate[]; templates: Template[]; settings: Settings }>(`/certificates${params}`),
  certificate: (id: string) => request<{ certificate: Certificate; template: Template | null }>(`/certificates/${id}`),
  createCertificate: (body: unknown) => request<Certificate>('/certificates', { method: 'POST', body: JSON.stringify(body) }),
  revoke: (id: string) => request<Certificate>(`/certificates/${id}/revoke`, { method: 'POST' }),
  validate: (id: string) => request<VerifyResponse & { storedHash: string; recomputedHash: string; signatureValid: boolean }>(`/certificates/${id}/validate`, { method: 'POST' }),
  download: (id: string) => request<{ certificate: Certificate; template: Template | null }>(`/certificates/${id}/download`),

  templates: () => request<Template[]>('/templates'),
  saveTemplate: (id: string, body: Partial<Template>) => request<Template>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  uploadImage: async (file: File): Promise<string> => {
    const res = await fetch('/api/uploads/image', {
      method: 'POST', credentials: 'include', body: file,
      headers: { 'Content-Type': file.type, 'x-filename': file.name, 'x-csrf-token': csrfToken ?? '' }
    });
    if (!res.ok) throw new Error('Upload rejected');
    return (await res.json()).url as string;
  },

  exportsUrl: (params: string) => `/api/exports/certificates?${params}`,
  audit: () => request<AuditEntry[]>('/audit'),
  settings: () => request<Settings>('/settings'),
  saveSettings: (body: Partial<Settings>) => request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(body) }),
  securityStatus: () => request<SecurityStatus>('/security/status')
};