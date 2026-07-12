import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { BRAND } from "@/lib/brand";
import { Building2, Users, Shield, BarChart3, Scale, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/master")({
  component: MasterLayout,
});

const items = [
  { to: "/master/companies", label: "Empresas", icon: Building2 },
  { to: "/master/users", label: "Usuários", icon: Users },
  { to: "/master/security", label: "Segurança", icon: Shield },
  { to: "/master/metrics", label: "Métricas", icon: BarChart3 },
];

function MasterLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex sticky top-0 h-screen w-[220px] shrink-0 flex-col bg-primary text-primary-foreground gradient-brand">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-white/10">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-white/10">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-[14.5px] font-semibold">{BRAND.name}</p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Master</p>
          </div>
        </div>
        <nav className="flex-1 p-3">
          <ul className="space-y-0.5">
            {items.map((it) => {
              const active = pathname.startsWith(it.to);
              const Icon = it.icon;
              return (
                <li key={it.to}>
                  <Link to={it.to} className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                    active ? "bg-white/15 text-white font-medium" : "text-white/75 hover:bg-white/10",
                  )}>
                    <Icon className="h-4 w-4" /> {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link to="/master/login" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] text-white/70 hover:bg-white/10">
            <LogOut className="h-4 w-4" /> Sair
          </Link>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Console Master</p>
            <p className="text-[13.5px] font-medium">Administração do SaaS</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/15 px-3 py-1 text-[11px] font-medium text-warning-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Acesso privilegiado
          </span>
        </header>
        <main className="flex-1"><Outlet /></main>
      </div>
    </div>
  );
}