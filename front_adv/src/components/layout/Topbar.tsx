import { Bell, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { TenantSwitcher } from '@/components/shared/TenantSwitcher';
import { GlobalSearch } from '@/components/shared/GlobalSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalAvatar } from '@/hooks/useLocalAvatar';
import { useNotifications, useUpdateNotification } from '@/hooks/useApiData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TopbarProps = { onOpenMenu: () => void };

function resolvePageTitle(pathname: string) {
  if (pathname.startsWith('/app/processos')) return 'Processos';
  if (pathname.startsWith('/app/clientes')) return 'Clientes';
  if (pathname.startsWith('/app/areas')) return 'Áreas de atuação';
  if (pathname.startsWith('/app/documentos')) return 'Documentos';
  if (pathname.startsWith('/app/audiencias')) return 'Audiências';
  if (pathname.startsWith('/app/prazos')) return 'Prazos';
  if (pathname.startsWith('/app/tarefas')) return 'Tarefas';
  if (pathname.startsWith('/app/horas')) return 'Controle de Horas';
  if (pathname.startsWith('/app/chat')) return 'Chat Interno';
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
  if (pathname.startsWith('/app/auditoria')) return 'Log de Auditoria';
  if (pathname.startsWith('/app/contratos')) return 'Contratos';
  if (pathname.startsWith('/app/modelos')) return 'Modelos';
  if (pathname.startsWith('/app/perfil')) return 'Meu perfil';
  if (pathname.startsWith('/app/configuracoes')) return 'Configurações';
  return 'Painel';
}

function resolveRoleLabel(roles: string[], isSuperuser: boolean) {
  if (isSuperuser) return 'Superusuário';
  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário', ADMIN: 'Administrador', LAWYER: 'Advogado(a)',
    ASSISTANT: 'Assistente', FINANCE: 'Financeiro', CLIENT: 'Cliente',
  };
  return roleLabels[roles[0] || ''] || 'Equipe interna';
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, isSuperuser, logout } = useAuth();
  const { tenants } = useTenant();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const { data: notifications } = useNotifications(undefined, !isSuperuser);
  const updateNotification = useUpdateNotification();
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  async function markRead(id: string) {
    await updateNotification.mutateAsync({ id, read: true });
  }
  async function markAllRead() {
    await Promise.all((notifications ?? []).filter((n) => !n.read).map((n) => updateNotification.mutateAsync({ id: n.id, read: true })));
  }

  const initials = (profile?.full_name || 'U').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  const localAvatar = useLocalAvatar();
  const pageTitle = resolvePageTitle(location.pathname);
  const userMeta = resolveRoleLabel(roles, isSuperuser);

  function handleLogout() {
    logout();
    navigate('/app/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center border-b border-slate-200/60 dark:border-border bg-white dark:bg-card px-4 gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Hamburger (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        onClick={onOpenMenu}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search — center */}
      <div className="hidden flex-1 justify-center lg:flex">
        <GlobalSearch />
      </div>

      {/* Mobile: title */}
      <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground lg:hidden">
        {pageTitle}
      </h1>

      {/* Right group */}
      <div className="flex shrink-0 items-center gap-1">
        {tenants.length > 0 && (
          <div className="hidden lg:block mr-1">
            <TenantSwitcher />
          </div>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-muted-foreground/60 dark:hover:bg-muted dark:hover:text-foreground"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-muted-foreground/60 dark:hover:bg-muted dark:hover:text-foreground"
          onClick={() => navigate('/app/configuracoes')}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Notification bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-muted-foreground/60 dark:hover:bg-muted dark:hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 shadow-lg border-border/60" align="end">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground">Notificações</p>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                  Marcar todas lidas
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => !n.read && markRead(n.id)}
                    className={cn(
                      'block w-full border-b border-border/40 px-4 py-3 text-left last:border-0 transition-colors',
                      n.read ? 'opacity-50' : 'hover:bg-muted/40 cursor-pointer',
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      <div className={cn('min-w-0', n.read && 'ml-3.5')}>
                        <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-[12px] text-muted-foreground">{n.message}</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {new Date(n.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
                  <p className="text-[13px] text-muted-foreground">Nenhuma notificação</p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-muted-foreground/60 dark:hover:bg-muted dark:hover:text-foreground"
          onClick={handleLogout}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-0.5">
              <Avatar className="h-8 w-8">
                {localAvatar && <AvatarImage src={localAvatar} alt={profile?.full_name || ''} className="object-cover" />}
                <AvatarFallback className="bg-primary text-[10px] font-semibold text-white">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 shadow-lg border-border/60" align="end" sideOffset={8}>
            <DropdownMenuLabel className="pb-1">
              <p className="text-[13px] font-medium text-foreground">{profile?.full_name || 'Usuário'}</p>
              <p className="text-[11px] font-normal text-muted-foreground">{profile?.email || ''}</p>
              <p className="text-[10px] font-normal text-muted-foreground/70">{userMeta}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-[13px]" onClick={() => navigate('/app/perfil')}>
              <User className="h-3.5 w-3.5" />Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-[13px] text-destructive focus:text-destructive" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
