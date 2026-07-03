import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Landmark, Plug, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { api, apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type TribunalSyncRecord = {
  id: string;
  process: string;
  provider: string;
  external_process_number: string;
  last_synced_at?: string | null;
  sync_status: string;
  error_message?: string | null;
  created_at?: string;
};

type ProcessLookup = { id: string; cnj?: string | null; subject?: string | null };

const PROVIDER_LABELS: Record<string, string> = {
  esaj: 'e-SAJ',
  pje: 'PJe',
  eproc: 'eproc',
  projudi: 'Projudi',
  datajud: 'Datajud',
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  ok: { label: 'Sincronizado', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  success: { label: 'Sincronizado', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  running: { label: 'Executando', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  pending: { label: 'Pendente', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  error: { label: 'Erro', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Nunca';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Nunca';
  return parsed.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function IntegrationsPage() {
  const { activeTenantId } = useTenant();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  const syncsQuery = useQuery({
    queryKey: ['tribunal-syncs-admin', activeTenantId],
    queryFn: () => apiGetAllPages<TribunalSyncRecord>('/tribunal-syncs/'),
    enabled: !!activeTenantId,
  });

  const processesQuery = useQuery({
    queryKey: ['tribunal-syncs-processes', activeTenantId],
    queryFn: () => apiGetAllPages<ProcessLookup>('/processes/'),
    enabled: !!activeTenantId,
  });

  const processMap = useMemo(() => {
    const data = processesQuery.data as any;
    const list: ProcessLookup[] = !data ? [] : Array.isArray(data) ? data : data.results ?? [];
    return new Map(list.map((p) => [p.id, p]));
  }, [processesQuery.data]);

  const syncs = useMemo(() => {
    const data = syncsQuery.data as any;
    const list: TribunalSyncRecord[] = !data ? [] : Array.isArray(data) ? data : data.results ?? [];
    return list.filter((sync) => {
      if (statusFilter !== 'all' && sync.sync_status !== statusFilter) return false;
      if (providerFilter !== 'all' && sync.provider !== providerFilter) return false;
      if (search.trim()) {
        const process = processMap.get(sync.process);
        const haystack = [sync.external_process_number, process?.cnj, process?.subject].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [syncsQuery.data, statusFilter, providerFilter, search, processMap]);

  const stats = useMemo(() => {
    const data = syncsQuery.data as any;
    const all: TribunalSyncRecord[] = !data ? [] : Array.isArray(data) ? data : data.results ?? [];
    return {
      total: all.length,
      ok: all.filter((s) => ['ok', 'success'].includes(s.sync_status)).length,
      pending: all.filter((s) => ['pending', 'running'].includes(s.sync_status)).length,
      error: all.filter((s) => s.sync_status === 'error').length,
    };
  }, [syncsQuery.data]);

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tribunal-syncs/${id}/sincronizar/`),
    onSuccess: () => {
      toast.success('Sincronização executada. Movimentos importados para o processo.');
      queryClient.invalidateQueries({ queryKey: ['tribunal-syncs-admin', activeTenantId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Falha ao sincronizar com o tribunal.');
      queryClient.invalidateQueries({ queryKey: ['tribunal-syncs-admin', activeTenantId] });
    },
  });

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="page-title">Integrações de tribunal</h1>
          <p className="page-subtitle mt-1">
            Central de sincronizações com PJe, e-SAJ e Datajud: status, erros e reexecução em um só lugar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vínculos cadastrados" value={stats.total} icon={Plug} color="indigo" />
        <StatCard label="Sincronizados" value={stats.ok} icon={CheckCircle2} color="emerald" />
        <StatCard label="Pendentes" value={stats.pending} icon={Clock} color="amber" />
        <StatCard label="Com erro" value={stats.error} icon={AlertTriangle} color={stats.error > 0 ? 'rose' : 'slate'} />
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número do processo ou assunto" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ok">Sincronizado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="running">Executando</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger><SelectValue placeholder="Provedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os provedores</SelectItem>
            <SelectItem value="pje">PJe</SelectItem>
            <SelectItem value="esaj">e-SAJ</SelectItem>
            <SelectItem value="datajud">Datajud</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {syncsQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : syncs.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={Landmark}
              title="Nenhuma sincronização cadastrada"
              description="Vincule um processo a um tribunal pela aba 'Tribunal' no detalhe do processo para começar a importar andamentos."
              action={{ label: 'Ir para processos', onClick: () => navigate('/app/processos') }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead className="w-[110px]">Provedor</TableHead>
                <TableHead className="w-[190px]">Número no tribunal</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[170px]">Última sincronização</TableHead>
                <TableHead>Erro</TableHead>
                <TableHead className="w-[130px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncs.map((sync) => {
                const process = processMap.get(sync.process);
                const meta = STATUS_META[sync.sync_status] || STATUS_META.pending;
                return (
                  <TableRow key={sync.id} className="cursor-pointer" onClick={() => navigate(`/app/processos/${sync.process}?tab=tribunal`)}>
                    <TableCell>
                      <p className="font-medium">{process?.cnj || process?.subject || sync.process.slice(0, 8)}</p>
                      {process?.subject && process?.cnj ? <p className="text-xs text-muted-foreground">{process.subject}</p> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{PROVIDER_LABELS[sync.provider] || sync.provider}</Badge>
                    </TableCell>
                    <TableCell className="font-mono-ui text-xs">{sync.external_process_number}</TableCell>
                    <TableCell>
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', meta.className)}>{meta.label}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(sync.last_synced_at)}</TableCell>
                    <TableCell className="max-w-[240px]">
                      {sync.error_message ? <p className="truncate text-xs text-rose-600" title={sync.error_message}>{sync.error_message}</p> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={retryMutation.isPending || sync.sync_status === 'running'}
                        onClick={() => retryMutation.mutate(sync.id)}
                      >
                        <RefreshCw className={cn('h-3.5 w-3.5', retryMutation.isPending && 'animate-spin')} />
                        Sincronizar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como ativar a captura automática</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Datajud (CNJ)</strong> — já ativo: o botão "Buscar no Datajud" do cadastro de processo
            consulta a API pública do CNJ e preenche tribunal, classe e assunto automaticamente.
          </p>
          <p>
            <strong className="text-foreground">2. e-SAJ</strong> — a sincronização manual desta tela já consulta o e-SAJ (TJSP).
            Para outros TJs, informe a URL base em Configurações do escritório.
          </p>
          <p>
            <strong className="text-foreground">3. PJe</strong> — requer a URL do tribunal (chave <code className="rounded bg-muted px-1">pje_tribunal_url</code>{' '}
            nas configurações do escritório). Tribunais com autenticação exigem certificado digital A1 — armazene-o com seu provedor de infraestrutura
            e configure as credenciais no servidor.
          </p>
          <p>
            <strong className="text-foreground">4. Agendamento</strong> — para sincronizar automaticamente todos os vínculos, agende o comando
            <code className="ml-1 rounded bg-muted px-1">python manage.py sync_tribunals</code> (cron/Task Scheduler) no servidor — ele reexecuta
            cada vínculo pendente ou com erro e registra o resultado nesta tela.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
