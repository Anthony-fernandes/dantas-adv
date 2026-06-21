import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign, FileText, Home, LogOut, Menu, MessageSquare, Scale, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { firstText } from "@/lib/brandTheme";
import { cn } from "@/lib/utils";
import { leadService } from "@/services/api";

const portalNav = [
  { label: "Início",     icon: Home,          path: "/portal",            exact: true },
  { label: "Processos",  icon: Scale,         path: "/portal/processos" },
  { label: "Documentos", icon: FileText,      path: "/portal/documentos" },
  { label: "Financeiro", icon: DollarSign,    path: "/portal/financeiro" },
  { label: "Mensagens",  icon: MessageSquare, path: "/portal/mensagens" },
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
    const portalLabel = firstText(settings?.client_portal_label, "Portal do cliente");
    return { companyName: companyName || "Portal do Cliente", logoUrl, portalLabel };
  }, [payload?.company?.logo_url, payload?.company?.name, settings?.brand_name, settings?.client_portal_label]);

  const isActive = (item: typeof portalNav[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  const initials = (user?.email || "C").slice(0, 2).toUpperCase();

  function NavItems({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="space-y-px">
        {portalNav.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-[6px] text-[13px] transition-all duration-100 select-none",
                active
                  ? "bg-primary/[0.08] text-primary font-semibold"
                  : "text-foreground/60 hover:bg-muted hover:text-foreground font-medium",
              )}
            >
              <item.icon className={cn(
                "h-[15px] w-[15px] shrink-0 transition-colors",
                active ? "text-primary" : "text-foreground/40 group-hover:text-foreground/70",
              )} />
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border/70 px-4">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="h-[14px] w-[14px]" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{brand.companyName}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{brand.portalLabel}</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
            Menu
          </p>
          <NavItems onNavigate={onNavigate} />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/70 p-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-foreground">{user?.email || "Cliente"}</p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Conta ativa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8] text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-[200px] shrink-0 border-r border-border/70 bg-white lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 flex w-[220px] flex-col border-r border-border/70 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-border/70 px-4">
              <div className="flex items-center gap-2.5">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Scale className="h-3.5 w-3.5" />
                  </div>
                )}
                <p className="text-[13px] font-semibold text-foreground">{brand.companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
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
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="h-3.5 w-3.5" />
              </div>
            )}
            <p className="text-[13px] font-semibold text-foreground">{brand.companyName}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f6f8]">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
