import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign, FileText, Home, LogOut, Menu, MessageSquare,
  Scale, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { firstText } from "@/lib/brandTheme";
import { cn } from "@/lib/utils";
import { leadService } from "@/services/api";

const portalNav = [
  { label: "Início",      icon: Home,          path: "/portal",            exact: true },
  { label: "Processos",   icon: Scale,         path: "/portal/processos" },
  { label: "Documentos",  icon: FileText,      path: "/portal/documentos" },
  { label: "Financeiro",  icon: DollarSign,    path: "/portal/financeiro" },
  { label: "Mensagens",   icon: MessageSquare, path: "/portal/mensagens" },
];

export function PortalLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();

  const publicSiteQuery = useQuery({
    queryKey: ["portal-layout-brand"],
    queryFn: async () => await leadService.getPublicSite(),
  });

  const payload = publicSiteQuery.data as any;
  const settings = payload?.settings;

  const brand = useMemo(() => {
    const companyName = firstText(payload?.company?.name, settings?.brand_name, "Portal do Cliente");
    const logoUrl = firstText(payload?.company?.logo_url);
    const portalLabel = firstText(settings?.client_portal_label, "Portal do Cliente");
    return { companyName: companyName || "Portal do Cliente", logoUrl, portalLabel };
  }, [payload?.company?.logo_url, payload?.company?.name, settings?.brand_name, settings?.client_portal_label]);

  const isActive = (item: typeof portalNav[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  const initials = (user?.email || "C").slice(0, 2).toUpperCase();

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 shrink-0 rounded-md object-cover ring-1 ring-white/20" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-white">
              <Scale className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold leading-tight text-white">{brand.companyName}</p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">{brand.portalLabel}</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">Menu</p>
          <nav className="space-y-0.5">
            {portalNav.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-150 select-none",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
                  )}
                >
                  <item.icon className={cn(
                    "h-[15px] w-[15px] shrink-0 transition-colors",
                    active ? "text-gold" : "text-white/35 group-hover:text-white/60",
                  )} />
                  <span className="truncate">{item.label}</span>
                  {active && <ChevronRight className="ml-auto h-3 w-3 text-white/30 shrink-0" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User footer */}
        <div className="shrink-0 border-t border-white/[0.07] p-2">
          <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-white/80">{user?.email || "Cliente"}</p>
              <p className="text-[10px] text-white/30">Conta ativa</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-md p-1.5 text-white/25 transition-colors hover:bg-white/[0.08] hover:text-white/60"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] shrink-0 bg-[#0d0f14] lg:flex lg:flex-col border-r border-white/[0.06]">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-[#0d0f14] border-r border-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
              <div className="flex items-center gap-3">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 rounded-md object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
                    <Scale className="h-3.5 w-3.5" />
                  </div>
                )}
                <p className="text-sm font-semibold text-white">{brand.companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 rounded-md object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Scale className="h-3.5 w-3.5" />
              </div>
            )}
            <p className="text-sm font-semibold text-foreground">{brand.companyName}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/60"
          >
            <Menu className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
