import { useRef, useState } from 'react';
import { Clock, Plus, Search, Pencil, Trash2, Timer } from 'lucide-react';
import { VirtualTableBody } from '@/components/shared/VirtualTableBody';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useTimeEntries,
  useTimeEntriesPaged,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useProcesses,
} from '@/hooks/useApiData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------- types ----------

type TimeEntry = {
  id: string;
  process?: string;
  process_label?: string;
  user: string;
  user_email?: string;
  description?: string;
  activity_type: string;
  date: string;
  hours: string | number;
  billable: boolean;
  hourly_rate?: string | number;
  created_at: string;
};

type FormState = {
  process: string;
  description: string;
  activity_type: string;
  date: string;
  hours: string;
  billable: boolean;
  hourly_rate: string;
};

const EMPTY_FORM: FormState = {
  process: '',
  description: '',
  activity_type: 'outros',
  date: new Date().toISOString().split('T')[0],
  hours: '',
  billable: true,
  hourly_rate: '',
};

const ACTIVITY_LABELS: Record<string, string> = {
  diligencia: 'Diligência',
  pesquisa: 'Pesquisa',
  reuniao: 'Reunião',
  audiencia: 'Audiência',
  peticao: 'Petição',
  consulta: 'Consulta',
  outros: 'Outros',
};

function fmtHours(h: string | number) {
  const n = Number(h);
  if (!Number.isFinite(n)) return '—';
  const hrs = Math.floor(n);
  const mins = Math.round((n - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

function fmtDate(d: string) {
  return new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR');
}

function fmtCurrency(v?: string | number | null) {
  const n = Number(v || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(n) ? n : 0,
  );
}

// ---------- Dialog ----------

type EntryDialogProps = {
  open: boolean;
  onClose: () => void;
  entry?: TimeEntry;
  processes: any[];
};

function EntryDialog({ open, onClose, entry, processes }: EntryDialogProps) {
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();

  const [form, setForm] = useState<FormState>(
    entry
      ? {
          process: entry.process ?? '',
          description: entry.description ?? '',
          activity_type: entry.activity_type,
          date: entry.date,
          hours: String(entry.hours),
          billable: entry.billable,
          hourly_rate: entry.hourly_rate ? String(entry.hourly_rate) : '',
        }
      : EMPTY_FORM,
  );

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hours || Number(form.hours) <= 0) {
      toast.error('Informe um número de horas válido');
      return;
    }
    const payload: any = {
      process: form.process || null,
      description: form.description || null,
      activity_type: form.activity_type,
      date: form.date,
      hours: Number(form.hours),
      billable: form.billable,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
    };
    try {
      if (entry) {
        await updateEntry.mutateAsync({ id: entry.id, ...payload });
      } else {
        await createEntry.mutateAsync(payload);
      }
      onClose();
    } catch {
      // toast shown by mutation
    }
  }

  const isPending = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? 'Editar lançamento' : 'Lançar horas'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="te-date">Data *</Label>
              <Input
                id="te-date"
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="te-hours">Horas *</Label>
              <Input
                id="te-hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={form.hours}
                onChange={(e) => set('hours', e.target.value)}
                placeholder="Ex: 1.5"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de atividade</Label>
            <Select value={form.activity_type} onValueChange={(v) => set('activity_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Processo vinculado</Label>
            <Select value={form.process || 'none'} onValueChange={(v) => set('process', v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {processes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.cnj || p.subject || `#${p.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="te-desc">Descrição</Label>
            <Textarea
              id="te-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Descreva a atividade realizada..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="te-billable"
                checked={form.billable}
                onCheckedChange={(v) => set('billable', v)}
              />
              <Label htmlFor="te-billable" className="cursor-pointer">
                Cobrável
              </Label>
            </div>

            {form.billable && (
              <div className="flex flex-1 items-center gap-2">
                <Label htmlFor="te-rate" className="shrink-0 text-sm text-muted-foreground">
                  Taxa/h (R$)
                </Label>
                <Input
                  id="te-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.hourly_rate}
                  onChange={(e) => set('hourly_rate', e.target.value)}
                  placeholder="0,00"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : entry ? 'Salvar' : 'Lançar horas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main workspace ----------

export default function TimesheetWorkspace() {
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [billableFilter, setBillableFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<TimeEntry | null>(null);

  const filters: Record<string, any> = {};
  if (activityFilter !== 'all') filters.activity_type = activityFilter;
  if (billableFilter !== 'all') filters.billable = billableFilter === 'yes';

  const { data: paged, isLoading } = useTimeEntriesPaged(
    filters,
    search || undefined,
    page,
    { column: 'date', ascending: false },
  );

  const { data: allEntries } = useTimeEntries();
  const { data: processes = [] } = useProcesses();

  const deleteMut = useDeleteTimeEntry();

  const entries = paged?.results ?? [];
  const totalCount = paged?.count ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const all = allEntries ?? [];
  const totalHours = all.reduce((acc, e) => acc + Number(e.hours ?? 0), 0);
  const billableHours = all.filter((e) => e.billable).reduce((acc, e) => acc + Number(e.hours ?? 0), 0);
  const totalBillable = all
    .filter((e) => e.billable && e.hourly_rate)
    .reduce((acc, e) => acc + Number(e.hours ?? 0) * Number(e.hourly_rate ?? 0), 0);
  const thisMonthHours = all
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((acc, e) => acc + Number(e.hours ?? 0), 0);

  async function handleDelete() {
    if (!deleteEntry) return;
    await deleteMut.mutateAsync(deleteEntry.id);
    setDeleteEntry(null);
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">Jurídico</p>
          <h1 className="page-title">Controle de Horas</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Lançar horas
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="kpi">
          <p className="kpi-label">Total de horas</p>
          <p className="kpi-value">{fmtHours(totalHours)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Horas cobráveis</p>
          <p className="kpi-value">{fmtHours(billableHours)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Valor cobrável</p>
          <p className="kpi-value text-lg">{fmtCurrency(totalBillable)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Horas este mês</p>
          <p className="kpi-value">{fmtHours(thisMonthHours)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar lançamentos..."
            className="pl-9"
          />
        </div>

        <Select value={activityFilter} onValueChange={(v) => { setActivityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Atividade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas atividades</SelectItem>
            {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={billableFilter} onValueChange={(v) => { setBillableFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Cobrável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Cobráveis</SelectItem>
            <SelectItem value="no">Não cobráveis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="table-editorial min-w-[700px] w-full">
          <thead>
            <tr>
              <th>Data</th>
              <th>Atividade</th>
              <th>Processo</th>
              <th>Descrição</th>
              <th className="text-right">Horas</th>
              <th className="text-right">Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Timer}
                    title="Nenhum lançamento"
                    description="Registre as horas trabalhadas em cada processo."
                    action={{ label: 'Lançar horas', onClick: () => setCreateOpen(true) }}
                  />
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const value = entry.billable && entry.hourly_rate
                  ? Number(entry.hours) * Number(entry.hourly_rate)
                  : null;
                return (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap font-mono-ui text-xs">{fmtDate(entry.date)}</td>
                    <td>
                      <Badge variant="outline" className="text-[10px]">
                        {ACTIVITY_LABELS[entry.activity_type] ?? entry.activity_type}
                      </Badge>
                    </td>
                    <td>
                      {entry.process_label ? (
                        <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-xs">
                          {entry.process_label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="max-w-[200px]">
                      <p className="truncate text-sm text-foreground">{entry.description || '—'}</p>
                      {entry.user_email && (
                        <p className="text-[11px] text-muted-foreground">{entry.user_email}</p>
                      )}
                    </td>
                    <td className="text-right font-mono-ui text-sm font-medium">
                      {fmtHours(entry.hours)}
                    </td>
                    <td className="text-right font-mono-ui text-sm">
                      {value !== null ? (
                        <span className="text-foreground">{fmtCurrency(value)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Editar"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditEntry(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon" aria-label="Excluir"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteEntry(entry)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} lançamento{totalCount !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="flex items-center px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {createOpen && (
        <EntryDialog open onClose={() => setCreateOpen(false)} processes={processes} />
      )}
      {editEntry && (
        <EntryDialog open onClose={() => setEditEntry(null)} entry={editEntry} processes={processes} />
      )}

      <AlertDialog open={!!deleteEntry} onOpenChange={(v) => !v && setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Este lançamento de horas será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
