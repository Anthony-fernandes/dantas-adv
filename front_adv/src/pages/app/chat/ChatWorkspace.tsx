import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Search, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useChatMessages,
  useCreateChatMessage,
  useProcesses,
} from '@/hooks/useApiData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Msg = {
  id: string;
  process?: string;
  sender: string;
  sender_name?: string;
  sender_email?: string;
  content: string;
  created_at: string;
};

function initials(name?: string | null) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function fmtTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ChatWorkspace() {
  const { profile } = useAuth();
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);
  const [searchProcess, setSearchProcess] = useState('');
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: processes = [] } = useProcesses();
  const { data: messages = [], refetch } = useChatMessages(selectedProcess ?? undefined);
  const sendMsg = useCreateChatMessage();

  const filteredProcesses = (processes as any[]).filter((p) => {
    if (!searchProcess) return true;
    const q = searchProcess.toLowerCase();
    return (p.cnj || '').toLowerCase().includes(q) || (p.subject || '').toLowerCase().includes(q);
  });

  useEffect(() => {
    const timer = setInterval(() => { refetch(); }, 5000);
    return () => clearInterval(timer);
  }, [refetch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMsg.mutateAsync({
      process: selectedProcess || null,
      content: text.trim(),
    });
    setText('');
  }

  const processLabel = (id: string) => {
    const p = (processes as any[]).find((x) => x.id === id);
    if (!p) return `#${id.slice(0, 8)}`;
    return p.cnj || p.subject || `#${id.slice(0, 8)}`;
  };

  return (
    <div className="page-container !pb-0 flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div className="page-header shrink-0">
        <div>
          <p className="eyebrow">Comunicação</p>
          <h1 className="page-title">Chat interno</h1>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden md:flex-row">
        {/* Sidebar: process list */}
        <div className="flex max-h-56 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card md:max-h-none md:w-72">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchProcess}
                onChange={(e) => setSearchProcess(e.target.value)}
                placeholder="Buscar processo..."
                className="pl-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* General channel */}
            <button
              onClick={() => setSelectedProcess(null)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/50',
                selectedProcess === null && 'bg-muted/80',
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">Geral</p>
                <p className="text-xs text-muted-foreground">Escritório</p>
              </div>
            </button>

            {filteredProcesses.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setSelectedProcess(p.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-muted/50 last:border-0',
                  selectedProcess === p.id && 'bg-muted/80',
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono-ui text-[10px] font-semibold text-muted-foreground">
                  {(p.cnj || p.id).slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.cnj || p.subject || `#${p.id.slice(0, 8)}`}
                  </p>
                  {p.subject && <p className="truncate text-xs text-muted-foreground">{p.subject}</p>}
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
          {/* Channel header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {selectedProcess ? processLabel(selectedProcess) : 'Canal geral'}
            </p>
            {selectedProcess && (
              <Badge variant="outline" className="text-[10px]">Processo</Badge>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            {(messages as Msg[]).length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={MessageSquare}
                  title="Nenhuma mensagem"
                  description="Seja o primeiro a enviar uma mensagem neste canal."
                />
              </div>
            ) : (
              <div className="space-y-4">
                {(messages as Msg[]).map((msg) => {
                  const isMe = msg.sender === profile?.id || msg.sender_email === profile?.email;
                  return (
                    <div key={msg.id} className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
                      <Avatar className="h-8 w-8 shrink-0 border border-border">
                        <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
                          {initials(msg.sender_name || msg.sender_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn('max-w-[70%] space-y-1', isMe && 'items-end')}>
                        <div className={cn('flex items-center gap-2', isMe && 'flex-row-reverse')}>
                          <span className="text-[11px] font-medium text-foreground">
                            {isMe ? 'Você' : (msg.sender_name || msg.sender_email || 'Usuário')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{fmtTime(msg.created_at)}</span>
                        </div>
                        <div
                          className={cn(
                            'rounded-lg px-3 py-2 text-sm',
                            isMe
                              ? 'rounded-tr-sm bg-foreground text-background'
                              : 'rounded-tl-sm bg-muted text-foreground',
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3">
            <form onSubmit={handleSend} className="flex gap-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="max-h-32 min-h-[40px] flex-1 resize-none py-2 text-sm"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon" aria-label="Enviar"
                className="h-10 w-10 shrink-0"
                disabled={!text.trim() || sendMsg.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-1.5 text-[10px] text-muted-foreground">Enter para enviar · Shift+Enter para nova linha</p>
          </div>
        </div>
      </div>
    </div>
  );
}
