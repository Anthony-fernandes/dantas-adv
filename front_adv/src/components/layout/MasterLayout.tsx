import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, LogOut, Menu, Shield, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { firstText } from "@/lib/brandTheme";
import { cn } from "@/lib/utils";
import { leadService } from "@/services/api";

const navItems = [{ label: "Empresas", icon: Building2, path: "/master/companies" }];

export function MasterLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const publicSiteQuery = useQuery({
    queryKey: ["master-layout-brand"],
    queryFn: async () => await leadService.getPublicSite(),
  });

  const payload = publicSiteQuery.data as any;
  const settings = payload?.settings;

  const brand = useMemo(() => {
    const companyName = firstText(payload?.company?.name, settings?.brand_name, "JurisFlow");
    const logoUrl = firstText(payload?.company?.logo_url);

    return {
      companyName: companyName || "JurisFlow",
      logoUrl,
    };
  }, [payload?.company?.logo_url, payload?.company?.name, settings?.brand_name]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  function renderNav(onNavigate?: () => void) {
    return (
      <nav className="space-y-1.5">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} onClick={onNavigate}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors",
                isActive(item.path)
                  ? "border-white/10 bg-white/10 text-white"
                  : "border-transparent text-white/65 hover:border-white/10 hover:bg-white/5 hover:text-white",
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

  function renderBrandMark() {
    if (brand.logoUrl) {
      return <img src={brand.logoUrl} alt={`Logo de ${brand.companyName}`} className="h-12 w-12 rounded-md border border-white/10 object-cover" />;
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/10 text-white">
        <Shield className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-ink lg:flex">
          <div className="border-b border-white/10 px-6 py-8">
            <div className="flex items-center gap-4">
              {renderBrandMark()}
              <div className="min-w-0">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-gold">Painel master</p>
                <p className="truncate font-display text-2xl text-white">{brand.companyName}</p>
                <p className="mt-1 text-xs text-white/55">Governanca global de empresas, usuarios e acessos.</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-sm font-medium text-white">Console administrativo</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Estrutura enxuta e contrastada para gerenciamento global do ecossistema.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <p className="px-3 pb-3 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-white/45">Navegacao</p>
            {renderNav()}
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-4">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-white/45">Sessao atual</p>
              <p className="mt-2 truncate text-sm font-medium text-white">{user?.email || "Superusuario"}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={logout}
              className="mt-4 h-11 w-full rounded-md border border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 bg-paper text-foreground">
          <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 backdrop-blur-sm lg:hidden">
            <div className="flex min-w-0 items-center gap-3">
              {renderBrandMark()}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">Painel master</p>
                <p className="truncate text-xs text-white/55">{brand.companyName}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="rounded-md border border-white/10 text-white hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden" onClick={() => setMobileOpen(false)}>
              <aside
                className="h-full w-[304px] border-r border-white/10 bg-ink px-4 py-4 shadow-elevated"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    {renderBrandMark()}
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl text-white">Painel master</p>
                      <p className="truncate text-xs text-white/55">{brand.companyName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-md border border-white/10 text-white hover:bg-white/10 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pt-4">{renderNav(() => setMobileOpen(false))}</div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={logout}
                  className="mt-6 h-11 w-full rounded-md border border-white/10 text-white hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </aside>
            </div>
          ) : null}

          <main className="px-4 pb-8 pt-20 sm:px-6 lg:px-10 lg:pb-10 lg:pt-10">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
