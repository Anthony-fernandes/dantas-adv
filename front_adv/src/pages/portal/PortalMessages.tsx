import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { portalService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

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

export default function PortalMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newMsg, setNewMsg] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['portal-messages'],
    queryFn: async () => await portalService.messages(),
  });
  const messages = useMemo(() => listFrom(data), [data]);

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

  return (
    <div className="page-container animate-fade-in max-w-3xl">
      <h1 className="page-title">Mensagens</h1>
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
            {!isLoading && messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
            ) : null}
            {messages.map(m => (
              <div key={m.id} className={cn('flex', m.sender === 'CLIENT' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-xl p-3 text-sm', m.sender === 'CLIENT' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                  <p className="text-xs font-medium mb-1 opacity-70">{m.sender_name}</p>
                  <p>{m.content}</p>
                  <p className="text-[10px] opacity-50 mt-1 text-right">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled><Paperclip className="h-4 w-4" /></Button>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                className="min-h-[40px] resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendNow();
                  }
                }}
              />
              <Button size="sm" onClick={sendNow} disabled={sendMutation.isPending || !newMsg.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
