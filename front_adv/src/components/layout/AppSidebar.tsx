import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenText, LayoutDashboard, Users, DollarSign, Building2,
  BriefcaseBusiness, UserCog, UserSquare2, Gavel, Globe2, FolderKanban,
  CalendarDays, FileStack, FileSignature, FolderOpen, X, ChevronLeft,
  ChevronRight, BarChart3, Timer, Banknote, CheckSquare, Clock,
  MessageSquare, Shield, FileText, Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { leadService } from "@/services/api";

type NavItem = { label: string; icon: any; path: string; roles?: string[]; color?: string };
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
    items: [{ label: "Painel", icon: LayoutDashboard, path: "/app/dashboard", color: "text-gold" }],
  },
  {
    title: "Jurídico",
    items: [
      { label: "Clientes", icon: Users, path: "/app/clientes", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Processos", icon: Gavel, path: "/app/processos", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Áreas de atuação", icon: FolderKanban, path: "/app/areas", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Documentos", icon: FileStack, path: "/app/documentos", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Contratos", icon: FileSignature, path: "/app/contratos", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Modelos", icon: FileText, path: "/app/modelos", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Audiências", icon: FolderOpen, path: "/app/audiencias", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Prazos", icon: Timer, path: "/app/prazos", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Tarefas", icon: CheckSquare, path: "/app/tarefas", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Horas", icon: Clock, path: "/app/horas", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Chat", icon: MessageSquare, path: "/app/chat", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
      { label: "Agenda", icon: CalendarDays, path: "/app/agenda", color: "text-sky-400", roles: ["OWNER","ADMIN","LAWYER","ASSISTANT"] },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Financeiro", icon: DollarSign, path: "/app/financeiro", color: "text-emerald-400", roles: ["OWNER","ADMIN","FINANCE"] },
      { label: "Honorários", icon: Banknote, path: "/app/honorarios", color: "text-emerald-400", roles: ["OWNER","ADMIN","FINANCE","LAWYER"] },
      { label: "Relatórios", icon: BarChart3, path: "/app/relatorios", color: "text-emerald-400", roles: ["OWNER","ADMIN","FINANCE"] },
    ],
  },
  {
    title: "Administração",
    items: [
      { label: "Funcionários", icon: UserSquare2, path: "/app/funcionarios", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Cargos", icon: BriefcaseBusiness, path: "/app/cargos", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Usuários", icon: UserCog, path: "/app/usuarios", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Empresas", icon: Building2, path: "/app/empresas", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Site institucional", icon: Globe2, path: "/app/landing", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Blog", icon: BookOpenText, path: "/app/blog", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Auditoria", icon: Shield, path: "/app/auditoria", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
      { label: "Configurações", icon: Settings, path: "/app/configuracoes", color: "text-amber-400", roles: ["OWNER","ADMIN"] },
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
      return <img src={companyLogo} alt="Logo" className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-white/20" />;
    }
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-sm text-white">
        {companyName.charAt(0).toUpperCase()}
      </div>
    );
  }

  function renderSections(isCollapsed: boolean, onNavigate?: () => void) {
    return navSections.map((section) => {
      const visibleItems = section.items.filter((item) => (item.roles ? hasRole(...(item.roles as any)) : true));
      if (visibleItems.length === 0) return null;
      return (
        <div key={section.title} className="space-y-0.5">
          {!isCollapsed && (
            <p className="px-3 pb-1 pt-4 first:pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
              {section.title}
            </p>
          )}
          {isCollapsed && <div className="mx-3 my-3 h-px bg-white/[0.07]" />}

          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const linkEl = (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center rounded-lg transition-all duration-150 select-none",
                  isCollapsed ? "h-9 w-9 justify-center mx-auto" : "gap-2.5 px-3 py-[7px] text-[13px]",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80",
                )}
              >
                <item.icon className={cn(
                  "h-[15px] w-[15px] shrink-0 transition-colors",
                  isActive ? (item.color ?? "text-white") : "text-white/35 group-hover:text-white/60",
                )} />
                {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
                {!isCollapsed && isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/50 shrink-0" />}
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
      );
    });
  }

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        "hidden h-screen shrink-0 flex-col overflow-hidden transition-all duration-300 lg:flex",
        "bg-[#0d0f14] border-r border-white/[0.06]",
        collapsed ? "w-[60px]" : "w-[232px]",
      )}>
        {/* Header */}
        <div className={cn("flex h-14 shrink-0 items-center border-b border-white/[0.07]", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
          {renderBrand()}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold leading-tight text-white">{companyName}</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">Portal Jurídico</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {renderSections(collapsed)}
        </div>

        {/* Collapse */}
        <div className={cn("shrink-0 border-t border-white/[0.06] p-2", collapsed ? "flex justify-center" : "")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className={cn(
              "h-8 rounded-lg text-white/25 hover:bg-white/[0.06] hover:text-white/60",
              collapsed ? "w-8 px-0" : "w-full gap-2 text-xs font-medium",
            )}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : (<><ChevronLeft className="h-3.5 w-3.5" /><span>Recolher</span></>)}
          </Button>
        </div>
      </aside>

      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 flex h-full w-[260px] flex-col bg-[#0d0f14] border-r border-white/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
              <div className="flex min-w-0 items-center gap-3">
                {renderBrand()}
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold leading-tight text-white">{companyName}</p>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">Portal Jurídico</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-1">
              {renderSections(false, onClose)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
