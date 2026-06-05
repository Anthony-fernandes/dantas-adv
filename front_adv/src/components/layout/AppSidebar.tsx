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
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { leadService } from "@/services/api";

type NavItem = { label: string; icon: any; path: string; roles?: string[] };
type NavSection = { title: string; items: NavItem[] };

type AppSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [{ label: "Painel", icon: LayoutDashboard, path: "/app/dashboard" }],
  },
  {
    title: "Juridico",
    items: [
      { label: "Clientes", icon: Users, path: "/app/clientes", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Processos", icon: Gavel, path: "/app/processos", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Areas de atuacao", icon: FolderKanban, path: "/app/areas", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Documentos", icon: FileStack, path: "/app/documentos", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Audiencias", icon: FolderOpen, path: "/app/audiencias", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
      { label: "Agenda", icon: CalendarDays, path: "/app/agenda", roles: ["OWNER", "ADMIN", "LAWYER", "ASSISTANT"] },
    ],
  },
  {
    title: "Financeiro",
    items: [{ label: "Financeiro", icon: DollarSign, path: "/app/financeiro", roles: ["OWNER", "ADMIN", "FINANCE"] }],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Funcionarios", icon: UserSquare2, path: "/app/funcionarios", roles: ["OWNER", "ADMIN"] },
      { label: "Cargos", icon: BriefcaseBusiness, path: "/app/cargos", roles: ["OWNER", "ADMIN"] },
      { label: "Usuarios", icon: UserCog, path: "/app/usuarios", roles: ["OWNER", "ADMIN"] },
      { label: "Empresas", icon: Building2, path: "/app/empresas", roles: ["OWNER", "ADMIN"] },
      { label: "Site institucional", icon: Globe2, path: "/app/landing", roles: ["OWNER", "ADMIN"] },
      { label: "Blog", icon: BookOpenText, path: "/app/blog", roles: ["OWNER", "ADMIN"] },
    ],
  },
];

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
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
      return <img src={companyLogo} alt="Logo da empresa" className="h-10 w-10 rounded-md border border-white/10 object-cover" />;
    }

    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/10 font-display text-lg font-semibold italic text-white">
        J
      </div>
    );
  }

  function renderSections(onNavigate?: () => void) {
    return navSections.map((section) => {
      const visibleItems = section.items.filter((item) => (item.roles ? hasRole(...(item.roles as any)) : true));
      if (visibleItems.length === 0) return null;

      return (
        <div key={section.title} className="space-y-1.5">
          <p className="px-3 py-1 font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
            {section.title}
          </p>

          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2.5 text-[13px] transition-colors",
                  isActive
                    ? "border-white/10 bg-white/10 text-white"
                    : "border-transparent text-[hsl(var(--sidebar-foreground)/0.72)] hover:border-white/8 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      );
    });
  }

  return (
    <>
      <aside
        className="hidden h-screen w-[280px] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      >
        <div className="flex h-16 items-center border-b border-white/8 px-4">
          <div className="flex min-w-0 items-center gap-3">
            {renderBrand()}
            <div className="min-w-0">
              <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
                Legal Suite
              </p>
              <p className="truncate font-display text-lg font-semibold text-white">{companyName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">{renderSections()}</div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 lg:hidden" onClick={onClose}>
          <aside
            className="flex h-full w-[304px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-white/8 px-4">
              <div className="flex min-w-0 items-center gap-3">
                {renderBrand()}
                <div className="min-w-0">
                  <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
                    Legal Suite
                  </p>
                  <p className="truncate font-display text-lg font-semibold text-white">{companyName}</p>
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

            <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">{renderSections(onClose)}</div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
