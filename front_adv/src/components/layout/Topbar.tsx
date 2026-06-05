import { Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { TenantSwitcher } from '@/components/shared/TenantSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useApiData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type TopbarProps = {
  onOpenMenu: () => void;
};

function resolvePageTitle(pathname: string) {
  if (pathname.startsWith('/app/processos')) return 'Processos';
  if (pathname.startsWith('/app/clientes')) return 'Clientes';
  if (pathname.startsWith('/app/areas')) return 'Areas de atuacao';
  if (pathname.startsWith('/app/documentos')) return 'Documentos';
  if (pathname.startsWith('/app/audiencias')) return 'Audiencias';
  if (pathname.startsWith('/app/agenda')) return 'Agenda';
  if (pathname.startsWith('/app/financeiro')) return 'Financeiro';
  if (pathname.startsWith('/app/funcionarios')) return 'Funcionarios';
  if (pathname.startsWith('/app/cargos')) return 'Cargos';
  if (pathname.startsWith('/app/usuarios')) return 'Usuarios';
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
    pathname.startsWith('/app/agenda')
  ) {
    return 'Juridico';
  }

  if (pathname.startsWith('/app/financeiro')) return 'Financeiro';

  if (
    pathname.startsWith('/app/funcionarios') ||
    pathname.startsWith('/app/cargos') ||
    pathname.startsWith('/app/usuarios') ||
    pathname.startsWith('/app/empresas')
  ) {
    return 'Cadastros';
  }

  if (pathname.startsWith('/app/landing') || pathname.startsWith('/app/blog')) return 'Conteudo';
  return 'Painel';
}

function resolveRoleLabel(roles: string[], isSuperuser: boolean) {
  if (isSuperuser) return 'Superusuario';

  const primaryRole = roles[0] || '';
  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietario',
    ADMIN: 'Administrador',
    LAWYER: 'Advogado',
    ASSISTANT: 'Assistente',
    FINANCE: 'Financeiro',
    CLIENT: 'Cliente',
  };

  return roleLabels[primaryRole] || 'Equipe interna';
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const location = useLocation();
  const { profile, roles, isSuperuser } = useAuth();
  const { tenants } = useTenant();
  const { data: notifications } = useNotifications(undefined, !isSuperuser);
  const unreadCount = notifications?.filter((notification) => !notification.read).length || 0;
  const initials = (profile?.full_name || 'Usuario')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
  const pageTitle = resolvePageTitle(location.pathname);
  const pageSection = resolvePageSection(location.pathname);
  const userMeta = resolveRoleLabel(roles, isSuperuser);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground lg:hidden"
            onClick={onOpenMenu}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <p className="eyebrow">{pageSection}</p>
            <h1 className="truncate font-display text-[1.45rem] font-semibold leading-none text-foreground sm:text-[1.7rem]">
              {pageTitle}
            </h1>
          </div>
        </div>

        <div className="hidden min-w-0 items-center justify-end gap-3 lg:flex">
          {tenants.length > 0 ? <TenantSwitcher /> : null}
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-10 rounded-md border border-border px-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 border-border p-0 shadow-elevated" align="end">
              <div className="border-b border-border px-4 py-3">
                <p className="eyebrow mb-1">Central interna</p>
                <p className="font-medium text-foreground">Notificacoes</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`border-b border-border px-4 py-3 text-sm ${notification.read ? 'opacity-60' : ''}`}
                    >
                      <p className="font-medium text-foreground">{notification.title}</p>
                      {notification.message ? <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p> : null}
                      <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificacao</p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-2.5 py-1.5 shadow-card">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-foreground text-xs font-semibold text-background">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || 'Usuario'}</p>
              <p className="truncate text-xs text-muted-foreground">{userMeta}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 lg:hidden">
        {tenants.length > 0 ? <TenantSwitcher /> : null}
      </div>
    </header>
  );
}
