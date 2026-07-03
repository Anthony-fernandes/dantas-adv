import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CalendarClock, CheckCheck, FileText, MessageSquare } from 'lucide-react';

import { api } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type PortalNotification = {
  id: string;
  type?: string;
  title: string;
  message?: string;
  read?: boolean;
  created_at?: string;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  hearing: CalendarClock,
  document: FileText,
  message: MessageSquare,
};

function formatWhen(value?: string) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function PortalNotificationsBell() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['portal-notifications'],
    queryFn: async () => {
      const payload: any = await api.get('/notifications/?page_size=20');
      return (Array.isArray(payload) ? payload : payload?.results ?? []) as PortalNotification[];
    },
    refetchInterval: 60_000,
  });

  const notifications = notificationsQuery.data ?? [];
  const unread = useMemo(() => notifications.filter((n) => !n.read), [notifications]);

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(unread.map((n) => api.patch(`/notifications/${n.id}/`, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-notifications'] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative h-8 w-8 rounded-full">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Notificações</p>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Você será avisado aqui sobre audiências, documentos e mensagens.
            </p>
          ) : (
            notifications.map((notification) => {
              const Icon = TYPE_ICON[notification.type || ''] || Bell;
              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 border-b px-4 py-3 last:border-0 ${notification.read ? 'opacity-60' : 'bg-primary/[0.03]'}`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{notification.title}</p>
                    {notification.message && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">{formatWhen(notification.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
