import type { AppState, AuthUser, ClientSummary, WorkspaceUser } from './types';

const TOKEN_KEY = 'nics_dpdp_token';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://collect-api.collect-process-api.workers.dev';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

interface ReqOpts {
  method?: string;
  body?: unknown;
  clientId?: string;
}

async function req<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let url = `${API_URL}${path}`;
  if (opts.clientId) {
    url += (path.includes('?') ? '&' : '?') + 'clientId=' + encodeURIComponent(opts.clientId);
  }

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let msg = 'API error ' + res.status + ' ' + path;
    try {
      const j = (await res.json()) as { error?: string };
      if (j && j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    req<{ token: string; user: AuthUser }>('/api/auth/login', { method: 'POST', body: { username, password } }),
  me: () => req<{ user: AuthUser }>('/api/auth/me'),
  logout: () => req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  listClients: () => req<{ list: ClientSummary[] }>('/api/admin/clients'),
  createClient: (body: Record<string, unknown>) => req<{ ok: boolean; id: string }>('/api/admin/clients', { method: 'POST', body }),
  updateClient: (id: string, body: Record<string, unknown>) => req<{ ok: boolean }>(`/api/admin/clients/${id}`, { method: 'PUT', body }),
  deleteClient: (id: string) => req<{ ok: boolean }>(`/api/admin/clients/${id}`, { method: 'DELETE' }),

  listUsers: (clientId?: string) => req<{ list: WorkspaceUser[] }>('/api/users', { clientId }),
  createUser: (body: Record<string, unknown>, clientId?: string) => req<{ ok: boolean; user: WorkspaceUser }>('/api/users', { method: 'POST', body, clientId }),
  updateUser: (id: string, body: Record<string, unknown>, clientId?: string) =>
    req<{ ok: boolean; user: WorkspaceUser }>(`/api/users/${id}`, { method: 'PUT', body, clientId }),
  deleteUser: (id: string, clientId?: string) => req<{ ok: boolean }>(`/api/users/${id}`, { method: 'DELETE', clientId }),

  getAll: (clientId?: string) => req<AppState>('/api/state/all', { clientId }),
  saveBranding: (b: unknown, clientId?: string) => req('/api/state/branding', { method: 'PUT', body: b, clientId }),
  saveOrg: (o: unknown, clientId?: string) => req('/api/state/org', { method: 'PUT', body: o, clientId }),
  saveInventory: (i: unknown, clientId?: string) => req('/api/state/inventory', { method: 'PUT', body: i, clientId }),
  saveThirdParties: (t: unknown, clientId?: string) => req('/api/state/third-parties', { method: 'PUT', body: t, clientId }),
  saveSignoffs: (s: unknown, clientId?: string) => req('/api/state/signoffs', { method: 'PUT', body: s, clientId }),
  saveSettings: (s: unknown, clientId?: string) => req('/api/state/settings', { method: 'PUT', body: s, clientId }),
};
