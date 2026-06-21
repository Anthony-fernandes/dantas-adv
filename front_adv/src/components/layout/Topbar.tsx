import { Bell, LogOut, Moon, Settings, Sun, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function Topbar() {
  const navigate = useNavigate();
  const { profile, isSuperuser, logout } = useAuth();
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
    await Promise.all(
      (notifications ?? []).filter((n) => !n.read).map((n) => updateNotification.mutateAsync({ id: n.id, read: true }))
    );
  }

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
  const localAvatar = useLocalAvatar();

  function handleLogout() {
    logout();
    navigate('/app/login', { replace: true });
  }

  const iconBtnCls = "grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors";

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border px-4">
      {/* Sidebar trigger */}
      <SidebarTrigger className="h-9 w-9 text-muted-foreground hover:bg-muted/50 hover:text-foreground" />

      {/* Tenant switcher */}
      {tenants.length > 0 && (
        <div className="hidden lg:block">
          <TenantSwitcher />
        </div>
      )}

      {/* Search bar — GlobalSearch manages its own dialog state */}
      <div className="hidden md:block">
        <GlobalSearch />
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          type="button"
          className={iconBtnCls}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification bell */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className={cn(iconBtnCls, "relative")}>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 shadow-lg border-border/60" align="end">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground">Notificações</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
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

        {/* Settings */}
        <Link to="/app/configuracoes" className={iconBtnCls} title="Configurações">
          <Settings className="h-4 w-4" />
        </Link>

        {/* Logout */}
        <button
          type="button"
          className={iconBtnCls}
          onClick={handleLogout}
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center rounded-full transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-0.5">
              <Avatar className="h-8 w-8">
                {localAvatar && (
                  <AvatarImage src={localAvatar} alt={profile?.full_name || ''} className="object-cover" />
                )}
                <AvatarFallback className="rounded-full bg-gradient-primary text-[10px] font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 shadow-lg border-border/60" align="end" sideOffset={8}>
            <DropdownMenuLabel className="pb-1">
              <p className="text-[13px] font-medium text-foreground">{profile?.full_name || 'Usuário'}</p>
              <p className="text-[11px] font-normal text-muted-foreground">{profile?.email || ''}</p>
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
