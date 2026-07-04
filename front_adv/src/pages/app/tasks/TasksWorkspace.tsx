import { useState, useMemo } from 'react';
import {
  CheckSquare, Plus, Search, Pencil, Trash2, CheckCircle2,
  Circle, Clock, AlertTriangle, LayoutList, LayoutGrid, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useTasks, useTasksPaged, useCreateTask, useUpdateTask, useDeleteTask, useProcesses,
} from '@/hooks/useApiData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------- types ----------

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  due_date?: string;
  process?: string;
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
};

type TaskFormState = {
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  process: string;
};

const EMPTY_FORM: TaskFormState = {
  title: '',
  description: '',
  priority: 'media',
  status: 'pendente',
  due_date: '',
  process: '',
};

// ---------- helpers ----------

const PRIORITY_LABEL: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const KANBAN_COLUMNS = [
  { key: 'pendente', label: 'Pendente', color: 'bg-muted', dot: 'bg-muted-foreground' },
  { key: 'em_andamento', label: 'Em andamento', color: 'bg-amber-500/15', dot: 'bg-amber-500' },
  { key: 'concluida', label: 'Concluída', color: 'bg-green-500/15', dot: 'bg-green-500' },
  { key: 'cancelada', label: 'Cancelada', color: 'bg-muted', dot: 'bg-muted-foreground' },
];

function priorityBadge(priority: string) {
  const cls =
    priority === 'urgente'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : priority === 'alta'
      ? 'bg-warning/10 text-warning border-warning/20'
      : priority === 'media'
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-muted text-muted-foreground border-border';
  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium', cls)}>
      {PRIORITY_LABEL[priority] ?? priority}
    </Badge>
  );
}

function statusIcon(status: string) {
  if (status === 'concluida') return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === 'em_andamento') return <Clock className="h-4 w-4 text-warning" />;
  if (status === 'cancelada') return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  return <Circle className="h-4 w-4 text-muted-foreground" />;
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === 'concluida' || task.status === 'cancelada') return false;
  return new Date(task.due_date) < new Date();
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

// ---------- Task Dialog ----------

type TaskDialogProps = {
  open: boolean;
  onClose: () => void;
  task?: Task;
  processes: any[];
  defaultStatus?: string;
};

function TaskDialog({ open, onClose, task, processes, defaultStatus }: TaskDialogProps) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = useState<TaskFormState>(
    task
      ? {
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          status: task.status,
          due_date: task.due_date?.split('T')[0] ?? '',
          process: task.process ?? '',
        }
      : { ...EMPTY_FORM, status: defaultStatus ?? 'pendente' },
  );

  function set(field: keyof TaskFormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    const payload: any = {
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
      process: form.process || null,
    };
    try {
      if (task) {
        await updateTask.mutateAsync({ id: task.id, ...payload });
      } else {
        await createTask.mutateAsync(payload);
      }
      onClose();
    } catch {
      // toast shown by mutation
    }
  }

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Descrição resumida da tarefa"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Descrição</Label>
            <Textarea
              id="task-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-due">Data limite</Label>
            <Input
              id="task-due"
              type="date"
              value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)}
            />
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
                    {p.cnj || p.subject || `Processo ${p.id.slice(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : task ? 'Salvar' : 'Criar tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Kanban Card ----------

type KanbanCardProps = {
  task: Task;
  processLabel: (id?: string) => string | null;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onMove: (t: Task, status: string) => void;
  updateMut: ReturnType<typeof useUpdateTask>;
};

function KanbanCard({ task, processLabel, onEdit, onDelete, onMove, updateMut }: KanbanCardProps) {
  const overdue = isOverdue(task);
  const done = task.status === 'concluida';

  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-card transition-shadow hover:shadow-elevated',
        done && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('flex-1 text-sm font-medium text-foreground leading-snug', done && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Editar"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Excluir"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {priorityBadge(task.priority)}
        {task.due_date && (
          <span className={cn(
            'rounded border px-1.5 py-0.5 text-[10px]',
            overdue
              ? 'border-destructive/20 bg-destructive/10 text-destructive font-semibold'
              : 'border-border bg-muted/50 text-muted-foreground',
          )}>
            {fmtDate(task.due_date)}{overdue ? ' !' : ''}
          </span>
        )}
        {task.process && processLabel(task.process) && (
          <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {processLabel(task.process)}
          </span>
        )}
      </div>

      {/* Move to column */}
      <div className="mt-2.5 border-t border-border pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between text-[11px] text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-1">
                {statusIcon(task.status)}
                <span>{STATUS_LABEL[task.status] ?? task.status}</span>
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {KANBAN_COLUMNS.filter((c) => c.key !== task.status).map((col) => (
              <DropdownMenuItem
                key={col.key}
                onClick={() => onMove(task, col.key)}
                disabled={updateMut.isPending}
              >
                <span className={cn('mr-2 h-2 w-2 rounded-full', col.dot)} />
                Mover para {col.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ---------- Main workspace ----------

type ViewMode = 'list' | 'board';

export default function TasksWorkspace() {
  const [view, setView] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | undefined>();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const filters: Record<string, any> = {};
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (priorityFilter !== 'all') filters.priority = priorityFilter;

  const { data: paged, isLoading } = useTasksPaged(
    view === 'list' ? filters : {},
    search || undefined,
    page,
    { column: 'due_date', ascending: true },
  );

  const { data: allTasksRaw } = useTasks();
  const { data: processes = [] } = useProcesses();

  const deleteMut = useDeleteTask();
  const updateMut = useUpdateTask();

  const allTasks: Task[] = (allTasksRaw ?? []) as Task[];
  const tasks: Task[] = (paged?.results ?? []) as Task[];
  const totalCount = paged?.count ?? 0;
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // KPIs from unfiltered list
  const kpiPendente = allTasks.filter((t) => t.status === 'pendente').length;
  const kpiEmAndamento = allTasks.filter((t) => t.status === 'em_andamento').length;
  const kpiConcluida = allTasks.filter((t) => t.status === 'concluida').length;
  const kpiVencidas = allTasks.filter((t) => isOverdue(t)).length;

  // For board view, filter client-side from allTasks
  const boardTasks = useMemo(() => {
    const q = search.toLowerCase();
    return allTasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [allTasks, search, priorityFilter]);

  const boardByStatus = useMemo(() => {
    const map: Record<string, Task[]> = { pendente: [], em_andamento: [], concluida: [], cancelada: [] };
    for (const t of boardTasks) {
      if (map[t.status]) map[t.status].push(t);
      else map.pendente.push(t);
    }
    return map;
  }, [boardTasks]);

  function processLabel(id?: string) {
    if (!id) return null;
    const p = processes.find((x: any) => x.id === id);
    if (!p) return null;
    return (p as any).cnj || (p as any).subject || `#${id.slice(0, 8)}`;
  }

  async function handleToggleDone(task: Task) {
    const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida';
    await updateMut.mutateAsync({ id: task.id, status: newStatus });
  }

  async function handleDelete() {
    if (!deleteTask) return;
    await deleteMut.mutateAsync(deleteTask.id);
    setDeleteTask(null);
  }

  async function handleMove(task: Task, status: string) {
    await updateMut.mutateAsync({ id: task.id, status });
  }

  function openCreate(status?: string) {
    setCreateStatus(status);
    setCreateOpen(true);
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">Jurídico</p>
          <h1 className="page-title">Tarefas</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors',
                view === 'list'
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors',
                view === 'board'
                  ? 'bg-card text-foreground shadow-card'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Quadro
            </button>
          </div>
          <Button onClick={() => openCreate()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="kpi">
          <p className="kpi-label">Pendentes</p>
          <p className="kpi-value">{kpiPendente}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Em andamento</p>
          <p className="kpi-value">{kpiEmAndamento}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Concluídas</p>
          <p className="kpi-value">{kpiConcluida}</p>
        </div>
        <div className={cn('kpi', kpiVencidas > 0 ? 'border-destructive/30 bg-destructive/5' : '')}>
          <p className="kpi-label">Vencidas</p>
          <p className={cn('kpi-value', kpiVencidas > 0 ? 'text-destructive' : '')}>{kpiVencidas}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar tarefas..."
            className="pl-9"
          />
        </div>

        {view === 'list' && (
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --------- LIST VIEW --------- */}
      {view === 'list' && (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="Nenhuma tarefa encontrada"
                description="Crie tarefas para organizar o trabalho do escritório."
                action={{ label: 'Nova tarefa', onClick: () => openCreate() }}
              />
            ) : (
              <table className="w-full border-collapse text-[13px]" style={{ minWidth: 760 }}>
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="w-10 px-4 py-2.5" />
                    <th className="px-4 py-2.5 text-left font-medium">Tarefa</th>
                    <th className="px-4 py-2.5 text-left font-medium">Prioridade</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Prazo</th>
                    <th className="px-4 py-2.5 text-left font-medium">Processo</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const overdue = isOverdue(task);
                    const done = task.status === 'concluida';
                    return (
                      <tr key={task.id} className={cn('border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30', done && 'opacity-60')}>
                        <td className="px-4 py-2.5 align-middle">
                          <Checkbox checked={done} onCheckedChange={() => handleToggleDone(task)} className="rounded-full" />
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <p className={cn('font-medium text-foreground', done && 'text-muted-foreground line-through')}>{task.title}</p>
                          {task.description && <p className="max-w-[320px] truncate text-[11.5px] text-muted-foreground">{task.description}</p>}
                        </td>
                        <td className="px-4 py-2.5 align-middle">{priorityBadge(task.priority)}</td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {statusIcon(task.status)}
                            <span>{STATUS_LABEL[task.status] ?? task.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          {task.due_date ? (
                            <span className={cn('text-muted-foreground', overdue && 'font-semibold text-destructive')}>
                              {fmtDate(task.due_date)}{overdue ? ' (vencida)' : ''}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-2.5 align-middle text-muted-foreground">
                          {task.process && processLabel(task.process) ? processLabel(task.process) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right align-middle">
                          <div className="flex shrink-0 items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" aria-label="Editar" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditTask(task)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Excluir" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTask(task)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{totalCount} tarefa{totalCount !== 1 ? 's' : ''}</span>
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
        </>
      )}

      {/* --------- BOARD VIEW --------- */}
      {view === 'board' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = boardByStatus[col.key] ?? [];
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Column header */}
                <div className={cn('flex items-center justify-between rounded-lg px-3 py-2', col.color)}>
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', col.dot)} />
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCreate(col.key)}
                    className="rounded p-1 text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    title={`Nova tarefa em ${col.label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        processLabel={processLabel}
                        onEdit={setEditTask}
                        onDelete={setDeleteTask}
                        onMove={handleMove}
                        updateMut={updateMut}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      {createOpen && (
        <TaskDialog
          open
          onClose={() => { setCreateOpen(false); setCreateStatus(undefined); }}
          processes={processes}
          defaultStatus={createStatus}
        />
      )}
      {editTask && (
        <TaskDialog
          open
          onClose={() => setEditTask(null)}
          task={editTask}
          processes={processes}
        />
      )}

      <AlertDialog open={!!deleteTask} onOpenChange={(v) => !v && setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa "<strong>{deleteTask?.title}</strong>" será removida permanentemente.
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
