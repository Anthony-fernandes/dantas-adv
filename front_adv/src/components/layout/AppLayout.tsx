import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isLoading, isSuperuser } = useAuth();
  const { activeTenantId, tenants, isLoadingTenants, setActiveTenant } = useTenant();

  useEffect(() => {
    if (!isLoading && !isLoadingTenants && !activeTenantId && tenants.length > 0) {
      setActiveTenant(tenants[0].id);
    }
  }, [isLoading, isLoadingTenants, activeTenantId, tenants, setActiveTenant]);

  if (isLoading || isLoadingTenants) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-foreground">
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-card">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
          <span className="text-sm text-muted-foreground">Carregando ambiente interno...</span>
        </div>
      </div>
    );
  }

  if (!activeTenantId && tenants.length > 0) return null;

  if (!activeTenantId && !isSuperuser) {
    if (tenants?.length) return <Navigate to="/app/select-tenant" replace />;
    return <Navigate to="/app/setup" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper text-foreground">
      <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-paper">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1680px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
