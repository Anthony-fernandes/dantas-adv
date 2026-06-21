import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useReceivablesPaged,
  useCreateReceivable,
  useUpdateReceivable,
  useDeleteReceivable,
  useInstallments,
  useUpdateInstallment,
  useProcesses,
  useClients,
} from '@/hooks/useApiData';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

/* ─── Types ──────────────────────────────────────────────────────────── */

type Receivable = {
  id: string;
  client?: string | null;
  process?: string | null;
  description: string;
  category: string;
  amount: string | number;
  due_date: string;
  paid_date?: string | null;
  status: 'aberta' | 'paga' | 'vencida' | 'cancelada';
  total_installments?: number | null;
  installments_count?: number | null;
  installment_interval_days?: number | null;
  notes?: string | null;
  created_at: string;
};

type Installment = {
  id: string;
  receivable: string;
  number: number;
  due_date: string;
  amount: string | number;
  status: 'aberta' | 'paga' | 'vencida' | 'cancelada';
  paid_date?: string | null;
  paid_amount?: string | number | null;
};

type ProcessItem = { id: string; cnj?: string | null; subject?: string | null };
type ClientItem = { id: string; name?: string | null; trade_name?: string | null };

/* ─── Helpers ────────────────────────────────────────────────────────── */

function fmt(v?: string | number | null) {
  const n = Number(v || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(n) ? n : 0);
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

function isOverdueDate(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  return d < new Date();
}

const STATUS_BADGE: Record<string, string> = {
  aberta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  paga: 'bg-success/10 text-success',
  vencida: 'bg-destructive/10 text-destructive',
  cancelada: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  aberta: 'Em aberto',
  paga: 'Pago',
  vencida: 'Vencido',
  cancelada: 'Cancelado',
};

/* ─── Installments Panel ─────────────────────────────────────────────── */

function InstallmentsPanel({
  receivableId,
  onUpdate,
}: {
  receivableId: string;
  onUpdate: () => void;
}) {
  const { data: raw, isLoading } = useInstallments({ receivable: receivableId });
  const updateInstallment = useUpdateInstallment();

  const installments: Installment[] = useMemo(
    () => (Array.isArray(raw) ? raw.sort((a, b) => a.number - b.number) : []),
    [raw],
  );

  async function markPaid(inst: Installment) {
    const today = new Date().toISOString().slice(0, 10);
    await updateInstallment.mutateAsync({ id: inst.id, status: 'paga', paid_date: today, paid_amount: inst.amount });
    toast.success(`Parcela ${inst.number} marcada como paga`);
    onUpdate();
  }

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (!installments.length) return <p className="py-3 text-center text-sm text-muted-foreground">Sem parcelas cadastradas</p>;

  return (
    <div className="divide-y divide-border">
      {installments.map((inst) => {
        const overdue = inst.status === 'aberta' && isOverdueDate(inst.due_date);
        return (
          <div key={inst.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inst.status !== 'paga' && markPaid(inst)}
                disabled={inst.status === 'paga' || updateInstallment.isPending}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  inst.status === 'paga'
                    ? 'border-success bg-success/20 text-success'
                    : overdue
                    ? 'border-destructive hover:bg-destructive/10'
                    : 'border-border hover:border-foreground',
                )}
              >
                {inst.status === 'paga' && <Check className="h-3 w-3" />}
              </button>
              <div>
                <p className="text-sm text-foreground">
                  Parcela {inst.number} · {fmt(inst.amount)}
                </p>
                <p className={cn('text-xs', overdue && inst.status !== 'paga' ? 'text-destructive' : 'text-muted-foreground')}>
                  Vence {fmtDate(inst.due_date)}
                  {inst.status === 'paga' && inst.paid_date ? ` · Pago em ${fmtDate(inst.paid_date)}` : ''}
                </p>
              </div>
            </div>
            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_BADGE[inst.status] ?? '')}>
              {STATUS_LABEL[inst.status] ?? inst.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Honorário Row ──────────────────────────────────────────────────── */

function HonorarioRow({
  item,
  clientMap,
  processMap,
  onEdit,
  onDelete,
}: {
  item: Receivable;
  clientMap: Record<string, ClientItem>;
  processMap: Record<string, ProcessItem>;
  onEdit: (r: Receivable) => void;
  onDelete: (r: Receivable) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const client = item.client ? clientMap[item.client] : null;
  const process = item.process ? processMap[item.process] : null;
  const overdue = item.status === 'aberta' && isOverdueDate(item.due_date);

  return (
    <>
      <tr className={cn('border-b border-border transition-colors hover:bg-muted/30', item.status === 'cancelada' && 'opacity-50')}>
        <td className="py-3 pl-4 pr-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </td>
        <td className="py-3 pr-4">
          <p className="text-sm font-medium text-foreground">{item.description}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {client ? (client.trade_name || client.name || '—') : '—'}
            {process ? ` · Nº ${process.cnj || process.subject || ''}` : ''}
          </p>
        </td>
        <td className="py-3 pr-4 text-sm font-medium tabular-nums text-foreground">{fmt(item.amount)}</td>
        <td className="hidden py-3 pr-4 sm:table-cell">
          <div className="flex flex-col">
            <span className={cn('text-sm', overdue ? 'text-destructive' : 'text-foreground')}>{fmtDate(item.due_date)}</span>
            {item.total_installments && item.total_installments > 1 ? (
              <span className="text-xs text-muted-foreground">{item.total_installments}x</span>
            ) : null}
          </div>
        </td>
        <td className="py-3 pr-4">
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_BADGE[item.status] ?? '')}>
            {STATUS_LABEL[item.status] ?? item.status}
          </span>
        </td>
        <td className="py-3 pr-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-border hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="border-b border-border bg-muted/20 px-8 py-3">
            <InstallmentsPanel receivableId={item.id} onUpdate={() => {}} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Form Dialog ────────────────────────────────────────────────────── */

type FormData = {
  description: string;
  client: string;
  process: string;
  amount: string;
  due_date: string;
  status: string;
  total_installments: string;
  installment_interval_days: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  description: '',
  client: '',
  process: '',
  amount: '',
  due_date: '',
  status: 'aberta',
  total_installments: '1',
  installment_interval_days: '30',
  notes: '',
};

function HonorarioDialog({
  open,
  onClose,
  editing,
  processes,
  clients,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  editing: Receivable | null;
  processes: ProcessItem[];
  clients: ClientItem[];
  onSave: (data: FormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  useMemo(() => {
    if (editing) {
      setForm({
        description: editing.description,
        client: editing.client || '',
        process: editing.process || '',
        amount: String(editing.amount || ''),
        due_date: editing.due_date ? editing.due_date.slice(0, 10) : '',
        status: editing.status,
        total_installments: String(editing.total_installments || '1'),
        installment_interval_days: String(editing.installment_interval_days || '30'),
        notes: editing.notes || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing, open]);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Descrição obrigatória');
    if (!form.amount || isNaN(Number(form.amount))) return toast.error('Valor inválido');
    if (!form.due_date) return toast.error('Data de vencimento obrigatória');
    onSave(form);
  }

  const installments = Number(form.total_installments) || 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar honorário' : 'Novo contrato de honorários'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label htmlFor="desc">Descrição *</Label>
            <Textarea
              id="desc"
              className="mt-1.5 resize-none"
              rows={2}
              placeholder="Ex: Honorários advocatícios — ação trabalhista"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cliente</Label>
              <Select value={form.client} onValueChange={(v) => set('client', v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.trade_name || c.name || c.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Processo</Label>
              <Select value={form.process} onValueChange={(v) => set('process', v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {processes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.cnj ? `Nº ${p.cnj}` : p.subject || p.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor total (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                className="mt-1.5"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="due">1ª data de vencimento *</Label>
              <Input
                id="due"
                type="date"
                className="mt-1.5"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parcelas">Número de parcelas</Label>
              <Input
                id="parcelas"
                type="number"
                min="1"
                max="120"
                className="mt-1.5"
                value={form.total_installments}
                onChange={(e) => set('total_installments', e.target.value)}
              />
              {installments > 1 && form.amount && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {installments}x de {fmt(Number(form.amount) / installments)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="interval">Intervalo entre parcelas (dias)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                className="mt-1.5"
                value={form.installment_interval_days}
                onChange={(e) => set('installment_interval_days', e.target.value)}
              />
            </div>
          </div>

          {editing && (
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberta">Em aberto</SelectItem>
                  <SelectItem value="paga">Pago</SelectItem>
                  <SelectItem value="vencida">Vencido</SelectItem>
                  <SelectItem value="cancelada">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              className="mt-1.5 resize-none"
              rows={2}
              placeholder="Cláusulas especiais, acordos, etc."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando…' : editing ? 'Salvar' : 'Criar honorário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */

export default function HonorariosWorkspace() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Receivable | null>(null);
  const [deleting, setDeleting] = useState<Receivable | null>(null);

  const { data: paginated, isLoading } = useReceivablesPaged(
    { category: 'honorarios', ...(filterStatus !== 'all' ? { status: filterStatus } : {}) },
    search || undefined,
    page,
  );

  const { data: rawAll } = useReceivablesPaged({ category: 'honorarios' }, undefined, 1);
  const { data: rawProcesses } = useProcesses();
  const { data: rawClients } = useClients();
  const createReceivable = useCreateReceivable();
  const updateReceivable = useUpdateReceivable();
  const deleteReceivable = useDeleteReceivable();
  const updateInstallment = useUpdateInstallment();

  const honorarios: Receivable[] = useMemo(
    () => paginated?.results ?? [],
    [paginated],
  );

  const allHonorarios: Receivable[] = useMemo(
    () => rawAll?.results ?? [],
    [rawAll],
  );

  const processes: ProcessItem[] = useMemo(
    () => (Array.isArray(rawProcesses) ? rawProcesses : []),
    [rawProcesses],
  );

  const clients: ClientItem[] = useMemo(
    () => (Array.isArray(rawClients) ? rawClients : []),
    [rawClients],
  );

  const processMap = useMemo(
    () => Object.fromEntries(processes.map((p) => [p.id, p])),
    [processes],
  );

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients],
  );

  /* ─ KPIs ─ */
  const totalContratado = useMemo(
    () => allHonorarios.filter((r) => r.status !== 'cancelada').reduce((s, r) => s + Number(r.amount || 0), 0),
    [allHonorarios],
  );
  const totalRecebido = useMemo(
    () => allHonorarios.filter((r) => r.status === 'paga').reduce((s, r) => s + Number(r.amount || 0), 0),
    [allHonorarios],
  );
  const totalAberto = useMemo(
    () => allHonorarios.filter((r) => r.status === 'aberta').reduce((s, r) => s + Number(r.amount || 0), 0),
    [allHonorarios],
  );
  const totalVencido = useMemo(
    () => allHonorarios.filter((r) => r.status === 'aberta' && isOverdueDate(r.due_date)).reduce((s, r) => s + Number(r.amount || 0), 0),
    [allHonorarios],
  );

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(r: Receivable) {
    setEditing(r);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleSave(data: FormData) {
    const payload: any = {
      description: data.description,
      amount: Number(data.amount),
      due_date: data.due_date,
      status: data.status,
      category: 'honorarios',
      total_installments: Number(data.total_installments) || 1,
      installment_interval_days: Number(data.installment_interval_days) || 30,
      notes: data.notes || null,
    };
    if (data.client && data.client !== '_none') payload.client = data.client;
    if (data.process && data.process !== '_none') payload.process = data.process;

    if (editing) {
      await updateReceivable.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createReceivable.mutateAsync(payload);
    }
    closeDialog();
  }

  async function handleDelete(r: Receivable) {
    await deleteReceivable.mutateAsync(r.id);
    setDeleting(null);
  }

  const isSaving = createReceivable.isPending || updateReceivable.isPending;
  const totalPages = paginated ? Math.ceil((paginated.count ?? 0) / 25) : 1;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Gestão financeira</p>
          <h1 className="page-title">Honorários</h1>
          <p className="page-subtitle mt-1">
            Controle contratos, parcelamentos e recebimentos de honorários advocatícios.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo honorário
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total contratado" value={fmt(totalContratado)} icon={Wallet} color="indigo" />
        <StatCard label="Recebido" value={fmt(totalRecebido)} icon={CheckCircle2} color="emerald" />
        <StatCard label="A receber" value={fmt(totalAberto)} icon={DollarSign} color="sky" />
        <StatCard label="Vencidos" value={fmt(totalVencido)} icon={AlertTriangle} color={totalVencido > 0 ? 'rose' : 'slate'} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1" style={{ minWidth: 180 }}>
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar honorário, cliente ou processo…"
            className="h-9 pl-9 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aberta">Em aberto</SelectItem>
            <SelectItem value="paga">Pago</SelectItem>
            <SelectItem value="vencida">Vencido</SelectItem>
            <SelectItem value="cancelada">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : honorarios.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Nenhum honorário cadastrado"
          description="Cadastre o primeiro contrato de honorários para começar o controle financeiro."
          action={{ label: 'Novo honorário', onClick: openCreate }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="min-w-[800px] w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="w-10 py-3 pl-4" />
                <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</th>
                <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Valor</th>
                <th className="hidden py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">Vencimento</th>
                <th className="py-3 pr-4 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="py-3 pr-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {honorarios.map((r) => (
                <HonorarioRow
                  key={r.id}
                  item={r}
                  clientMap={clientMap}
                  processMap={processMap}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <HonorarioDialog
        open={dialogOpen}
        onClose={closeDialog}
        editing={editing}
        processes={processes}
        clients={clients}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover honorário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover o honorário{' '}
            <span className="font-medium text-foreground">"{deleting?.description}"</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={deleteReceivable.isPending} onClick={() => deleting && handleDelete(deleting)}>
              {deleteReceivable.isPending ? 'Removendo…' : 'Remover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
