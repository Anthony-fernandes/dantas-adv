import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { api, clearTokens, setTokens, getAccessToken } from '@/integrations/api/client';
import { hasAnyRole } from '@/lib/rbac';

export type AppRole =
  | 'SUPERUSER'
  | 'OWNER'
  | 'ADMIN'
  | 'LAWYER'
  | 'FINANCE'
  | 'ASSISTANT'
  | 'CLIENT'
  // legacy/back-compat
  | 'admin'
  | 'socio'
  | 'advogado'
  | 'assistente'
  | 'financeiro'
  | 'cliente';

export interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  cargo: string | null;
  status: string;
}

export interface MeResponse {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  roles: AppRole[];
  permissions?: string[];
  tenant_id: string | null;
  is_superuser: boolean;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  roles: AppRole[];
  permissions: string[];
  isSuperuser: boolean;
  tenantId: string | null;
  /** Convenience RBAC helper used across the UI */
  hasRole: (...roles: AppRole[]) => boolean;
  hasPermission: (...codes: string[]) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ isSuperuser: boolean }>;
  portalLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapLegacyRole(r: string): AppRole {
  const up = String(r).toUpperCase();
  const normalized = up.replace(/^ROLE_/, '');
  // canonical already
  if (['SUPERUSER','OWNER','ADMIN','LAWYER','FINANCE','ASSISTANT','CLIENT'].includes(normalized)) return normalized as AppRole;
  // legacy mappings
  if (normalized === 'SOCIO') return 'OWNER';
  if (normalized === 'ADVOGADO') return 'LAWYER';
  if (normalized === 'FINANCEIRO') return 'FINANCE';
  if (normalized === 'ASSISTENTE') return 'ASSISTANT';
  if (['ADMIN', 'ADMINISTRADOR', 'ADMINISTRADORA'].includes(normalized)) return 'ADMIN';
  if (normalized === 'CLIENTE') return 'CLIENT';
  return r as AppRole;
}

function normalizeRoles(raw: any): AppRole[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(mapLegacyRole) as AppRole[];
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
      .map(mapLegacyRole) as AppRole[];
  }
  // backend may return {} or {admin: true}
  if (typeof raw === 'object') {
    return Object.keys(raw).filter((k) => raw[k]).map(mapLegacyRole) as AppRole[];
  }
  return [];
}

async function fetchMe(): Promise<MeResponse> {
  // Expected endpoint on backend: GET /api/me/
  const data = await api.get<any>('/me/');

  // Support multiple shapes (older/newer backend versions)
  const user =
    data?.user ??
    (data?.id && data?.email ? { id: String(data.id), email: String(data.email) } : null);

  const tenantId =
    data?.tenant_id ??
    data?.tenantId ??
    data?.profile?.tenant_id ??
    data?.profile?.tenant ??
    data?.tenant?.id ??
    data?.tenant ??
    null;

  // If backend returns a nested profile, use it; otherwise build one from top-level fields.
  const profile: Profile | null =
    data?.profile ??
    (user
      ? {
          id: user.id,
          tenant_id: tenantId ? String(tenantId) : null,
          full_name: String(data?.full_name ?? ''),
          email: user.email,
          phone: data?.phone ?? null,
          avatar_url: data?.avatar_url ?? null,
          cargo: data?.cargo ?? null,
          status: String(data?.status ?? 'active'),
        }
      : null);

  const roles = normalizeRoles(
    data?.roles ??
    data?.role ??
    data?.user?.roles ??
    data?.user?.role ??
    data?.profile?.roles ??
    data?.profile?.role
  );
  const permissions = Array.isArray(
    data?.permissions ??
    data?.user?.permissions ??
    data?.profile?.permissions
  )
    ? (data?.permissions ?? data?.user?.permissions ?? data?.profile?.permissions).map((item: unknown) => String(item))
    : [];
  const isSuperuser = Boolean(data?.is_superuser ?? data?.user?.is_superuser ?? roles.includes('SUPERUSER'));

  return {
    user,
    profile,
    roles,
    permissions,
    tenant_id: tenantId ? String(tenantId) : null,
    is_superuser: isSuperuser,
  };
}

type AuthTokenResponse = { access: string; refresh: string; is_superuser?: boolean };

async function obtainTokens(email: string, password: string): Promise<AuthTokenResponse> {
  // Try both payload styles for compatibility with SimpleJWT configs:
  // 1) {email,password}
  // 2) {username,password} (email passed as username)
  try {
    return await api.post<AuthTokenResponse>('/auth/login/', { email, password });
  } catch (e: any) {
    // Fallback to SimpleJWT default endpoints
    try {
      return await api.post<AuthTokenResponse>('/auth/token/', { email, password });
    } catch {
      // Retry with username if server expects it
      return await api.post<AuthTokenResponse>('/auth/token/', { username: email, password });
    }
  }
}

async function obtainPortalTokens(email: string, password: string): Promise<AuthTokenResponse> {
  try {
    return await api.post<AuthTokenResponse>('/portal/login/', { email, password });
  } catch {
    return await api.post<AuthTokenResponse>('/portal/login/', { username: email, password });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyMe = useCallback((me: MeResponse) => {
    setUser(me.user);
    setProfile(me.profile);
    setRoles(me.roles ?? []);
    setPermissions(me.permissions ?? []);
    setIsSuperuser(Boolean(me.is_superuser));
    setTenantId(me.tenant_id ?? null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchMe();
      applyMe(me);
    } catch {
      // If tenant isn't selected yet, /me can fail (tenant-scoped). Ignore.
    }
  }, [applyMe]);

  useEffect(() => {
    (async () => {
      try {
        if (getAccessToken()) {
          await refreshMe();
        }
      } catch {
        clearTokens();
        applyMe({ user: null, profile: null, roles: [], tenant_id: null, is_superuser: false });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshMe, applyMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const normalizedEmail = email.trim();
        const tokenResp = await obtainTokens(normalizedEmail, password);
        setTokens({ access: tokenResp.access, refresh: tokenResp.refresh });
        const isSuper = Boolean(tokenResp.is_superuser);
        setIsSuperuser(isSuper);
        await refreshMe();
        return { isSuperuser: isSuper };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshMe],
  );

  const portalLogin = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const normalizedEmail = email.trim();
        const tokenResp = await obtainPortalTokens(normalizedEmail, password);
        setTokens({ access: tokenResp.access, refresh: tokenResp.refresh });
        setIsSuperuser(false);

        try {
          await refreshMe();
        } catch {
          applyMe({
            user: { id: normalizedEmail || 'portal-user', email: normalizedEmail },
            profile: null,
            roles: ['CLIENT'],
            permissions: [],
            tenant_id: null,
            is_superuser: false,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [applyMe, refreshMe],
  );

  const logout = useCallback(() => {
    clearTokens();
    applyMe({ user: null, profile: null, roles: [], tenant_id: null, is_superuser: false });
  }, [applyMe]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      roles,
      permissions,
      isSuperuser,
      tenantId,
      hasRole: (...check: AppRole[]) => {
        if (isSuperuser) return true;
        if (!check?.length) return true;
        return hasAnyRole(roles, check);
      },
      hasPermission: (...codes: string[]) => {
        if (isSuperuser) return true;
        if (!codes?.length) return true;
        return codes.some((code) => permissions.includes(code));
      },
      // Consider token presence to avoid redirect flicker right after login
      // while /me is still loading or blocked by tenant selection.
      isAuthenticated: !!user || !!getAccessToken(),
      isLoading,
      login,
      portalLogin,
      logout,
      refreshMe,
    }),
    [user, profile, roles, permissions, isSuperuser, tenantId, isLoading, login, portalLogin, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
