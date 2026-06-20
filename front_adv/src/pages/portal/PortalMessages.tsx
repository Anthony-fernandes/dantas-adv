import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { portalService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Message = {
  id: string;
  sender: 'CLIENT' | 'OFFICE';
  sender_name: string;
  content: string;
  created_at: string;
};

function listFrom(payload: any): Message[] {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function PortalMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: async () => await portalService.messages(),
    refetchInterval: 15_000,
  });

  const messages = useMemo(() => listFrom(data), [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => await portalService.sendMessage({ content }),
    onSuccess: () => {
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['portal-messages'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Não foi possível enviar a mensagem',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const sendNow = () => {
    const content = newMsg.trim();
    if (!content) return;
    sendMutation.mutate(content);
  };

  // Group messages by day
  const grouped = useMemo(() => {
    const groups: { day: string; messages: Message[] }[] = [];
    messages.forEach((m) => {
      const day = formatDay(m.created_at);
      const last = groups[groups.length - 1];
      if (last && last.day === day) {
        last.messages.push(m);
      } else {
        groups.push({ day, messages: [m] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Portal do cliente</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Mensagens
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comunique-se diretamente com o escritório.
        </p>
      </div>

      {/* Chat window */}
      <div className="flex flex-col rounded-xl border border-border bg-card shadow-card" style={{ height: 'calc(100vh - 280px)', minHeight: '420px' }}>
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                  <Skeleton className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-56' : 'w-64')} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40">
                <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-foreground">Nenhuma mensagem ainda</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Inicie a conversa com o escritório abaixo.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.day} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {group.day}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {group.messages.map((m) => {
                    const isClient = m.sender === 'CLIENT';
                    return (
                      <div key={m.id} className={cn('flex', isClient ? 'justify-end' : 'justify-start')}>
                        {!isClient && (
                          <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
                            {(m.sender_name || 'O').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className={cn('max-w-[75%] space-y-1')}>
                          {!isClient && (
                            <p className="ml-0.5 text-[10px] font-medium text-muted-foreground">
                              {m.sender_name}
                            </p>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                              isClient
                                ? 'rounded-tr-sm bg-foreground text-background'
                                : 'rounded-tl-sm border border-border bg-muted/60 text-foreground',
                            )}
                          >
                            {m.content}
                          </div>
                          <p className={cn('text-[10px] text-muted-foreground', isClient ? 'text-right' : 'text-left')}>
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Digite sua mensagem... (Enter para enviar)"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              className="min-h-[44px] max-h-32 resize-none border-border bg-background text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendNow();
                }
              }}
            />
            <Button
              size="sm"
              onClick={sendNow}
              disabled={sendMutation.isPending || !newMsg.trim()}
              className="h-11 w-11 shrink-0 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
