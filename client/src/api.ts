// Under file:// (Electron) a relative '/api' can never work, so only accept an absolute http(s) URL there.
const configured: string = import.meta.env.VITE_API_URL ?? '';
const BASE: string = /^https?:\/\//.test(configured)
  ? configured
  : window.location.protocol === 'file:'
    ? 'http://localhost:4000/api'
    : configured || '/api';

interface Opts { method?: string; body?: unknown; form?: FormData }

export async function api<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const token = localStorage.getItem('token');
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new Error(`Cannot reach the API at ${BASE}. Is the server running?`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? 'REQUEST_FAILED');
  return data as T;
}

export const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString();
  return p ? `?${p}` : '';
};
