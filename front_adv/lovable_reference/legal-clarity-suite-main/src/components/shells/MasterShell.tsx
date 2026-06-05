import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, Users, ShieldCheck, Activity, LogOut } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  { label: "Visão Global", to: "/master", icon: Activity },
  { label: "Empresas", to: "/master/companies", icon: Building2 },
  { label: "Usuários", to: "/master/users", icon: Users },
  { label: "Permissões", to: "/master/permissions", icon: ShieldCheck },
];

export function MasterShell({ children, eyebrow, title, actions }: { children: ReactNode; eyebrow?: string; title?: string; actions?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex bg-ink text-paper">
      <aside className="w-72 shrink-0 border-r border-white/10 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-white/10">
          <div className="text-[10px] font-mono-ui uppercase tracking-[0.2em] text-gold mb-2">Master Console</div>
          <div className="font-display text-2xl text-white">JurisDictum</div>
          <div className="text-[11px] text-white/50 mt-1">Painel Global de Administração</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {items.map((it) => {
            const active = it.to === "/master" ? path === it.to : path.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="size-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="size-9 rounded-full bg-gold/20 grid place-items-center text-xs font-semibold">RA</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white truncate">Root Admin</div>
            <div className="text-[10px] text-white/40">root@jurisdictum.com</div>
          </div>
          <Link to="/master/login" className="text-white/40 hover:text-white"><LogOut className="size-4" /></Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        {(title || eyebrow || actions) && (
          <div className="px-10 py-8 border-b border-white/10 flex items-end justify-between gap-6">
            <div>
              {eyebrow && <div className="text-[10px] font-mono-ui uppercase tracking-[0.2em] text-gold mb-2">{eyebrow}</div>}
              {title && <h1 className="font-display text-4xl text-white">{title}</h1>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        )}
        <main className="flex-1 p-10">{children}</main>
      </div>
    </div>
  );
}
