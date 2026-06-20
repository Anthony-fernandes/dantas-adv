import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  DollarSign,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Scale,
  Sun,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { firstText } from "@/lib/brandTheme";
import { cn } from "@/lib/utils";
import { leadService } from "@/services/api";

const portalNav = [
  { label: "Início", icon: Home, path: "/portal" },
  { label: "Processos", icon: Scale, path: "/portal/processos" },
  { label: "Documentos", icon: FileText, path: "/portal/documentos" },
  { label: "Financeiro", icon: DollarSign, path: "/portal/financeiro" },
  { label: "Mensagens", icon: MessageSquare, path: "/portal/mensagens" },
];

export function PortalLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
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

  const isActive = (path: string) => {
    if (path === "/portal") return location.pathname === "/portal";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const initials = (user?.email || "C").slice(0, 1).toUpperCase();

  function NavContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="space-y-0.5">
        {portalNav.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.companyName} className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/40">
              <Scale className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{brand.companyName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{brand.portalLabel}</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavContent />
        </div>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{user?.email || "Cliente"}</p>
              <p className="text-[10px] text-muted-foreground">Conta ativa</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                title={isDark ? 'Modo claro' : 'Modo escuro'}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 rounded-md object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40">
              <Scale className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
          <p className="text-sm font-semibold text-foreground">{brand.companyName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.companyName} className="h-7 w-7 rounded-md object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/40">
                    <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground">{brand.companyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavContent onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => { logout(); setMobileOpen(false); }}
                className="h-10 w-full gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
