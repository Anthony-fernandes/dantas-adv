import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Gavel, FileStack, DollarSign, FileSignature, MessageSquare, Scale, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/portal", label: "Início", icon: Home, exact: true },
  { to: "/portal/processos", label: "Meus processos", icon: Gavel },
  { to: "/portal/documentos", label: "Documentos", icon: FileStack },
  { to: "/portal/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/portal/contratos", label: "Contratos", icon: FileSignature },
  { to: "/portal/mensagens", label: "Mensagens", icon: MessageSquare },
];

export function PortalSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Scale className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold">JurisFlow</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">Portal do cliente</p>
        </div>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-0.5">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link to={it.to} className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}>
                  <Icon className={cn("h-4 w-4", active ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link to="/portal/login" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </Link>
      </div>
    </aside>
  );
}