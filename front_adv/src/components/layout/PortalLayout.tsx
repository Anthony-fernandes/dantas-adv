import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FileText, Gavel, Home, LogOut, Menu, MessageSquare, Scale, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { firstText } from "@/lib/brandTheme";
import { cn } from "@/lib/utils";
import { leadService } from "@/services/api";

const portalNav = [
  { label: "Inicio", icon: Home, path: "/portal" },
  { label: "Processos", icon: Scale, path: "/portal/processos" },
  { label: "Documentos", icon: FileText, path: "/portal/documentos" },
  { label: "Financeiro", icon: DollarSign, path: "/portal/financeiro" },
  { label: "Mensagens", icon: MessageSquare, path: "/portal/mensagens" },
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

    return {
      companyName: companyName || "Portal do Cliente",
      logoUrl,
    };
  }, [payload?.company?.logo_url, payload?.company?.name, settings?.brand_name]);

  const isActive = (path: string) => {
    if (path === "/portal") return location.pathname === "/portal";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  function renderBrandMark() {
    if (brand.logoUrl) {
      return <img src={brand.logoUrl} alt={`Logo de ${brand.companyName}`} className="h-12 w-12 rounded-md border border-border object-cover" />;
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted/45 text-foreground">
        <Gavel className="h-5 w-5" />
      </div>
    );
  }

  function renderNav(onNavigate?: () => void) {
    return (
      <nav className="space-y-1.5">
        {portalNav.map((item) => (
          <Link key={item.path} to={item.path} onClick={onNavigate}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                isActive(item.path)
                  ? "border-foreground bg-foreground text-background"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="border-b border-border px-8 py-8">
            <div className="flex items-center gap-4">
              {renderBrandMark()}
              <div className="min-w-0">
                <p className="eyebrow mb-1">Portal do cliente</p>
                <p className="truncate font-display text-2xl text-foreground">{brand.companyName}</p>
                <p className="mt-1 text-xs text-muted-foreground">Acompanhamento institucional e documentos compartilhados.</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-accent/40 px-4 py-4">
              <p className="text-sm font-medium text-foreground">Clareza sobre cada etapa</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Consulte prazos, comunicados e arquivos com uma navegacao mais sobria e organizada.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="px-3 pb-3 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Navegacao</p>
            {renderNav()}
          </div>

          <div className="border-t border-border p-4">
            <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-card">
              <p className="eyebrow mb-2">Conta conectada</p>
              <p className="truncate text-sm font-medium text-foreground">{user?.email || "Cliente"}</p>
            </div>

            <Button type="button" variant="outline" onClick={logout} className="mt-4 h-11 w-full rounded-md">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur-sm lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              {renderBrandMark()}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">Portal do cliente</p>
                <p className="truncate text-xs text-muted-foreground">{brand.companyName}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-md border border-border text-foreground hover:bg-muted/45"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden" onClick={() => setMobileOpen(false)}>
              <aside
                className="h-full w-[304px] border-r border-border bg-surface px-4 py-4 shadow-elevated"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    {renderBrandMark()}
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl text-foreground">Portal do cliente</p>
                      <p className="truncate text-xs text-muted-foreground">{brand.companyName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-md border border-border text-foreground hover:bg-muted/45"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pt-4">{renderNav(() => setMobileOpen(false))}</div>

                <Button type="button" variant="outline" onClick={logout} className="mt-6 h-11 w-full rounded-md">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </aside>
            </div>
          ) : null}

          <main className="min-w-0 px-4 pb-8 pt-20 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
            <div className="mx-auto w-full max-w-[1180px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
