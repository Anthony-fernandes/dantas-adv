import { useState } from 'react';
import { Shield, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuditEventsPaged, getTotalPages } from '@/hooks/useApiData';
import { cn } from '@/lib/utils';

const EVENT_TYPE_LABELS: Record<string, string> = {
  process_created: 'Processo criado',
  process_updated: 'Processo atualizado',
  process_deleted: 'Processo excluído',
  deadline_created: 'Prazo criado',
  deadline_updated: 'Prazo atualizado',
  deadline_deleted: 'Prazo excluído',
  hearing_created: 'Audiência criada',
  hearing_updated: 'Audiência atualizada',
  hearing_deleted: 'Audiência excluída',
  movement_created: 'Andamento criado',
  movement_updated: 'Andamento atualizado',
  task_created: 'Tarefa criada',
  task_updated: 'Tarefa atualizada',
  task_deleted: 'Tarefa excluída',
  client_created: 'Cliente criado',
  client_updated: 'Cliente atualizado',
  client_deleted: 'Cliente excluído',
  document_created: 'Documento criado',
  document_updated: 'Documento atualizado',
  document_deleted: 'Documento excluído',
};

const ENTITY_COLORS: Record<string, string> = {
  Process: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  Deadline: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  Hearing: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  Task: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  Client: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
  Document: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800',
  Movement: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  TimeEntry: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
};

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filters: Record<string, any> = {};
  if (entityFilter !== 'all') filters.entity_type = entityFilter;

  const { data: paged, isLoading } = useAuditEventsPaged(
    filters,
    search || undefined,
    page,
    { column: 'created_at', ascending: false },
  );

  const events = paged?.results ?? [];
  const totalCount = paged?.count ?? 0;
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="page-title">Log de auditoria</h1>
          <p className="page-subtitle mt-1">Registro imutável de todas as ações realizadas no sistema.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="kpi">
          <p className="kpi-label">Total de eventos</p>
          <p className="kpi-value">{totalCount}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Nesta página</p>
          <p className="kpi-value">{events.length}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Página</p>
          <p className="kpi-value">{page} / {totalPages}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Por página</p>
          <p className="kpi-value">{PAGE_SIZE}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por tipo, usuário..."
            className="pl-9"
          />
        </div>

        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            {['Process', 'Deadline', 'Hearing', 'Task', 'Client', 'Document', 'Movement', 'TimeEntry'].map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="table-editorial min-w-[720px] w-full">
          <thead>
            <tr>
              <th>Data / Hora</th>
              <th>Usuário</th>
              <th>Evento</th>
              <th>Entidade</th>
              <th>Resumo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={Shield}
                    title="Nenhum evento registrado"
                    description="As ações do sistema aparecerão aqui conforme ocorrem."
                  />
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.id}>
                  <td className="whitespace-nowrap font-mono-ui text-xs text-muted-foreground">
                    {fmtDateTime(evt.created_at)}
                  </td>
                  <td className="text-sm">
                    {evt.actor_email ? (
                      <span className="font-medium text-foreground">{evt.actor_email}</span>
                    ) : (
                      <span className="text-muted-foreground">Sistema</span>
                    )}
                  </td>
                  <td>
                    <span className="text-sm text-foreground">
                      {EVENT_TYPE_LABELS[evt.event_type] ?? evt.event_type}
                    </span>
                  </td>
                  <td>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-medium', ENTITY_COLORS[evt.entity_type] ?? 'bg-muted text-muted-foreground')}
                    >
                      {evt.entity_type}
                    </Badge>
                  </td>
                  <td className="max-w-[280px]">
                    <p className="truncate text-sm text-muted-foreground">
                      {evt.summary || '—'}
                    </p>
                    {evt.entity_id && (
                      <p className="font-mono-ui text-[10px] text-muted-foreground/60">
                        #{evt.entity_id.slice(0, 8)}
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} evento{totalCount !== 1 ? 's' : ''}</span>
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
    </div>
  );
}
