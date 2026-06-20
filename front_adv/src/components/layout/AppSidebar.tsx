import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenText,
  LayoutDashboard,
  Users,
  DollarSign,
  Building2,
  BriefcaseBusiness,
  UserCog,
  UserSquare2,
  Gavel,
  Globe2,
  FolderKanban,
  CalendarDays,
  FileStack,
  FolderOpen,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Timer,
  Banknote,
  CheckSquare,
  Clock,
  MessageSquare,
  Shield,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { leadService } from "@/services/api";

type NavItem = { label: string; icon: any; path: string; roles?: string[] };
type NavSection = { title: string; items: NavItem[] };

type AppSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [{ label: "Painel", icon: LayoutDashboard, path: "/app/dashboard" }],
  },
  {
    title: "Jurídico",
    items: [
      { label: "Clientes", icon: Users, path: "/app/clientes", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Processos", icon: Gavel, path: "/app/processos", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Áreas de atuação", icon: FolderKanban, path: "/app/areas", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Documentos", icon: FileStack, path: "/app/documentos", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Modelos", icon: FileText, path: "/app/modelos", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Audiências", icon: FolderOpen, path: "/app/audiencias", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Prazos", icon: Timer, path: "/app/prazos", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Tarefas", icon: CheckSquare, path: "/app/tarefas", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Horas", icon: Clock, path: "/app/horas", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Chat", icon: MessageSquare, path: "/app/chat", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Agenda", icon: CalendarDays, path: "/app/agenda", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Financeiro", icon: DollarSign, path: "/app/financeiro", roles: ["OWNER", "ADMIN", "FINANCE"] },
      { label: "Honorários", icon: Banknote, path: "/app/honorarios", roles: ["OWNER", "ADMIN", "FINANCE", "LAWYER"] },
      { label: "Relatórios", icon: BarChart3, path: "/app/relatorios", roles: ["OWNER", "ADMIN", "FINANCE"] },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Funcionários", icon: UserSquare2, path: "/app/funcionarios", roles: ["OWNER", "ADMIN"] },
      { label: "Cargos", icon: BriefcaseBusiness, path: "/app/cargos", roles: ["OWNER", "ADMIN"] },
      { label: "Usuários", icon: UserCog, path: "/app/usuarios", roles: ["OWNER", "ADMIN"] },
      { label: "Empresas", icon: Building2, path: "/app/empresas", roles: ["OWNER", "ADMIN"] },
      { label: "Site institucional", icon: Globe2, path: "/app/landing", roles: ["OWNER", "ADMIN"] },
      { label: "Blog", icon: BookOpenText, path: "/app/blog", roles: ["OWNER", "ADMIN"] },
      { label: "Auditoria", icon: Shield, path: "/app/auditoria", roles: ["OWNER", "ADMIN"] },
    ],
  },
];

export function AppSidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }: AppSidebarProps) {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { activeTenant } = useTenant();
  const publicSiteQuery = useQuery({
    queryKey: ["sidebar-public-site-brand"],
    queryFn: async () => await leadService.getPublicSite(),
  });

  const companyName =
    String(activeTenant?.name || "").trim() ||
    String((publicSiteQuery.data as any)?.company?.name || "").trim() ||
    "JurisFlow";
  const companyLogo = String((publicSiteQuery.data as any)?.company?.logo_url || "").trim();

  function renderBrand() {
    if (companyLogo) {
      return <img src={companyLogo} alt="Logo da empresa" className="h-9 w-9 shrink-0 rounded-md border border-white/10 object-cover" />;
    }
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/10 font-display text-base font-semibold italic text-white">
        {companyName.charAt(0).toUpperCase()}
      </div>
    );
  }

  function renderSections(isCollapsed: boolean, onNavigate?: () => void) {
    return navSections.map((section) => {
      const visibleItems = section.items.filter((item) => (item.roles ? hasRole(...(item.roles as any)) : true));
      if (visibleItems.length === 0) return null;

      return (
        <div key={section.title} className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-1 pt-2 font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
              {section.title}
            </p>
          )}
          {isCollapsed && <div className="mx-3 my-2 h-px bg-white/8" />}

          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const linkEl = (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "flex items-center rounded-md border transition-colors",
                  isCollapsed ? "h-9 w-9 justify-center border-transparent mx-auto" : "gap-3 border px-3 py-2.5 text-[13px]",
                  isActive
                    ? "border-white/10 bg-white/10 text-white"
                    : "border-transparent text-[hsl(var(--sidebar-foreground)/0.72)] hover:border-white/8 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkEl;
          })}
        </div>
      );
    });
  }

  return (
    <>
      <aside
        className={cn(
          "hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 lg:flex",
          collapsed ? "w-[60px]" : "w-[260px]",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-white/8", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
          {renderBrand()}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
                Legal Suite
              </p>
              <p className="truncate font-display text-[1.05rem] font-semibold leading-tight text-white">{companyName}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          {renderSections(collapsed)}
        </div>

        <div className={cn("border-t border-white/8 p-2", collapsed ? "flex justify-center" : "")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              "h-8 rounded-md border border-white/8 text-[hsl(var(--sidebar-foreground)/0.55)] hover:bg-white/5 hover:text-white",
              collapsed ? "w-8 px-0" : "w-full gap-2 text-xs",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Recolher menu</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden" onClick={onClose}>
          <aside
            className="flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/8 px-4">
              <div className="flex min-w-0 items-center gap-3">
                {renderBrand()}
                <div className="min-w-0">
                  <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
                    Legal Suite
                  </p>
                  <p className="truncate font-display text-[1.05rem] font-semibold leading-tight text-white">{companyName}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-md border border-white/8 text-[hsl(var(--sidebar-foreground)/0.72)] hover:bg-white/5 hover:text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
              {renderSections(false, onClose)}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
