/**
 * API client for Django DRF + SimpleJWT backend.
 * - Base URL from VITE_API_BASE_URL (default: same-origin /api via proxy)
 * - JWT access/refresh in sessionStorage, auto-refresh on 401
 * - Multi-tenant via X-Tenant-ID header
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, string | number | boolean | undefined | null>;

const RAW_API_BASE = String((import.meta as any).env?.VITE_API_BASE_URL || "").trim();
const API_BASE = RAW_API_BASE.replace(/\/$/, "");
const API_PREFIX = "/api";

import { STORAGE_PREFIX } from "./brand";

const ACCESS_KEY = `${STORAGE_PREFIX}access`;
const REFRESH_KEY = `${STORAGE_PREFIX}refresh`;
const TENANT_KEY = `${STORAGE_PREFIX}tenant`;

// --- Migração de chaves legadas (jurisflow.*) -> nimbuslaw.* ---
// Estratégia compatível: lê a chave nova; se ausente, migra o valor da chave
// antiga; remove a antiga em seguida. Evita desconectar usuários com sessão
// ativa. Executa uma única vez no carregamento do módulo.
// Chaves migradas: access, refresh (sessionStorage) e tenant (localStorage).
// Documentado em docs/BRANDING.md.
const LEGACY_PREFIX = "jurisflow.";
function migrateLegacyKey(storage: Storage, suffix: string) {
  const newKey = `${STORAGE_PREFIX}${suffix}`;
  const oldKey = `${LEGACY_PREFIX}${suffix}`;
  if (storage.getItem(newKey) === null) {
    const legacy = storage.getItem(oldKey);
    if (legacy !== null) storage.setItem(newKey, legacy);
  }
  storage.removeItem(oldKey);
}
if (typeof window !== "undefined") {
  try {
    migrateLegacyKey(window.sessionStorage, "access");
    migrateLegacyKey(window.sessionStorage, "refresh");
    migrateLegacyKey(window.localStorage, "tenant");
  } catch {
    /* storage indisponível (ex.: modo privado restrito) — segue sem migrar */
  }
}

export type ApiError = {
  status: number;
  detail: string;
  code?: string;
  payload?: unknown;
};

let activeTenantMemory: string | null =
  typeof window !== "undefined" ? window.localStorage.getItem(TENANT_KEY) : null;

export function getActiveTenantId(): string | null {
  return activeTenantMemory;
}
export function setActiveTenantId(tenantId: string | null) {
  activeTenantMemory = tenantId ? String(tenantId) : null;
  if (typeof window === "undefined") return;
  if (tenantId) window.localStorage.setItem(TENANT_KEY, String(tenantId));
  else window.localStorage.removeItem(TENANT_KEY);
}

export function getAccessToken(): string | null {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(REFRESH_KEY);
}
export function setTokens(tokens: { access: string; refresh: string }) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACCESS_KEY, tokens.access);
  window.sessionStorage.setItem(REFRESH_KEY, tokens.refresh);
}
export function clearTokens() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_KEY);
  window.sessionStorage.removeItem(REFRESH_KEY);
}

function buildUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${API_PREFIX}${normalized}`;
}

function appendParams(path: string, params?: Params) {
  const base = path.startsWith("/") ? path : `/${path}`;
  if (!params) return base;
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const u = API_BASE ? new URL(buildUrl(base)) : new URL(buildUrl(base), origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.searchParams.set(k, String(v));
  });
  return `${base.split("?")[0]}${u.search}`;
}

const PUBLIC_PATHS = new Set([
  "/auth/login/",
  "/auth/token/",
  "/auth/token/refresh/",
  "/portal/login/",
  "/public/tenants/",
  "/public/site/",
  "/auth/accept-invite/",
]);

const GLOBAL_ADMIN_PREFIXES = ["/admin/companies/", "/admin/users/"];
function isGlobalAdminPath(path: string) {
  return GLOBAL_ADMIN_PREFIXES.some((prefix) => path.startsWith(prefix));
}
function normalizePath(path: string) {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.split("?")[0];
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const resp = await fetch(buildUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data?.access) {
    window.sessionStorage.setItem(ACCESS_KEY, data.access);
    return data.access as string;
  }
  return null;
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

function toApiError(status: number, payload: unknown): ApiError {
  let detail = "";
  let code: string | undefined;

  if (typeof payload === "string" && payload) {
    // Respostas HTML (ex.: proxy/404) — não jogar o HTML inteiro na tela.
    detail = /<!doctype|<html/i.test(payload) ? "" : payload;
  } else if (payload && typeof payload === "object") {
    const p = payload as Record<string, any>;
    code = p.code || p.error_code;
    const fromField = (v: unknown): string =>
      Array.isArray(v) ? v.map(String).join(" ") : typeof v === "string" ? v : "";
    detail =
      p.detail ||
      p.message ||
      p.error ||
      fromField(p.non_field_errors) ||
      // Erros DRF por campo: {"email": ["..."], "password": ["..."]}
      Object.entries(p)
        .filter(([k]) => !["code", "error_code"].includes(k))
        .map(([k, v]) => {
          const msg = fromField(v);
          return msg ? `${k}: ${msg}` : "";
        })
        .filter(Boolean)
        .join(" · ");
  }

  if (!detail) {
    if (status === 0) detail = "Não foi possível contatar o servidor.";
    else if (status === 401) detail = "Credenciais inválidas ou sessão expirada.";
    else if (status === 403) detail = "Acesso negado.";
    else if (status === 404) detail = "Recurso não encontrado (verifique se o backend está no ar).";
    else if (status >= 500) detail = "Erro interno do servidor.";
    else detail = `Erro na requisição (HTTP ${status}).`;
  }

  const err: ApiError = { status, detail: `${detail} (HTTP ${status})`, code, payload };
  // Ajuda de diagnóstico no console do navegador (F12).
  try {
    // eslint-disable-next-line no-console
    console.error("[API]", status, payload);
  } catch {
    /* noop */
  }
  return err;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    params?: Params;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers ?? {}) };
  const normalizedPath = normalizePath(path);
  const activeTenantId = getActiveTenantId();
  const access = getAccessToken();

  if (access && !PUBLIC_PATHS.has(normalizedPath)) headers.Authorization = `Bearer ${access}`;
  if (
    access &&
    activeTenantId &&
    !headers["X-Tenant-ID"] &&
    !PUBLIC_PATHS.has(normalizedPath) &&
    !isGlobalAdminPath(normalizedPath)
  ) {
    headers["X-Tenant-ID"] = activeTenantId;
  }

  const doFetch = async (token?: string | null) => {
    const h = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    return fetch(buildUrl(appendParams(path, options.params)), {
      method,
      headers: h,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  };

  let resp: Response;
  try {
    resp = await doFetch(access);
  } catch {
    throw { status: 0, detail: "Não foi possível contatar o servidor. Verifique se o backend está no ar." } as ApiError;
  }

  if (resp.status === 401 && getRefreshToken() && !PUBLIC_PATHS.has(normalizedPath)) {
    const newAccess = await refreshAccessToken().catch(() => null);
    if (newAccess) resp = await doFetch(newAccess);
  }

  if (!resp.ok) {
    throw toApiError(resp.status, await readErrorPayload(resp));
  }
  if (resp.status === 204) return undefined as unknown as T;
  return (await resp.json()) as T;
}

export async function apiMultipart<T>(
  path: string,
  formData: FormData,
  options: { method?: "POST" | "PUT" | "PATCH"; signal?: AbortSignal; params?: Params } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const normalizedPath = normalizePath(path);
  const access = getAccessToken();
  if (access && !PUBLIC_PATHS.has(normalizedPath)) headers.Authorization = `Bearer ${access}`;
  const activeTenantId = getActiveTenantId();
  if (access && activeTenantId && !isGlobalAdminPath(normalizedPath)) headers["X-Tenant-ID"] = activeTenantId;

  const doFetch = async (token?: string | null) => {
    const h = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    return fetch(buildUrl(appendParams(path, options.params)), {
      method: options.method ?? "POST",
      headers: h,
      body: formData,
      signal: options.signal,
    });
  };

  let resp = await doFetch(access);
  if (resp.status === 401 && getRefreshToken()) {
    const newAccess = await refreshAccessToken().catch(() => null);
    if (newAccess) resp = await doFetch(newAccess);
  }
  if (!resp.ok) throw toApiError(resp.status, await readErrorPayload(resp));
  if (resp.status === 204) return undefined as unknown as T;
  return (await resp.json()) as T;
}

export const api = {
  get: <T>(path: string, params?: Params) => apiRequest<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: any, params?: Params) => apiRequest<T>(path, { method: "POST", body, params }),
  patch: <T>(path: string, body?: any, params?: Params) => apiRequest<T>(path, { method: "PATCH", body, params }),
  put: <T>(path: string, body?: any, params?: Params) => apiRequest<T>(path, { method: "PUT", body, params }),
  delete: <T>(path: string, params?: Params) => apiRequest<T>(path, { method: "DELETE", params }),
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function apiGetAllPages<T>(path: string, params?: Params, maxPages = 40): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await api.get<Paginated<T> | T[]>(path, { ...(params ?? {}), page });
    if (Array.isArray(payload)) {
      items.push(...payload);
      break;
    }
    const batch = Array.isArray(payload?.results) ? payload.results : [];
    items.push(...batch);
    if (!payload?.next || batch.length === 0 || items.length >= (payload?.count ?? items.length)) break;
  }
  return items;
}
