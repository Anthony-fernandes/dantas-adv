import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Gavel, FolderKanban, FileStack, FileSignature,
  FileText, FolderOpen, Timer, CheckSquare, Clock, MessageSquare, CalendarDays,
  DollarSign, Banknote, Receipt, BookOpenCheck, BarChart3,
  UserSquare2, BriefcaseBusiness, UserCog, Building2, Globe2, BookOpenText,
  Shield, Plug, Settings, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { label: string; to: string; icon: React.ComponentType<{ className?: string }> };
type Section = { title: string; items: Item[] };

const nav: Section[] = [
  {
    title: "Workspace",
    items: [{ label: "Painel", to: "/app", icon: LayoutDashboard }],
  },
  {
    title: "Jurídico",
    items: [
      { label: "Clientes", to: "/app/clientes", icon: Users },
      { label: "Processos", to: "/app/processos", icon: Gavel },
      { label: "Áreas de atuação", to: "/app/areas", icon: FolderKanban },
      { label: "Documentos", to: "/app/documentos", icon: FileStack },
      { label: "Contratos", to: "/app/contratos", icon: FileSignature },
      { label: "Modelos", to: "/app/modelos", icon: FileText },
      { label: "Audiências", to: "/app/audiencias", icon: FolderOpen },
      { label: "Prazos", to: "/app/prazos", icon: Timer },
      { label: "Tarefas", to: "/app/tarefas", icon: CheckSquare },
      { label: "Horas", to: "/app/horas", icon: Clock },
      { label: "Chat", to: "/app/chat", icon: MessageSquare },
      { label: "Agenda", to: "/app/agenda", icon: CalendarDays },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Financeiro", to: "/app/financeiro", icon: DollarSign },
      { label: "Honorários", to: "/app/honorarios", icon: Banknote },
      { label: "NFS-e", to: "/app/nfse", icon: Receipt },
      { label: "Contabilidade", to: "/app/contabilidade", icon: BookOpenCheck },
      { label: "Relatórios", to: "/app/relatorios", icon: BarChart3 },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Funcionários", to: "/app/funcionarios", icon: UserSquare2 },
      { label: "Cargos", to: "/app/cargos", icon: BriefcaseBusiness },
      { label: "Usuários", to: "/app/usuarios", icon: UserCog },
      { label: "Empresas", to: "/app/empresas", icon: Building2 },
      { label: "Site institucional", to: "/app/landing", icon: Globe2 },
      { label: "Blog", to: "/app/blog", icon: BookOpenText },
      { label: "Auditoria", to: "/app/auditoria", icon: Shield },
      { label: "Integrações", to: "/app/integracoes", icon: Plug },
      { label: "Configurações", to: "/app/configuracoes", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-[248px] shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Scale className="h-4.5 w-4.5" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold text-sidebar-foreground">JurisFlow</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">Legal Suite</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {nav.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((it) => {
                const active = it.to === "/app" ? pathname === "/app" : pathname.startsWith(it.to);
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-sidebar-primary" />
                      )}
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")} />
                      <span className="truncate">{it.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-sidebar-accent/50 cursor-pointer">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary/20 text-sidebar-primary text-[11px] font-semibold">
            MS
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-medium">Marina Souza</p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">Sócia — OAB/SP 123.456</p>
          </div>
        </div>
      </div>
    </aside>
  );
}