import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearTokens,
  getAccessToken,
  setActiveTenantId,
  getActiveTenantId,
  setTokens,
} from "./api";

export type Profile = {
  id: string;
  tenant_id: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  cargo?: string | null;
  status?: string;
};

export type Tenant = { id: string; name: string; slug?: string };

type MeResponse = {
  profile: Profile | null;
  roles: string[];
  permissions: string[];
  tenant_id: string | null;
  is_superuser: boolean;
};

const ROLE_ALIASES: Record<string, string> = {
  owner: "OWNER",
  admin: "ADMIN",
  administrador: "ADMIN",
  lawyer: "LAWYER",
  advogado: "LAWYER",
  assistant: "ASSISTANT",
  assistente: "ASSISTANT",
  finance: "FINANCE",
  financeiro: "FINANCE",
  client: "CLIENT",
  cliente: "CLIENT",
};

function normalizeRoles(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list
    .map((r) => String(r).trim())
    .filter(Boolean)
    .map((r) => ROLE_ALIASES[r.toLowerCase()] ?? r.toUpperCase());
}

async function fetchMe(): Promise<MeResponse> {
  const data = await api.get<any>("/me/");
  const user = data?.user ?? (data?.id ? { id: String(data.id), email: String(data.email ?? "") } : null);
  const tenantId =
    data?.tenant_id ?? data?.profile?.tenant_id ?? data?.tenant?.id ?? data?.tenant ?? null;
  const profile: Profile | null =
    data?.profile ??
    (user
      ? {
          id: String(user.id),
          tenant_id: tenantId ? String(tenantId) : null,
          full_name: String(data?.full_name ?? user.full_name ?? ""),
          email: String(user.email ?? data?.email ?? ""),
          phone: data?.phone ?? null,
          avatar_url: data?.avatar_url ?? null,
          cargo: data?.cargo ?? null,
          status: String(data?.status ?? "active"),
        }
      : null);
  const roles = normalizeRoles(data?.roles ?? data?.role ?? data?.profile?.roles);
  const permissions = Array.isArray(data?.permissions) ? data.permissions.map(String) : [];
  const isSuperuser = Boolean(data?.is_superuser ?? roles.includes("SUPERUSER"));
  return { profile, roles, permissions, tenant_id: tenantId ? String(tenantId) : null, is_superuser: isSuperuser };
}

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: Profile | null;
  roles: string[];
  permissions: string[];
  isSuperuser: boolean;
  tenants: Tenant[];
  activeTenantId: string | null;
  setActiveTenant: (id: string | null) => void;
  hasRole: (...roles: string[]) => boolean;
  login: (email: string, password: string, portal?: boolean) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(getActiveTenantId());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAccessToken());

  const setActiveTenant = useCallback((id: string | null) => {
    setActiveTenantId(id);
    setActiveTenantIdState(id);
  }, []);

  const loadTenants = useCallback(async () => {
    try {
      const data = await api.get<any>("/tenants/my/");
      const list: Tenant[] = (Array.isArray(data) ? data : data?.results ?? data?.tenants ?? []).map((t: any) => ({
        id: String(t.id),
        name: String(t.name ?? t.slug ?? "Escritório"),
        slug: t.slug,
      }));
      setTenants(list);
      return list;
    } catch {
      setTenants([]);
      return [];
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await fetchMe();
    setProfile(me.profile);
    setRoles(me.roles);
    setPermissions(me.permissions);
    setIsSuperuser(me.is_superuser);
    setIsAuthenticated(true);
    const list = await loadTenants();
    const current = getActiveTenantId();
    const resolved = me.tenant_id || current || list[0]?.id || null;
    if (resolved && resolved !== current) setActiveTenant(resolved);
    else if (resolved) setActiveTenantIdState(resolved);
  }, [loadTenants, setActiveTenant]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }
      try {
        await refreshMe();
      } catch {
        clearTokens();
        setIsAuthenticated(false);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string, portal = false) => {
      const endpoint = portal ? "/portal/login/" : "/auth/login/";
      let resp: any;
      try {
        resp = await api.post<any>(endpoint, { email, password });
      } catch {
        resp = await api.post<any>(endpoint, { username: email, password });
      }
      setTokens({ access: resp.access, refresh: resp.refresh });
      await refreshMe();
    },
    [refreshMe],
  );

  const logout = useCallback(() => {
    clearTokens();
    setActiveTenant(null);
    setProfile(null);
    setRoles([]);
    setPermissions([]);
    setIsSuperuser(false);
    setTenants([]);
    setIsAuthenticated(false);
  }, [setActiveTenant]);

  const hasRole = useCallback(
    (...wanted: string[]) => {
      if (isSuperuser) return true;
      if (wanted.length === 0) return true;
      return wanted.some((w) => roles.includes(w.toUpperCase()));
    },
    [isSuperuser, roles],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      profile,
      roles,
      permissions,
      isSuperuser,
      tenants,
      activeTenantId,
      setActiveTenant,
      hasRole,
      login,
      logout,
      refreshMe,
    }),
    [isLoading, isAuthenticated, profile, roles, permissions, isSuperuser, tenants, activeTenantId, setActiveTenant, hasRole, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
