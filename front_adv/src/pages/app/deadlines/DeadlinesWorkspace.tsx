import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useDeadlines,
  useCreateDeadline,
  useUpdateDeadline,
  useDeleteDeadline,
  useProcesses,
} from '@/hooks/useApiData';
import { cn } from '@/lib/utils';

/* ─── Types ──────────────────────────────────────────────────────────── */

type DeadlineItem = {
  id: string;
  process: string;
  description: string;
  due_date: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'concluido' | 'atrasado';
  responsible?: string | null;
  created_at: string;
};

type ProcessItem = {
  id: string;
  cnj?: string | null;
  subject?: string | null;
  client?: string | null;
};

type DeadlineFormData = {
  process: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
};

/* ─── Helpers ────────────────────────────────────────────────────────── */

function parseDue(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(iso: string): number {
  const d = parseDue(iso);
  if (!d) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

function isOverdue(item: DeadlineItem) {
  if (item.status === 'concluido') return false;
  return daysUntil(item.due_date) < 0;
}

function urgencyLabel(item: DeadlineItem): { label: string; color: string } {
  if (item.status === 'concluido') return { label: 'Concluído', color: 'text-success' };
  const d = daysUntil(item.due_date);
  if (d < 0) return { label: `Vencido há ${Math.abs(d)}d`, color: 'text-destructive' };
  if (d === 0) return { label: 'Vence hoje', color: 'text-destructive' };
  if (d === 1) return { label: 'Vence amanhã', color: 'text-warning' };
  if (d <= 7) return { label: `${d} dias`, color: 'text-warning' };
  return { label: `${d} dias`, color: 'text-muted-foreground' };
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

const PRIORITY_BADGE: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  alta: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgente: 'bg-destructive/10 text-destructive',
};

function formatDate(iso: string) {
  const d = parseDue(iso);
  if (!d) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toInputDate(iso: string) {
  const d = parseDue(iso);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

/* ─── KPI Card ───────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: 'default' | 'danger' | 'warning' | 'success';
  loading?: boolean;
}) {
  const toneClass = {
    default: 'text-foreground',
    danger: 'text-destructive',
    warning: 'text-warning',
    success: 'text-success',
  }[tone];

  return (
    <div className="kpi">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="kpi-label">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-16" />
          ) : (
            <p className={cn('kpi-value mt-2', toneClass)}>{value}</p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

/* ─── Deadline Row ───────────────────────────────────────────────────── */

function DeadlineRow({
  item,
  processMap,
  onEdit,
  onComplete,
  onDelete,
}: {
  item: DeadlineItem;
  processMap: Record<string, ProcessItem>;
  onEdit: (d: DeadlineItem) => void;
  onComplete: (d: DeadlineItem) => void;
  onDelete: (d: DeadlineItem) => void;
}) {
  const proc = processMap[item.process];
  const overdue = isOverdue(item);
  const done = item.status === 'concluido';
  const urg = urgencyLabel(item);

  return (
    <tr
      className={cn(
        'group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/30',
        done && 'opacity-55',
      )}
      onClick={() => onEdit(item)}
    >
      <td className="py-3 pl-4 pr-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onComplete(item); }}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
            done
              ? 'border-success bg-success/20 text-success'
              : overdue
              ? 'border-destructive hover:border-destructive hover:bg-destructive/10'
              : 'border-border hover:border-foreground hover:bg-muted/50',
          )}
          title={done ? 'Marcar como pendente' : 'Marcar como concluído'}
        >
          {done && <Check className="h-3 w-3" />}
        </button>
      </td>
      <td className="py-3 pr-4">
        <p className={cn('text-sm font-medium text-foreground', done && 'line-through')}>{item.description}</p>
        {proc && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {proc.cnj ? `Nº ${proc.cnj}` : proc.subject || '—'}
          </p>
        )}
      </td>
      <td className="hidden py-3 pr-4 sm:table-cell">
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', PRIORITY_BADGE[item.priority] ?? '')}>
          {PRIORITY_LABELS[item.priority] ?? item.priority}
        </span>
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{formatDate(item.due_date)}</span>
          <span className={cn('text-[11px] font-medium', urg.color)}>{urg.label}</span>
        </div>
      </td>
      <td className="py-3 pr-2 text-right">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item); }}
          className="hidden h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground opacity-0 transition-opacity hover:border-border hover:text-destructive group-hover:flex group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

/* ─── Form Dialog ────────────────────────────────────────────────────── */

const EMPTY_FORM: DeadlineFormData = {
  process: '',
  description: '',
  due_date: '',
  priority: 'media',
  status: 'pendente',
};

function DeadlineDialog({
  open,
  onClose,
  editing,
  processes,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  editing: DeadlineItem | null;
  processes: ProcessItem[];
  onSave: (data: DeadlineFormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<DeadlineFormData>(EMPTY_FORM);

  useMemo(() => {
    if (editing) {
      setForm({
        process: editing.process,
        description: editing.description,
        due_date: toInputDate(editing.due_date),
        priority: editing.priority,
        status: editing.status,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editing, open]);

  function set(field: keyof DeadlineFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Descrição obrigatória');
    if (!form.due_date) return toast.error('Data de vencimento obrigatória');
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar prazo' : 'Novo prazo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <Label>Processo</Label>
            <Select value={form.process} onValueChange={(v) => set('process', v)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecionar processo (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {processes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.cnj ? `Nº ${p.cnj}` : p.subject || p.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="desc">Descrição / título do prazo *</Label>
            <Textarea
              id="desc"
              className="mt-1.5 resize-none"
              rows={2}
              placeholder="Ex: Contestação — prazo CPC art. 335"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due">Data de vencimento *</Label>
              <Input
                id="due"
                type="date"
                className="mt-1.5"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar prazo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */

export default function DeadlinesWorkspace() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeadlineItem | null>(null);
  const [deleting, setDeleting] = useState<DeadlineItem | null>(null);

  const queryClient = useQueryClient();

  const { data: rawDeadlines, isLoading: loadingDeadlines } = useDeadlines();
  const { data: rawProcesses, isLoading: loadingProcesses } = useProcesses();
  const createDeadline = useCreateDeadline();
  const updateDeadline = useUpdateDeadline();
  const deleteDeadline = useDeleteDeadline();

  const deadlines: DeadlineItem[] = useMemo(
    () => (Array.isArray(rawDeadlines) ? rawDeadlines : []),
    [rawDeadlines],
  );

  const processes: ProcessItem[] = useMemo(
    () => (Array.isArray(rawProcesses) ? rawProcesses : []),
    [rawProcesses],
  );

  const processMap = useMemo(
    () => Object.fromEntries(processes.map((p) => [p.id, p])),
    [processes],
  );

  /* ─ KPIs ─ */
  const overduePrazos = useMemo(() => deadlines.filter(isOverdue), [deadlines]);
  const todayPrazos = useMemo(
    () => deadlines.filter((d) => d.status !== 'concluido' && daysUntil(d.due_date) === 0),
    [deadlines],
  );
  const week7 = useMemo(
    () => deadlines.filter((d) => { const n = daysUntil(d.due_date); return d.status === 'pendente' && n >= 0 && n <= 7; }),
    [deadlines],
  );
  const done = useMemo(() => deadlines.filter((d) => d.status === 'concluido'), [deadlines]);

  /* ─ Filtering ─ */
  const filtered = useMemo(() => {
    let list = deadlines;
    if (filterStatus === 'overdue') list = list.filter(isOverdue);
    else if (filterStatus !== 'all') list = list.filter((d) => d.status === filterStatus);
    if (filterPriority !== 'all') list = list.filter((d) => d.priority === filterPriority);
    if (filterProcess !== 'all') list = list.filter((d) => d.process === filterProcess);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => {
        const proc = processMap[d.process];
        return (
          d.description.toLowerCase().includes(q) ||
          proc?.cnj?.toLowerCase().includes(q) ||
          proc?.subject?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [deadlines, filterStatus, filterPriority, filterProcess, search, processMap]);

  /* ─ Groups ─ */
  const groups = useMemo(() => {
    const overdue = filtered.filter(isOverdue);
    const today = filtered.filter((d) => !isOverdue(d) && d.status !== 'concluido' && daysUntil(d.due_date) === 0);
    const upcoming = filtered.filter((d) => { const n = daysUntil(d.due_date); return !isOverdue(d) && d.status === 'pendente' && n > 0 && n <= 7; });
    const later = filtered.filter((d) => { const n = daysUntil(d.due_date); return !isOverdue(d) && d.status === 'pendente' && n > 7; });
    const completed = filtered.filter((d) => d.status === 'concluido');
    return { overdue, today, upcoming, later, completed };
  }, [filtered]);

  /* ─ Handlers ─ */
  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(d: DeadlineItem) {
    setEditing(d);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleSave(data: DeadlineFormData) {
    const payload: any = {
      description: data.description,
      due_date: data.due_date ? `${data.due_date}T00:00:00` : undefined,
      priority: data.priority,
      status: data.status,
    };
    if (data.process) payload.process = data.process;

    if (editing) {
      await updateDeadline.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createDeadline.mutateAsync(payload);
    }
    closeDialog();
  }

  async function handleToggleComplete(d: DeadlineItem) {
    const newStatus = d.status === 'concluido' ? 'pendente' : 'concluido';
    await updateDeadline.mutateAsync({ id: d.id, status: newStatus });
    toast.success(newStatus === 'concluido' ? 'Prazo concluído!' : 'Prazo reaberto');
  }

  async function handleDelete(d: DeadlineItem) {
    await deleteDeadline.mutateAsync(d.id);
    setDeleting(null);
    toast.success('Prazo removido');
  }

  const isLoading = loadingDeadlines;
  const isSaving = createDeadline.isPending || updateDeadline.isPending;

  /* ─ Render group ─ */
  function renderGroup(title: string, items: DeadlineItem[], icon: React.ReactNode, emptyMsg?: string) {
    if (items.length === 0 && !emptyMsg) return null;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 pb-1">
          {icon}
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
          <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono-ui text-[10px] text-muted-foreground">
            {items.length}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">{emptyMsg}</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <tbody>
                {items.map((item) => (
                  <DeadlineRow
                    key={item.id}
                    item={item}
                    processMap={processMap}
                    onEdit={openEdit}
                    onComplete={handleToggleComplete}
                    onDelete={setDeleting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterProcess !== 'all' || search.trim() !== '';

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Controle processual</p>
          <h1 className="page-title">Prazos</h1>
          <p className="page-subtitle mt-1">
            Acompanhe todos os prazos do escritório com alertas de vencimento e controle de prioridade.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo prazo
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Vencidos" value={overduePrazos.length} icon={AlertTriangle} tone="danger" loading={isLoading} />
        <KpiCard label="Vencem hoje" value={todayPrazos.length} icon={Timer} tone={todayPrazos.length > 0 ? 'danger' : 'default'} loading={isLoading} />
        <KpiCard label="Próximos 7 dias" value={week7.length} icon={Clock} tone={week7.length > 0 ? 'warning' : 'default'} loading={isLoading} />
        <KpiCard label="Concluídos" value={done.length} icon={CheckCircle2} tone="success" loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1" style={{ minWidth: 180 }}>
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar prazo ou processo…"
            className="h-9 pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProcess} onValueChange={setFilterProcess}>
          <SelectTrigger className="h-9 w-48 text-sm">
            <SelectValue placeholder="Processo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os processos</SelectItem>
            {processes.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.cnj ? `Nº ${p.cnj}` : p.subject || p.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterProcess('all'); }}
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={hasFilters ? 'Nenhum prazo encontrado' : 'Nenhum prazo cadastrado'}
          description={hasFilters ? 'Tente ajustar os filtros para ver mais resultados.' : 'Adicione o primeiro prazo para começar o controle processual.'}
          action={!hasFilters ? { label: 'Novo prazo', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {renderGroup(
            'Vencidos',
            groups.overdue,
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
          )}
          {renderGroup(
            'Vencem hoje',
            groups.today,
            <Timer className="h-3.5 w-3.5 text-destructive" />,
          )}
          {renderGroup(
            'Próximos 7 dias',
            groups.upcoming,
            <Clock className="h-3.5 w-3.5 text-warning" />,
          )}
          {renderGroup(
            'Futuros',
            groups.later,
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />,
          )}
          {renderGroup(
            'Concluídos',
            groups.completed,
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <DeadlineDialog
        open={dialogOpen}
        onClose={closeDialog}
        editing={editing}
        processes={processes}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover prazo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover o prazo{' '}
            <span className="font-medium text-foreground">"{deleting?.description}"</span>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteDeadline.isPending}
              onClick={() => deleting && handleDelete(deleting)}
            >
              {deleteDeadline.isPending ? 'Removendo…' : 'Remover'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
