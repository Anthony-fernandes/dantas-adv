import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Calendar, Briefcase, Gavel, FileText, Scale,
  Users, Wallet, Receipt, CreditCard, IdCard, UserCog, Building2,
  ChevronDown, Search, Bell, ChevronsUpDown, Globe, FileSignature,
} from "lucide-react";
import { useState, type ReactNode } from "react";

type Item = { label: string; to: string; icon: any; badge?: string };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Painel",
    items: [
      { label: "Dashboard", to: "/app/dashboard", icon: LayoutDashboard },
      { label: "Agenda", to: "/app/agenda", icon: Calendar },
    ],
  },
  {
    label: "Jurídico",
    items: [
      { label: "Processos", to: "/app/processes", icon: Briefcase, badge: "24" },
      { label: "Audiências", to: "/app/hearings", icon: Gavel },
      { label: "Documentos", to: "/app/documents", icon: FileText },
      { label: "Áreas de Atuação", to: "/app/practice-areas", icon: Scale },
      { label: "Clientes", to: "/app/clients", icon: Users },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { label: "Visão Geral", to: "/app/financial", icon: Wallet },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { label: "Funcionários", to: "/app/employees", icon: IdCard },
      { label: "Cargos", to: "/app/positions", icon: UserCog },
      { label: "Usuários", to: "/app/users", icon: Users },
      { label: "Empresa", to: "/app/company", icon: Building2 },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { label: "CMS Landing", to: "/app/cms/landing", icon: Globe },
      { label: "CMS Blog", to: "/app/cms/blog", icon: FileSignature },
    ],
  },
];

const tenants = [
  { id: "sp", name: "Silva & Bastos", office: "Matriz São Paulo" },
  { id: "rj", name: "Silva & Bastos", office: "Filial Rio" },
  { id: "bh", name: "Silva & Bastos", office: "Filial BH" },
];

export function AppShell({ children, eyebrow, title, actions }: { children: ReactNode; eyebrow?: string; title?: string; actions?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [tenant, setTenant] = useState(tenants[0]);
  const [tenantOpen, setTenantOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-paper text-ink">
      {/* SIDEBAR */}
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-8 bg-gold rounded-sm grid place-items-center text-white font-display italic text-lg leading-none">J</div>
            <div className="leading-tight">
              <div className="font-display text-lg text-white">JurisDictum</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono-ui">Legal Suite</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="text-[10px] font-mono-ui uppercase tracking-[0.18em] text-white/35 font-medium px-3 mb-2">{g.label}</div>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = path === it.to || path.startsWith(it.to + "/");
                  const Icon = it.icon;
                  return (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        className={`flex items-center gap-3 px-3 py-2 text-[13px] rounded-md transition-colors ${active ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                      >
                        <Icon className="size-4 opacity-80" />
                        <span className="flex-1">{it.label}</span>
                        {it.badge && <span className="text-[10px] font-mono-ui text-gold bg-gold/15 px-1.5 py-0.5 rounded-sm">{it.badge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer">
            <div className="size-8 rounded-full bg-gold/30 grid place-items-center text-xs font-semibold text-white">DM</div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-white truncate">Dr. Daniel Marques</div>
              <div className="text-[10px] text-white/40 truncate">Sócio · daniel@silvabastos.adv</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-16 bg-surface rule-b sticky top-0 z-30 flex items-center px-6 gap-6">
          <div className="relative">
            <button
              onClick={() => setTenantOpen((v) => !v)}
              className="flex items-center gap-3 px-3 py-1.5 border border-rule rounded-md hover:bg-paper transition-colors"
            >
              <div className="size-6 bg-ink text-paper grid place-items-center rounded-sm text-[10px] font-display italic">{tenant.id.toUpperCase()}</div>
              <div className="text-left leading-tight">
                <div className="text-[12px] font-semibold">{tenant.name}</div>
                <div className="text-[10px] text-ink-soft font-mono-ui uppercase tracking-wider">{tenant.office}</div>
              </div>
              <ChevronsUpDown className="size-3.5 text-ink-soft" />
            </button>
            {tenantOpen && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-surface border border-rule shadow-elevated z-50 rounded-md overflow-hidden">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTenant(t); setTenantOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-paper text-left"
                  >
                    <div className="size-6 bg-ink text-paper grid place-items-center rounded-sm text-[10px] font-display italic">{t.id.toUpperCase()}</div>
                    <div className="flex-1 leading-tight">
                      <div className="text-[12px] font-semibold">{t.name}</div>
                      <div className="text-[10px] text-ink-soft font-mono-ui uppercase tracking-wider">{t.office}</div>
                    </div>
                  </button>
                ))}
                <Link to="/onboarding/select" className="block px-3 py-2.5 text-[11px] text-gold border-t border-rule hover:bg-paper font-medium">Gerenciar escritórios →</Link>
              </div>
            )}
          </div>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
            <input
              placeholder="Buscar processos, clientes, documentos..."
              className="w-full bg-paper border border-rule rounded-md pl-9 pr-16 h-9 text-[13px] focus:outline-none focus:border-gold/50"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono-ui text-ink-soft border border-rule rounded px-1.5 py-0.5 bg-surface">⌘K</kbd>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative size-9 grid place-items-center rounded-md hover:bg-paper">
              <Bell className="size-4" />
              <span className="absolute top-2 right-2 size-1.5 bg-danger rounded-full" />
            </button>
            <div className="size-9 rounded-full bg-gold/20 border border-rule grid place-items-center text-xs font-semibold">DM</div>
          </div>
        </header>

        {(eyebrow || title || actions) && (
          <div className="px-8 pt-8 pb-6 flex items-end justify-between gap-6 rule-b bg-paper">
            <div>
              {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
              {title && <h1 className="font-display text-4xl text-balance">{title}</h1>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>
        )}

        <main className="flex-1 p-8 bg-paper">{children}</main>
      </div>
    </div>
  );
}
