import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenText, LayoutDashboard, Users, DollarSign, Building2,
  BriefcaseBusiness, UserCog, UserSquare2, Gavel, Globe2, FolderKanban,
  CalendarDays, FileStack, FileSignature, FolderOpen, X, ChevronLeft,
  ChevronRight, BarChart3, Timer, Banknote, CheckSquare, Clock,
  MessageSquare, Plug, Shield, FileText, Settings, Receipt, BookOpenCheck,
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

/* Rotas REAIS do sistema — não inventar módulos. */
const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Painel", icon: LayoutDashboard, path: "/app/dashboard" },
    ],
  },
  {
    title: "Jurídico",
    items: [
      { label: "Clientes",         icon: Users,         path: "/app/clientes",   roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Processos",        icon: Gavel,         path: "/app/processos",  roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Áreas de atuação", icon: FolderKanban,  path: "/app/areas",      roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Documentos",       icon: FileStack,     path: "/app/documentos", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Contratos",        icon: FileSignature, path: "/app/contratos",  roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Modelos",          icon: FileText,      path: "/app/modelos",    roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Audiências",       icon: FolderOpen,    path: "/app/audiencias", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Prazos",           icon: Timer,         path: "/app/prazos",     roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Tarefas",          icon: CheckSquare,   path: "/app/tarefas",    roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Horas",            icon: Clock,         path: "/app/horas",      roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Chat",             icon: MessageSquare, path: "/app/chat",       roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Agenda",           icon: CalendarDays,  path: "/app/agenda",     roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Financeiro",    icon: DollarSign,    path: "/app/financeiro",    roles: ["OWNER","ADMIN","FINANCE"] },
      { label: "Honorários",    icon: Banknote,      path: "/app/honorarios",    roles: ["OWNER","ADMIN","FINANCE","LAWYER"] },
      { label: "NFS-e",         icon: Receipt,       path: "/app/nfse",          roles: ["OWNER","ADMIN","FINANCE"] },
      { label: "Contabilidade", icon: BookOpenCheck, path: "/app/contabilidade", roles: ["OWNER","ADMIN","FINANCE"] },
      { label: "Relatórios",    icon: BarChart3,     path: "/app/relatorios",    roles: ["OWNER","ADMIN","FINANCE"] },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Funcionários",      icon: UserSquare2,       path: "/app/funcionarios",  roles: ["OWNER","ADMIN"] },
      { label: "Cargos",            icon: BriefcaseBusiness, path: "/app/cargos",        roles: ["OWNER","ADMIN"] },
      { label: "Usuários",          icon: UserCog,           path: "/app/usuarios",      roles: ["OWNER","ADMIN"] },
      { label: "Empresas",          icon: Building2,         path: "/app/empresas",      roles: ["OWNER","ADMIN"] },
      { label: "Site institucional",icon: Globe2,            path: "/app/landing",       roles: ["OWNER","ADMIN"] },
      { label: "Blog",              icon: BookOpenText,      path: "/app/blog",          roles: ["OWNER","ADMIN"] },
      { label: "Auditoria",         icon: Shield,            path: "/app/auditoria",     roles: ["OWNER","ADMIN"] },
      { label: "Integrações",       icon: Plug,              path: "/app/integracoes",   roles: ["OWNER","ADMIN"] },
      { label: "Configurações",     icon: Settings,          path: "/app/configuracoes", roles: ["OWNER","ADMIN"] },
    ],
  },
];

export function AppSidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }: AppSidebarProps) {
  const location = useLocation();
  const { hasRole, profile } = useAuth();
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
  const initials = (profile?.full_name || companyName).charAt(0).toUpperCase();
  const userInitials = (profile?.full_name || "U").split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase() || "").join("");

  function renderBrand() {
    if (companyLogo) {
      return <img src={companyLogo} alt="Logo" className="h-7 w-7 shrink-0 rounded-md object-cover" />;
    }
    return (
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-chart-5 text-[13px] font-bold text-primary-foreground shadow-lg shadow-primary/20">
        {initials}
      </div>
    );
  }

  function renderSections(isCollapsed: boolean, onNavigate?: () => void) {
    return navSections.map((section) => {
      const visibleItems = section.items.filter((item) => (item.roles ? hasRole(...(item.roles as any)) : true));
      if (visibleItems.length === 0) return null;
      return (
        <div key={section.title}>
          {!isCollapsed && (
            <p className="px-3 pb-1.5 pt-5 first:pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
              {section.title}
            </p>
          )}
          {isCollapsed && <div className="mx-auto my-3 h-px w-7 bg-sidebar-border" />}

          <div className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const linkEl = (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center rounded-md transition-colors select-none",
                    isCollapsed ? "mx-auto h-8 w-8 justify-center" : "gap-2.5 px-2.5 py-1.5 text-[13px]",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground/80",
                  )} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </Link>
              );
              if (isCollapsed) {
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return linkEl;
            })}
          </div>
        </div>
      );
    });
  }

  const brandHeader = (isCollapsed: boolean) => (
    <div className={cn(
      "flex h-14 shrink-0 items-center border-b border-sidebar-border",
      isCollapsed ? "justify-center px-2" : "gap-2.5 px-4",
    )}>
      {renderBrand()}
      {!isCollapsed && (
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">{companyName}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Portal interno</p>
        </div>
      )}
    </div>
  );

  const footer = (
    <div className={cn("shrink-0 border-t border-sidebar-border", collapsed ? "flex flex-col items-center gap-2 p-2" : "p-3")}>
      {!collapsed && (
        <div className="mb-2 flex items-center gap-2.5 rounded-md p-2 hover:bg-sidebar-accent/60">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-chart-2 to-chart-5 text-[11px] font-semibold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-foreground">{profile?.full_name || "Usuário"}</p>
            <p className="truncate text-[10.5px] text-muted-foreground">{profile?.roles?.[0] || "Equipe interna"}</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div className="mb-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-chart-2 to-chart-5 text-[11px] font-semibold text-white">
          {userInitials}
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className={cn(
          "h-6 rounded-md text-muted-foreground/60 hover:bg-sidebar-accent hover:text-foreground",
          collapsed ? "mx-auto w-6 px-0" : "w-full gap-1.5 text-[10.5px] font-medium",
        )}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <><ChevronLeft className="h-3.5 w-3.5" /><span>Recolher</span></>}
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        "hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-all duration-200 md:flex",
        collapsed ? "w-[56px]" : "w-[232px]",
      )}>
        {brandHeader(collapsed)}
        <div className="flex-1 overflow-y-auto px-2 py-2">{renderSections(collapsed)}</div>
        {footer}
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 flex h-full w-[248px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                {renderBrand()}
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[13px] font-semibold text-foreground">{companyName}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Portal interno</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" aria-label="Fechar menu" className="h-7 w-7 text-muted-foreground" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">{renderSections(false, onClose)}</div>
          </aside>
        </div>
      )}
    </>
  );
}
