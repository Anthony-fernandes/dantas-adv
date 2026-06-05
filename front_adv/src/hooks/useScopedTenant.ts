import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/integrations/api/client";

type Company = { id: string; name?: string };

function companiesFrom(payload: any): Company[] {
  if (Array.isArray(payload?.companies)) return payload.companies;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

export function useScopedTenant(queryKeyPrefix: string) {
  const { isSuperuser } = useAuth();
  const { activeTenantId, setActiveTenant } = useTenant();
  const [selectedTenantId, setSelectedTenantIdState] = useState(() => activeTenantId || "");

  const companiesQuery = useQuery({
    queryKey: [queryKeyPrefix, "companies"],
    queryFn: async () => await api.get<any>("/admin/companies/"),
    enabled: isSuperuser,
  });

  const companies = useMemo(() => companiesFrom(companiesQuery.data), [companiesQuery.data]);

  useEffect(() => {
    if (isSuperuser) {
      const fallbackTenantId = selectedTenantId || activeTenantId || companies[0]?.id || "";
      if (fallbackTenantId && fallbackTenantId !== selectedTenantId) {
        setSelectedTenantIdState(fallbackTenantId);
      }
      if (fallbackTenantId && fallbackTenantId !== activeTenantId) {
        setActiveTenant(fallbackTenantId);
      }
      return;
    }

    if (activeTenantId && selectedTenantId !== activeTenantId) {
      setSelectedTenantIdState(activeTenantId);
    }
  }, [isSuperuser, selectedTenantId, companies, activeTenantId, setActiveTenant]);

  const effectiveTenantId = isSuperuser ? selectedTenantId : activeTenantId || "";

  const setSelectedTenantId = (tenantId: string) => {
    setSelectedTenantIdState(tenantId);
    setActiveTenant(tenantId || null);
  };

  return {
    isSuperuser,
    companies,
    companiesQuery,
    effectiveTenantId,
    selectedTenantId: isSuperuser ? selectedTenantId : effectiveTenantId,
    setSelectedTenantId,
  };
}
