import { useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { Building2, LogOut, Menu, Shield, X, UserPlus, Users, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const companyTabs = [
  { key: "company",     label: "Empresa",      icon: Building2 },
  { key: "admin-user",  label: "Usuário admin", icon: UserPlus },
  { key: "users",       label: "Usuários",      icon: Users },
  { key: "permissions", label: "Permissões",    icon: Lock },
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
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border/70 px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-[14px] w-[14px]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Master</p>
            <p className="text-[13px] font-semibold leading-tight text-foreground">Painel Admin</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {onCompanies && (
            <div>
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                Empresas
              </p>
              <nav className="space-y-px">
                {companyTabs.map((t) => {
                  const active = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => { setTab(t.key); onNavigate?.(); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[6px] text-[13px] transition-all duration-100 text-left",
                        active
                          ? "bg-primary/[0.08] text-primary font-semibold"
                          : "text-foreground/60 hover:bg-muted hover:text-foreground font-medium"
                      )}
                    >
                      <t.icon className={cn(
                        "h-[15px] w-[15px] shrink-0 transition-colors",
                        active ? "text-primary" : "text-foreground/40"
                      )} />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/70 p-3">
          <div className="mb-1 flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-foreground">{user?.email || "Superusuário"}</p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Administrador master
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
            className="absolute left-0 top-0 h-full w-[200px] border-r border-border/70 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-border/70 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">Painel Admin</span>
              </div>
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                onClick={() => setMobileOpen(false)}
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
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-white px-4">
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-[13px] font-semibold text-foreground">Painel Master</span>
          </div>
          <div />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f6f8] p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
