import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Briefcase, FileText, Wallet, MessageSquare, LogOut } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  { label: "Início", to: "/portal", icon: Home },
  { label: "Meus Processos", to: "/portal/processes", icon: Briefcase },
  { label: "Documentos", to: "/portal/documents", icon: FileText },
  { label: "Financeiro", to: "/portal/financial", icon: Wallet },
  { label: "Mensagens", to: "/portal/messages", icon: MessageSquare },
];

export function PortalShell({ children, title, eyebrow }: { children: ReactNode; title?: string; eyebrow?: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-[1400px] mx-auto flex">
        <aside className="w-72 shrink-0 min-h-screen border-r border-rule bg-surface flex flex-col">
          <div className="p-8 border-b border-rule">
            <div className="eyebrow mb-2">Portal do Cliente</div>
            <div className="font-display text-2xl">Silva & Bastos</div>
            <div className="text-xs text-ink-soft mt-1">Advogados Associados</div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {items.map((it) => {
              const active = path === it.to || (it.to !== "/portal" && path.startsWith(it.to));
              const Icon = it.icon;
              return (
                <Link key={it.to} to={it.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper hover:text-ink"}`}>
                  <Icon className="size-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-rule">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="size-9 rounded-full bg-gold-soft grid place-items-center text-xs font-semibold">MC</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">Mariana Costa</div>
                <div className="text-[10px] text-ink-soft truncate">Cliente · #88201</div>
              </div>
              <Link to="/portal/login" className="text-ink-soft hover:text-ink"><LogOut className="size-4" /></Link>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {(title || eyebrow) && (
            <div className="px-10 py-10 border-b border-rule">
              {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
              {title && <h1 className="font-display text-4xl">{title}</h1>}
            </div>
          )}
          <div className="p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
