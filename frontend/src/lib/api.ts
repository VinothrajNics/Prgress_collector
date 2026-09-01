async function req<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('API error ' + res.status + ' ' + path);
  return res.json() as Promise<T>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://collect-api.collect-process-api.workers.dev';

export const api = {
  getAll: () => req('/api/state/all', 'GET'),
  saveBranding: (b: unknown) => req('/api/state/branding', 'PUT', b),
  saveOrg: (o: unknown) => req('/api/state/org', 'PUT', o),
  saveInventory: (i: unknown) => req('/api/state/inventory', 'PUT', i),
  saveThirdParties: (t: unknown) => req('/api/state/third-parties', 'PUT', t),
  saveSignoffs: (s: unknown) => req('/api/state/signoffs', 'PUT', s),
  saveSettings: (s: unknown) => req('/api/state/settings', 'PUT', s),
};
