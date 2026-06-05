import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getActiveTenantId, setActiveTenantId } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TenantSummary {
  id: string;
  name: string;
  slug?: string | null;
  roles?: string[];
}

interface TenantsMyResponse {
  tenants: TenantSummary[];
}

interface TenantContextType {
  tenants: TenantSummary[];
  activeTenantId: string | null;
  activeTenant: TenantSummary | null;
  isLoadingTenants: boolean;
  refreshTenants: () => Promise<void>;
  setActiveTenant: (tenantId: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, refreshMe, isLoading: isAuthLoading, tenantId: authTenantId } = useAuth();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [activeTenantId, _setActiveTenantId] = useState<string | null>(authTenantId ?? null);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);

  const setActiveTenant = useCallback((tenantId: string | null) => {
    setActiveTenantId(tenantId);
    _setActiveTenantId(tenantId);
  }, []);

  const refreshTenants = useCallback(async () => {
    if (!isAuthenticated) {
      setTenants([]);
      setActiveTenant(null);
      setIsLoadingTenants(false);
      return;
    }
    setIsLoadingTenants(true);
    try {
      const data = await api.get<TenantsMyResponse>('/tenants/my/');
      const list = data?.tenants ?? [];
      setTenants(list);

      const current = activeTenantId || getActiveTenantId() || authTenantId || null;
      const chosen = current && list.some((t) => t.id === current) ? current : (list[0]?.id ?? null);
      setActiveTenant(chosen);

      // Once we have a tenant, refresh /me under that tenant
      if (chosen) {
        await refreshMe();
      }
    } finally {
      setIsLoadingTenants(false);
    }
  }, [activeTenantId, authTenantId, isAuthenticated, refreshMe, setActiveTenant]);

  useEffect(() => {
    if (!isAuthenticated) {
      _setActiveTenantId(null);
      return;
    }
    if (authTenantId) {
      _setActiveTenantId((previous) => previous || authTenantId);
    }
  }, [authTenantId, isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (isAuthenticated) {
      void refreshTenants();
    } else {
      setTenants([]);
      setActiveTenant(null);
      setIsLoadingTenants(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading]);

  const activeTenant = useMemo(() => {
    if (!activeTenantId) return null;
    return tenants.find((t) => t.id === activeTenantId) ?? null;
  }, [tenants, activeTenantId]);

  const value = useMemo<TenantContextType>(
    () => ({
      tenants,
      activeTenantId,
      activeTenant,
      isLoadingTenants,
      refreshTenants,
      setActiveTenant,
    }),
    [tenants, activeTenantId, activeTenant, isLoadingTenants, refreshTenants, setActiveTenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}

