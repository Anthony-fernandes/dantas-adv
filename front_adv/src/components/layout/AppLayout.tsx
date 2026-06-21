import { Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon';
import { SidebarProvider } from '@/components/ui/sidebar';

export function AppLayout() {
  useDynamicFavicon();
  const { isLoading, isSuperuser } = useAuth();
  const { activeTenantId, tenants, isLoadingTenants, setActiveTenant } = useTenant();

  useEffect(() => {
    if (!isLoading && !isLoadingTenants && !activeTenantId && tenants.length > 0) {
      setActiveTenant(tenants[0].id);
    }
  }, [isLoading, isLoadingTenants, activeTenantId, tenants, setActiveTenant]);

  if (isLoading || isLoadingTenants) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-3.5 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-[13px] text-muted-foreground">Carregando ambiente interno...</span>
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
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
