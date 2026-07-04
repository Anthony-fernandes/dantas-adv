import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

type TribunalSync = {
  id: string;
  process: string;
  provider: string;
  numero_tribunal: string;
  last_synced_at: string | null;
  sync_status: string;
  error_message: string | null;
  new_movimentacoes?: number;
};

const PROVIDER_OPTIONS = [
  { value: 'esaj', label: 'e-SAJ (SP)' },
  { value: 'pje', label: 'PJe' },
  { value: 'projudi', label: 'Projudi' },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  idle: { label: 'Aguardando', className: 'bg-muted text-muted-foreground border-border' },
  syncing: { label: 'Sincronizando', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  success: { label: 'Sincronizado', className: 'bg-green-100 text-green-800 border-green-200' },
  error: { label: 'Erro', className: 'bg-red-100 text-red-700 border-red-200' },
};

type Props = {
  processId: string;
  processCnj?: string;
};

export function TribunalSyncPanel({ processId, processCnj }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [provider, setProvider] = useState('esaj');
  const [numeroTribunal, setNumeroTribunal] = useState(processCnj ?? '');
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const syncsQuery = useQuery({
    queryKey: ['tribunal-syncs', processId],
    queryFn: () => api.get<{ results: TribunalSync[] }>(`/tribunal-syncs/`, { process: processId })
      .then((r) => (Array.isArray(r) ? r : r.results ?? [])),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/tribunal-syncs/', { process: processId, provider, numero_tribunal: numeroTribunal }),
    onSuccess: () => {
      toast({ title: 'Sincronização configurada com sucesso!' });
      qc.invalidateQueries({ queryKey: ['tribunal-syncs', processId] });
      setDialogOpen(false);
    },
    onError: (e: any) => {
      toast({ title: e?.message || 'Erro ao configurar sincronização', variant: 'destructive' });
    },
  });

  async function handleSync(id: string) {
    setSyncingId(id);
    try {
      const res: any = await api.post(`/tribunal-syncs/${id}/sincronizar/`);
      const count = res?.new_movimentacoes ?? res?.movimentacoes_importadas ?? 0;
      toast({ title: `Sincronização concluída — ${count} novas movimentações importadas.` });
      qc.invalidateQueries({ queryKey: ['tribunal-syncs', processId] });
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao sincronizar', variant: 'destructive' });
    } finally {
      setSyncingId(null);
    }
  }

  const syncs: TribunalSync[] = syncsQuery.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Sincronização com tribunais</p>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Configurar
        </Button>
      </div>

      {syncsQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando...
        </div>
      )}

      {!syncsQuery.isLoading && syncs.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma sincronização configurada.</p>
      )}

      {syncs.map((sync) => {
        const st = STATUS_MAP[sync.sync_status] ?? { label: sync.sync_status, className: 'bg-muted text-muted-foreground border-border' };
        const isSyncing = syncingId === sync.id;
        return (
          <div key={sync.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{PROVIDER_OPTIONS.find((p) => p.value === sync.provider)?.label ?? sync.provider}</p>
                <p className="text-xs text-muted-foreground font-mono">{sync.numero_tribunal}</p>
              </div>
              <Badge variant="outline" className={st.className}>{st.label}</Badge>
            </div>
            {sync.last_synced_at && (
              <p className="text-xs text-muted-foreground">
                Última sync: {new Date(sync.last_synced_at).toLocaleString('pt-BR')}
              </p>
            )}
            {sync.error_message && (
              <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {sync.error_message}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={() => handleSync(sync.id)}
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
            </Button>
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar sincronização</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Provedor</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Número no tribunal (CNJ)</Label>
              <Input
                value={numeroTribunal}
                onChange={(e) => setNumeroTribunal(e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              As credenciais de acesso são opcionais para consultas públicas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !numeroTribunal.trim()}
              className="gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
