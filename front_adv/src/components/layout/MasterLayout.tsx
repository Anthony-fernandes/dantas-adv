import { useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { Building2, LogOut, Menu, Shield, X, ChevronRight, UserPlus, Users, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Empresas", icon: Building2, path: "/master/companies" },
];

const companyTabs = [
  { key: "company",     label: "Empresa",       icon: Building2 },
  { key: "admin-user",  label: "Usuário admin",  icon: UserPlus },
  { key: "users",       label: "Usuários",       icon: Users },
  { key: "permissions", label: "Permissões",     icon: Lock },
];

export function MasterLayout() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const onCompanies = isActive("/master/companies");
  const activeTab = searchParams.get("tab") || "company";

  function setTab(key: string) {
    setSearchParams({ tab: key }, { replace: true });
  }

  const initials = (user?.email || "S").slice(0, 2).toUpperCase();

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.07] text-white/50">
              <Shield className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">Master</p>
              <p className="text-[15px] font-bold leading-tight text-white">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
            Navegação
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={onNavigate}>
                  <div className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-150",
                    active ? "bg-white/[0.08] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white/70"
                  )}>
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                      active ? "bg-white/10" : "bg-transparent group-hover:bg-white/[0.06]"
                    )}>
                      <item.icon className="h-[15px] w-[15px]" />
                    </div>
                    <p className="text-[13px] font-medium">{item.label}</p>
                    {active && <ChevronRight className="ml-auto h-3 w-3 text-white/25" />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sub-nav when on Companies page */}
          {onCompanies && (
            <div className="mt-4">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                Configuração
              </p>
              <nav className="space-y-0.5">
                {companyTabs.map((t) => {
                  const active = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => { setTab(t.key); onNavigate?.(); }}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 text-left",
                        active ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                      )}
                    >
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                        active ? "bg-gold/30" : "bg-white/5 group-hover:bg-white/10"
                      )}>
                        <t.icon className={cn("h-3.5 w-3.5", active ? "text-gold" : "")} />
                      </div>
                      <p className="text-[13px] font-medium leading-none">{t.label}</p>
                      {active && <ChevronRight className="ml-auto h-3 w-3 text-white/30" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.07] px-3 py-4 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-white">{user?.email || "Superusuário"}</p>
              <p className="text-[10px] text-white/35">Administrador master</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f4f5] text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 bg-[#1a1a1f] lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 h-full w-60 bg-[#1a1a1f]"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-foreground">Painel Master</span>
          </div>
          <button
            className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
