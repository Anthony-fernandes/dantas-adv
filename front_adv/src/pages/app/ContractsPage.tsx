import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { api, apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';

type Client = { id: string; name?: string | null; full_name?: string | null; razao_social?: string | null };
type Contract = {
  id: string;
  client?: string | null;
  client_name?: string | null;
  type: string;
  percent?: string | number | null;
  fixed_value?: string | number | null;
  start_date: string;
  end_date?: string | null;
  status: string;
  clauses?: any[];
  created_at?: string;
};

type ContractForm = {
  client: string;
  type: string;
  percent: string;
  fixed_value: string;
  start_date: string;
  end_date: string;
  status: string;
};

const EMPTY_FORM: ContractForm = {
  client: '',
  type: 'fixo',
  percent: '',
  fixed_value: '',
  start_date: '',
  end_date: '',
  status: 'vigente',
};

const TYPE_OPTIONS = [
  { value: 'fixo', label: 'Honorário fixo' },
  { value: 'percentual', label: 'Percentual sobre causa' },
  { value: 'exito', label: 'Êxito (contingência)' },
  { value: 'hora', label: 'Por hora trabalhada' },
  { value: 'misto', label: 'Misto (fixo + êxito)' },
  { value: 'retainer', label: 'Retainer mensal' },
];

const STATUS_OPTIONS = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'rascunho', label: 'Rascunho' },
];

const STATUS_STYLE: Record<string, string> = {
  vigente: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40',
  encerrado: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400',
  suspenso: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40',
  rascunho: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40',
};

function currency(value?: string | number | null) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n === 0) return null;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso.includes('T') ? iso : `${iso}T00:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((o) => o.value === type)?.label || type;
}

function valueDescription(contract: Contract) {
  if (contract.type === 'percentual' || contract.type === 'exito') {
    const pct = Number(contract.percent ?? 0);
    return pct > 0 ? `${pct}%` : null;
  }
  return currency(contract.fixed_value);
}

function clientLabel(c: Client) {
  return c.name || c.full_name || c.razao_social || c.id;
}

export default function ContractsPage() {
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);

  const contractsQuery = useQuery({
    queryKey: ['contracts', activeTenantId],
    queryFn: async () => apiGetAllPages<Contract>('/contracts/'),
    enabled: !!activeTenantId,
  });

  const clientsQuery = useQuery({
    queryKey: ['clients-mini', activeTenantId],
    queryFn: async () => apiGetAllPages<Client>('/clients/'),
    enabled: !!activeTenantId,
  });

  const contracts = contractsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contracts.filter((c) => {
      const client = clientMap.get(c.client ?? '');
      const name = clientLabel(client ?? ({ id: c.client ?? '' } as Client)).toLowerCase();
      if (q && !name.includes(q) && !typeLabel(c.type).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [contracts, clientMap, search, statusFilter]);

  function openCreate() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, start_date: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  }

  function openEdit(contract: Contract) {
    setEditTarget(contract);
    setForm({
      client: contract.client ?? '',
      type: contract.type,
      percent: String(contract.percent ?? ''),
      fixed_value: String(contract.fixed_value ?? ''),
      start_date: contract.start_date ?? '',
      end_date: contract.end_date ?? '',
      status: contract.status,
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ContractForm>) => {
      const payload: Record<string, any> = {
        client: data.client,
        type: data.type,
        start_date: data.start_date,
        status: data.status,
      };
      if (data.end_date) payload.end_date = data.end_date;
      if (data.percent) payload.percent = data.percent;
      if (data.fixed_value) payload.fixed_value = data.fixed_value;

      if (editTarget) {
        return api.patch(`/contracts/${editTarget.id}/`, payload);
      }
      return api.post('/contracts/', payload);
    },
    onSuccess: () => {
      toast.success(editTarget ? 'Contrato atualizado.' : 'Contrato criado.');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Erro ao salvar contrato.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/contracts/${id}/`),
    onSuccess: () => {
      toast.success('Contrato excluído.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: () => toast.error('Erro ao excluir contrato.'),
  });

  function handleSave() {
    if (!form.client || !form.start_date) {
      toast.error('Cliente e data de início são obrigatórios.');
      return;
    }
    saveMutation.mutate(form);
  }

  const isLoading = contractsQuery.isLoading;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">Jurídico</p>
          <h1 className="page-title">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie contratos de honorários, retainers e acordos com clientes.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo contrato
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} contrato{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[80px] w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title={search || statusFilter !== 'all' ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado'}
          description={
            search || statusFilter !== 'all'
              ? 'Tente ajustar os filtros.'
              : 'Clique em "Novo contrato" para registrar o primeiro contrato de honorários.'
          }
          action={!search && statusFilter === 'all' ? { label: 'Novo contrato', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const client = clientMap.get(c.client ?? '');
            const statusCls = STATUS_STYLE[c.status] ?? 'bg-muted text-muted-foreground border-border';
            const valueStr = valueDescription(c);

            return (
              <div
                key={c.id}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card transition-all hover:border-foreground/20 hover:shadow-elevated"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                  <FileSignature className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {client ? clientLabel(client) : (c.client_name || 'Cliente')}
                    </p>
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', statusCls)}>
                      {STATUS_OPTIONS.find((s) => s.value === c.status)?.label || c.status}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{typeLabel(c.type)}</span>
                    {valueStr && <span className="font-medium text-foreground">{valueStr}</span>}
                    <span>Início: {formatDate(c.start_date)}</span>
                    {c.end_date && <span>Término: {formatDate(c.end_date)}</span>}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(c)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar contrato' : 'Novo contrato'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select
                value={form.client}
                onValueChange={(v) => setForm((f) => ({ ...f, client: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {clientLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de contrato</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.type === 'percentual' || form.type === 'exito') ? (
              <div className="space-y-1.5">
                <Label>Percentual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="20.00"
                  value={form.percent}
                  onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000.00"
                  value={form.fixed_value}
                  onChange={(e) => setForm((f) => ({ ...f, fixed_value: e.target.value }))}
                />
              </div>
            )}

            {form.type === 'misto' && (
              <div className="space-y-1.5">
                <Label>Percentual de êxito (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="10.00"
                  value={form.percent}
                  onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Data de início *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de término</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : editTarget ? 'Salvar alterações' : 'Criar contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contrato será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
