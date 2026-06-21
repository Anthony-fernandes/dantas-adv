import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpenText, LayoutDashboard, Users, DollarSign, Building2,
  BriefcaseBusiness, UserCog, UserSquare2, Gavel, Globe2, FolderKanban,
  CalendarDays, FileStack, FileSignature, FolderOpen, BarChart3, Timer,
  Banknote, CheckSquare, Clock, MessageSquare, Shield, FileText, Settings,
  Receipt, BookOpenCheck,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { leadService } from "@/services/api";

type NavItem = { label: string; icon: any; path: string; roles?: string[] };
type NavSection = { title: string; items: NavItem[] };

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
      { label: "Funcionários",       icon: UserSquare2,       path: "/app/funcionarios",  roles: ["OWNER","ADMIN"] },
      { label: "Cargos",             icon: BriefcaseBusiness, path: "/app/cargos",        roles: ["OWNER","ADMIN"] },
      { label: "Usuários",           icon: UserCog,           path: "/app/usuarios",      roles: ["OWNER","ADMIN"] },
      { label: "Empresas",           icon: Building2,         path: "/app/empresas",      roles: ["OWNER","ADMIN"] },
      { label: "Site institucional", icon: Globe2,            path: "/app/landing",       roles: ["OWNER","ADMIN"] },
      { label: "Blog",               icon: BookOpenText,      path: "/app/blog",          roles: ["OWNER","ADMIN"] },
      { label: "Auditoria",          icon: Shield,            path: "/app/auditoria",     roles: ["OWNER","ADMIN"] },
      { label: "Configurações",      icon: Settings,          path: "/app/configuracoes", roles: ["OWNER","ADMIN"] },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { hasRole, profile, logout } = useAuth();
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
  const userInitials = (profile?.full_name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase() || "")
    .join("");

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt="Logo"
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-glow"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow text-white text-[15px] font-bold">
              <Gavel className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-tight text-sidebar-foreground">
              {companyName}
            </p>
            <p className="text-[9px] uppercase tracking-widest text-sidebar-foreground/50">
              Portal Interno
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav sections */}
      <SidebarContent className="px-2 py-1">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles ? hasRole(...(item.roles as any)) : true
          );
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.title}>
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link to={item.path}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-1">
        <div className="glass m-1 rounded-xl p-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-[11px] font-bold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-sidebar-foreground">
              {profile?.full_name || "Usuário"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/60">Workspace interno</p>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
