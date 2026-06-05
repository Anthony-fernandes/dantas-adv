/**
 * Minimal API client for Django DRF + SimpleJWT.
 * - Base URL: VITE_API_BASE_URL when explicitly provided
 * - Otherwise use same-origin /api (Vite proxy / reverse proxy)
 * - API prefix: /api
 */
import { emitApiError, parseApiError, parseTransportError } from "@/lib/apiError";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Params = Record<string, string | number | boolean | undefined | null>;

const RAW_API_BASE = String((import.meta as any).env?.VITE_API_BASE_URL || '').trim();
const API_BASE = RAW_API_BASE.replace(/\/$/, '');
const API_PREFIX = '/api';

const ACCESS_KEY = 'lawflow.access';
const REFRESH_KEY = 'lawflow.refresh';

let activeTenantMemory: string | null = null;

function getBrowserSessionStorage() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function getActiveTenantId(): string | null {
  return activeTenantMemory;
}
export function setActiveTenantId(tenantId: string | null) {
  activeTenantMemory = tenantId ? String(tenantId) : null;
}

export function getAccessToken(): string | null {
  return getBrowserSessionStorage()?.getItem(ACCESS_KEY) ?? null;
}
export function getRefreshToken(): string | null {
  return getBrowserSessionStorage()?.getItem(REFRESH_KEY) ?? null;
}
export function setTokens(tokens: { access: string; refresh: string }) {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  storage.setItem(ACCESS_KEY, tokens.access);
  storage.setItem(REFRESH_KEY, tokens.refresh);
}
export function clearTokens() {
  const storage = getBrowserSessionStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_KEY);
  storage.removeItem(REFRESH_KEY);
}

function buildUrl(path: string) {
  // path can be "/auth/token/" or "/clients/"
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${API_PREFIX}${normalized}`;
}

function appendParams(path: string, params?: Params) {
  if (!params) return path;
  const builtUrl = buildUrl(path);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const u = API_BASE ? new URL(builtUrl) : new URL(builtUrl, origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    u.searchParams.set(k, String(v));
  });
  // return only path+query to keep buildUrl usage consistent downstream
  const normalizedPath = (path.startsWith('/') ? path : `/${path}`).split('?')[0];
  return `${normalizedPath}${u.search}`;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const resp = await fetch(buildUrl('/auth/token/refresh/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  if (data?.access) {
    getBrowserSessionStorage()?.setItem(ACCESS_KEY, data.access);
    return data.access as string;
  }
  return null;
}

const PUBLIC_PATHS = new Set([
  '/auth/login/',
  '/auth/token/',
  '/auth/token/refresh/',
  '/landing/',
  '/posts/',
  '/testimonials/',
  '/contact-messages/',
  '/tenants/',
  '/public/tenants/',
  '/public/site/',
  '/public/site/lead/',
  '/public/contact/',
  '/tenants/my/',
  '/auth/accept-invite/',
]);

const GLOBAL_ADMIN_PREFIXES = [
  '/admin/companies/',
  '/admin/users/',
];

function isGlobalAdminPath(path: string) {
  return GLOBAL_ADMIN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function normalizePath(path: string) {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.split('?')[0];
}

async function readErrorPayload(resp: Response) {
  const raw = (await resp.text()).trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: HttpMethod; body?: any; headers?: Record<string, string>; signal?: AbortSignal; params?: Params } = {}
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  const normalizedPath = normalizePath(path);
  const activeTenantId = getActiveTenantId();

  const access = getAccessToken();
  if (access && !PUBLIC_PATHS.has(normalizedPath) && !normalizedPath.startsWith('/public/landing/')) {
    headers.Authorization = `Bearer ${access}`;
  }

  // Multi-tenant: send X-Tenant-ID for tenant-scoped routes
  if (access && activeTenantId && !headers['X-Tenant-ID'] && !PUBLIC_PATHS.has(normalizedPath) && !isGlobalAdminPath(normalizedPath)) {
    headers['X-Tenant-ID'] = activeTenantId;
  }

  const doFetch = async (token?: string | null) => {
    const h = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    const urlWithParams = appendParams(path, options.params);
    const resp = await fetch(buildUrl(urlWithParams), {
      method,
      headers: h,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
    return resp;
  };

  let resp: Response;
  try {
    resp = await doFetch(access);
  } catch (error) {
    throw parseTransportError(error);
  }

  // Auto refresh once on 401
  if (resp.status === 401 && getRefreshToken()) {
    let newAccess: string | null = null;
    try {
      newAccess = await refreshAccessToken();
    } catch (error) {
      throw parseTransportError(error);
    }

    if (newAccess) {
      try {
        resp = await doFetch(newAccess);
      } catch (error) {
        throw parseTransportError(error);
      }
    }
  }

  if (!resp.ok) {
    const payload = await readErrorPayload(resp);
    const apiErr = parseApiError(resp.status, payload);

    // PR19 - LGPD required: redirect to acceptance page (allows /api/me/accept-lgpd)
    if (apiErr.code === 'LGPD_REQUIRED' && window.location.pathname !== '/app/lgpd') {
      window.location.href = '/app/lgpd';
    }

    // Emit global events for UX routing (session expired, tenant required, etc.)
    // Do not emit 401 for public/auth endpoints (e.g. invalid login credentials).
    if (apiErr.status === 401 && !PUBLIC_PATHS.has(normalizedPath)) emitApiError(apiErr);
    if (apiErr.status === 429) emitApiError(apiErr);
    if (apiErr.status >= 500) emitApiError(apiErr);
    if (apiErr.code === "TENANT_REQUIRED" || apiErr.code === "TENANT_FORBIDDEN") emitApiError(apiErr);

    throw apiErr;
  }

  // No content
  if (resp.status === 204) return undefined as unknown as T;

  // Try json
  return (await resp.json()) as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { signal?: AbortSignal; params?: Params } = {}
): Promise<T> {
  return apiMultipart<T>(path, formData, { ...options, method: 'POST' });
}

export async function apiMultipart<T>(
  path: string,
  formData: FormData,
  options: { method?: 'POST' | 'PUT' | 'PATCH'; signal?: AbortSignal; params?: Params } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const normalizedPath = normalizePath(path);
  const access = getAccessToken();
  if (access && !PUBLIC_PATHS.has(normalizedPath) && !normalizedPath.startsWith('/public/landing/')) {
    headers.Authorization = `Bearer ${access}`;
  }

  const activeTenantId = getActiveTenantId();
  if (access && activeTenantId && !headers['X-Tenant-ID'] && !PUBLIC_PATHS.has(normalizedPath) && !isGlobalAdminPath(normalizedPath)) {
    headers['X-Tenant-ID'] = activeTenantId;
  }

  const doFetch = async (token?: string | null) => {
    const h = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    const urlWithParams = appendParams(path, options.params);
    return fetch(buildUrl(urlWithParams), {
      method: options.method ?? 'POST',
      headers: h,
      body: formData,
      signal: options.signal,
    });
  };

  let resp: Response;
  try {
    resp = await doFetch(access);
  } catch (error) {
    throw parseTransportError(error);
  }

  if (resp.status === 401 && getRefreshToken()) {
    let newAccess: string | null = null;
    try {
      newAccess = await refreshAccessToken();
    } catch (error) {
      throw parseTransportError(error);
    }

    if (newAccess) {
      try {
        resp = await doFetch(newAccess);
      } catch (error) {
        throw parseTransportError(error);
      }
    }
  }

  if (!resp.ok) {
    const payload = await readErrorPayload(resp);
    const apiErr = parseApiError(resp.status, payload);

    // PR19 - LGPD required: redirect to acceptance page (allows /api/me/accept-lgpd)
    if (apiErr.code === 'LGPD_REQUIRED' && window.location.pathname !== '/app/lgpd') {
      window.location.href = '/app/lgpd';
    }
    emitApiError(apiErr);
    throw apiErr;
  }

  if (resp.status === 204) return undefined as unknown as T;
  return (await resp.json()) as T;
}

// Convenience helpers
export const api = {
  get: <T>(path: string, params?: Params) => apiRequest<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: any, params?: Params) => apiRequest<T>(path, { method: 'POST', body, params }),
  patch: <T>(path: string, body?: any, params?: Params) => apiRequest<T>(path, { method: 'PATCH', body, params }),
  put: <T>(path: string, body?: any, params?: Params) => apiRequest<T>(path, { method: 'PUT', body, params }),
  delete: <T>(path: string, params?: Params) => apiRequest<T>(path, { method: 'DELETE', params }),
};

export async function apiGetAllPages<T>(
  path: string,
  params?: Params,
  options: { maxPages?: number } = {},
): Promise<T[]> {
  const items: T[] = [];
  const maxPages = Math.max(1, options.maxPages ?? 40);

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await api.get<Paginated<T> | T[]>(path, { ...(params ?? {}), page });

    if (Array.isArray(payload)) {
      items.push(...payload);
      break;
    }

    const batch = Array.isArray(payload?.results) ? payload.results : [];
    items.push(...batch);

    if (!payload?.next || batch.length === 0 || items.length >= (payload?.count ?? items.length)) {
      break;
    }
  }

  return items;
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
