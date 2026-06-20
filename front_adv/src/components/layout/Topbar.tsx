import { Bell, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { TenantSwitcher } from '@/components/shared/TenantSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useApiData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TopbarProps = {
  onOpenMenu: () => void;
};

function resolvePageTitle(pathname: string) {
  if (pathname.startsWith('/app/processos')) return 'Processos';
  if (pathname.startsWith('/app/clientes')) return 'Clientes';
  if (pathname.startsWith('/app/areas')) return 'Áreas de atuação';
  if (pathname.startsWith('/app/documentos')) return 'Documentos';
  if (pathname.startsWith('/app/audiencias')) return 'Audiências';
  if (pathname.startsWith('/app/prazos')) return 'Prazos';
  if (pathname.startsWith('/app/tarefas')) return 'Tarefas';
  if (pathname.startsWith('/app/horas')) return 'Controle de Horas';
  if (pathname.startsWith('/app/agenda')) return 'Agenda';
  if (pathname.startsWith('/app/financeiro')) return 'Financeiro';
  if (pathname.startsWith('/app/honorarios')) return 'Honorários';
  if (pathname.startsWith('/app/relatorios')) return 'Relatórios';
  if (pathname.startsWith('/app/funcionarios')) return 'Funcionários';
  if (pathname.startsWith('/app/cargos')) return 'Cargos';
  if (pathname.startsWith('/app/usuarios')) return 'Usuários';
  if (pathname.startsWith('/app/empresas')) return 'Empresas';
  if (pathname.startsWith('/app/landing')) return 'Site institucional';
  if (pathname.startsWith('/app/blog')) return 'Blog';
  return 'Painel';
}

function resolvePageSection(pathname: string) {
  if (
    pathname.startsWith('/app/processos') ||
    pathname.startsWith('/app/clientes') ||
    pathname.startsWith('/app/areas') ||
    pathname.startsWith('/app/documentos') ||
    pathname.startsWith('/app/audiencias') ||
    pathname.startsWith('/app/prazos') ||
    pathname.startsWith('/app/tarefas') ||
    pathname.startsWith('/app/horas') ||
    pathname.startsWith('/app/agenda')
  ) {
    return 'Jurídico';
  }
  if (pathname.startsWith('/app/financeiro') || pathname.startsWith('/app/honorarios') || pathname.startsWith('/app/relatorios')) return 'Financeiro';
  if (
    pathname.startsWith('/app/funcionarios') ||
    pathname.startsWith('/app/cargos') ||
    pathname.startsWith('/app/usuarios') ||
    pathname.startsWith('/app/empresas')
  ) {
    return 'Cadastros';
  }
  if (pathname.startsWith('/app/landing') || pathname.startsWith('/app/blog')) return 'Conteúdo';
  return 'Painel';
}

function resolveRoleLabel(roles: string[], isSuperuser: boolean) {
  if (isSuperuser) return 'Superusuário';
  const primaryRole = roles[0] || '';
  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    LAWYER: 'Advogado(a)',
    ASSISTANT: 'Assistente',
    FINANCE: 'Financeiro',
    CLIENT: 'Cliente',
  };
  return roleLabels[primaryRole] || 'Equipe interna';
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, isSuperuser, logout } = useAuth();
  const { tenants } = useTenant();
  const { theme, setTheme } = useTheme();
  const { data: notifications } = useNotifications(undefined, !isSuperuser);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const pageTitle = resolvePageTitle(location.pathname);
  const pageSection = resolvePageSection(location.pathname);
  const userMeta = resolveRoleLabel(roles, isSuperuser);
  const isDark = theme === 'dark';

  function handleLogout() {
    logout();
    navigate('/app/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex min-h-[64px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground lg:hidden"
            onClick={onOpenMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <p className="eyebrow">{pageSection}</p>
            <h1 className="truncate font-display text-[1.35rem] font-semibold leading-none text-foreground sm:text-[1.55rem]">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="hidden min-w-0 items-center justify-end gap-3 lg:flex">
          {tenants.length > 0 ? <TenantSwitcher /> : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 rounded-md border border-border px-0 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 border-border p-0 shadow-elevated" align="end">
              <div className="border-b border-border px-4 py-3">
                <p className="eyebrow mb-0.5">Central interna</p>
                <p className="font-medium text-foreground">Notificações</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={cn('border-b border-border px-4 py-3 text-sm last:border-0', n.read ? 'opacity-55' : '')}
                    >
                      <p className="font-medium text-foreground">{n.title}</p>
                      {n.message ? <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p> : null}
                      <p className="mt-1.5 font-mono-ui text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-1.5 shadow-card transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarFallback className="bg-foreground text-[11px] font-semibold text-background">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 text-left md:block">
                  <p className="truncate text-[13px] font-medium leading-tight text-foreground">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{userMeta}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 shadow-elevated" align="end" sideOffset={8}>
              <DropdownMenuLabel className="pb-1">
                <p className="text-sm font-medium text-foreground">{profile?.full_name || 'Usuário'}</p>
                <p className="text-xs font-normal text-muted-foreground">{profile?.email || ''}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-sm" disabled>
                <User className="h-4 w-4" />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-sm"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Modo claro' : 'Modo escuro'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-sm text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2.5 lg:hidden">
        {tenants.length > 0 ? <TenantSwitcher /> : null}
      </div>
    </header>
  );
}
