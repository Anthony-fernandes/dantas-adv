import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlarmClock,
  CalendarClock,
  Download,
  Eye,
  FilterX,
  FolderKanban,
  Gavel,
  Pencil,
  Plus,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';

import { useUpdateProcess, type DbProcess } from '@/hooks/useApiData';
import { apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  type PracticeAreaUiMeta,
  resolvePracticeAreaByCode,
} from '@/lib/practice-area';
import {
  loadWorkspaceStateMap,
  saveWorkspaceStateItem,
} from '@/services/workspaceState';
import { invalidateProcessRelatedQueries } from '@/services/processQueryInvalidation';
import { ProcessEditModal } from '@/components/processes/ProcessEditModal';
import type { ProcessFormValues } from '@/components/processes/ProcessValidation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PageHeader,
  DataTable,
  DataToolbar,
  SearchInput,
  StatusBadge,
  PriorityBadge,
  DsStatCard,
  RowActions,
  Pagination,
  type Column,
  type BadgeTone,
} from '@/components/ds';

type AreaCatalog = { id: string; name?: string | null; area?: string | null; is_active?: boolean };
type ClientItem = { id: string; name?: string | null; full_name?: string | null; razao_social?: string | null };
type EmployeeItem = { id: string; full_name?: string | null; email?: string | null; is_active?: boolean | null };
type ProcessResponsible = { id?: string | null; name?: string | null; full_name?: string | null };

type ProcessItem = DbProcess & {
  court?: string | null;
  court_division?: string | null;
  class_name?: string | null;
  plaintiff?: string | null;
  defendant?: string | null;
  cause_value?: string | number | null;
  probability?: string | null;
  priority?: string | null;
  client?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  responsaveis?: ProcessResponsible[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type HearingItem = { id: string; process?: string | null; process_id?: string | null; hearing_date?: string | null; type?: string | null; status?: string | null };
type DeadlineItem = { id: string; process?: string | null; process_id?: string | null; due_date?: string | null; description?: string | null; priority?: string | null; status?: string | null };
type ProcessMeta = { responsibleId?: string; responsibleName?: string };

type EnrichedProcess = ProcessItem & {
  clientName: string;
  responsibleId: string;
  responsibleName: string;
  nextHearing: HearingItem | null;
  nextDeadline: DeadlineItem | null;
  deadlineToday: boolean;
  deadlineSoon: boolean;
  deadlineOverdue: boolean;
  hearingSoon: boolean;
  areaLabel: string;
};

const PAGE_SIZE = 15;

function normalizeText(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}
function formatCurrency(value?: string | number | null) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR')}`;
}
function formatDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isSameDay(value?: string | null) {
  if (!value) return false;
  const t = new Date(value);
  return t.toDateString() === new Date().toDateString();
}
function daysDiff(value?: string | null) {
  if (!value) return null;
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return null;
  const a = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86400000);
}
function isWithinNextDays(value: string | null | undefined, days: number) {
  const diff = daysDiff(value);
  return diff !== null && diff >= 0 && diff <= days;
}
function resolveLinkedProcessId(item: { process?: string | null; process_id?: string | null }) {
  return String(item.process || item.process_id || '').trim();
}
function phaseLabel(value?: string | null) {
  const phase = normalizeText(value);
  if (!phase) return 'Não definida';
  return phase.replaceAll('_', ' ');
}

const STATUS_TONE: Record<string, BadgeTone> = {
  em_andamento: 'success',
  pre_processual: 'info',
  suspenso: 'warning',
  finalizado: 'neutral',
  arquivado: 'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  em_andamento: 'Em andamento',
  pre_processual: 'Pré-processual',
  suspenso: 'Suspenso',
  finalizado: 'Encerrado',
  arquivado: 'Arquivado',
};
const PROB_TONE: Record<string, BadgeTone> = { alta: 'success', media: 'info', baixa: 'warning' };

function buildCsv(rows: EnrichedProcess[]) {
  const header = ['CNJ', 'Cliente', 'Parte contrária', 'Área', 'Tribunal', 'Vara', 'Responsável', 'Valor da causa', 'Probabilidade', 'Próxima audiência', 'Próximo prazo', 'Status'];
  const lines = rows.map((r) => [
    r.cnj || '', r.clientName, r.defendant || '', r.areaLabel, r.court || '', r.court_division || '',
    r.responsibleName, String(r.cause_value || 0), r.probability || '',
    r.nextHearing?.hearing_date || '', r.nextDeadline?.due_date || '', r.status || '',
  ]);
  return [header, ...lines].map((line) => line.map((v) => `"${String(v || '').replaceAll('"', '""')}"`).join(';')).join('\n');
}

export default function ProcessesWorkspace() {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const updateProcess = useUpdateProcess();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [processMetaMap, setProcessMetaMap] = useState<Record<string, ProcessMeta>>({});

  const practiceAreaUiQuery = useQuery({
    queryKey: ['workspace-state', 'practice_area_ui', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<PracticeAreaUiMeta>('practice_area_ui'),
  });
  const processMetaQuery = useQuery({
    queryKey: ['workspace-state', 'process_ui', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<ProcessMeta>('process_ui'),
  });

  useEffect(() => {
    setProcessMetaMap(processMetaQuery.data ?? {});
  }, [processMetaQuery.data]);

  const processesQuery = useQuery({
    queryKey: ['processes-workspace', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<ProcessItem>('/processes/', { ordering: '-updated_at' }),
  });
  const clientsQuery = useQuery({
    queryKey: ['processes-clients', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<ClientItem>('/clients/'),
  });
  const areasQuery = useQuery({
    queryKey: ['practice-areas-for-process', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<AreaCatalog>('/causes/'),
  });
  const hearingsQuery = useQuery({
    queryKey: ['processes-hearings', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<HearingItem>('/hearings/', { ordering: 'hearing_date' }),
  });
  const deadlinesQuery = useQuery({
    queryKey: ['processes-deadlines', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<DeadlineItem>('/deadlines/', { ordering: 'due_date' }),
  });
  const employeesQuery = useQuery({
    queryKey: ['processes-employees', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<EmployeeItem>('/employees/'),
  });

  const processes = processesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const areas = areasQuery.data ?? [];
  const hearings = hearingsQuery.data ?? [];
  const deadlines = deadlinesQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const practiceAreaUiMap = practiceAreaUiQuery.data ?? {};

  const clientMap = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, String(c.name || c.full_name || c.razao_social || 'Cliente').trim()] as const)),
    [clients],
  );
  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.full_name || e.email || 'Responsável'] as const)),
    [employees],
  );

  const areaOptions = useMemo(() => {
    const active = areas.filter((a) => a.is_active !== false);
    if (active.length === 0) {
      return [
        { value: 'civel', label: 'Direito Civil' },
        { value: 'trabalhista', label: 'Direito Trabalhista' },
        { value: 'criminal', label: 'Direito Penal' },
        { value: 'tributario', label: 'Direito Tributário' },
        { value: 'empresarial', label: 'Direito Empresarial' },
        { value: 'familia', label: 'Direito de Família' },
      ];
    }
    return active.map((a) => {
      const meta = resolvePracticeAreaByCode(a.area, areas, practiceAreaUiMap);
      return { value: meta.code, label: meta.label };
    });
  }, [areas, practiceAreaUiMap]);

  const responsibleOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.filter((e) => e.is_active !== false).forEach((e) => map.set(e.id, e.full_name || e.email || 'Responsável'));
    Object.entries(processMetaMap).forEach(([id, meta]) => {
      if (meta.responsibleId && meta.responsibleName) map.set(meta.responsibleId, meta.responsibleName);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [employees, processMetaMap]);

  const hearingsByProcess = useMemo(() => {
    const map = new Map<string, HearingItem[]>();
    hearings.forEach((h) => {
      const id = resolveLinkedProcessId(h);
      if (!id) return;
      const list = map.get(id) || [];
      list.push(h);
      map.set(id, list);
    });
    map.forEach((list, key) => map.set(key, [...list].sort((l, r) => new Date(l.hearing_date || 0).getTime() - new Date(r.hearing_date || 0).getTime())));
    return map;
  }, [hearings]);

  const deadlinesByProcess = useMemo(() => {
    const map = new Map<string, DeadlineItem[]>();
    deadlines.forEach((d) => {
      const id = resolveLinkedProcessId(d);
      if (!id) return;
      const list = map.get(id) || [];
      list.push(d);
      map.set(id, list);
    });
    map.forEach((list, key) => map.set(key, [...list].sort((l, r) => new Date(l.due_date || 0).getTime() - new Date(r.due_date || 0).getTime())));
    return map;
  }, [deadlines]);

  const rows = useMemo<EnrichedProcess[]>(() => {
    return processes.map((process) => {
      const meta = resolvePracticeAreaByCode(process.area, areas, practiceAreaUiMap);
      const backendResponsible = Array.isArray(process.responsaveis)
        ? process.responsaveis.map((r) => r.name || r.full_name || '').filter(Boolean)
        : [];
      const fallbackMeta = processMetaMap[process.id] || {};
      const responsibleName = backendResponsible.join(', ') || fallbackMeta.responsibleName || 'Não definido';
      const responsibleId = process.responsaveis?.[0]?.id ? String(process.responsaveis[0].id) : fallbackMeta.responsibleId || '';
      const nextHearing = (hearingsByProcess.get(process.id) || []).find((i) => (daysDiff(i.hearing_date) ?? 999) >= 0) || null;
      const nextDeadline = (deadlinesByProcess.get(process.id) || []).find((i) => normalizeText(i.status) !== 'concluido') || null;
      return {
        ...process,
        clientName: process.client_name || process.cliente_nome || clientMap[String(process.client || process.client_id || '')] || 'Sem cliente',
        responsibleId,
        responsibleName,
        nextHearing,
        nextDeadline,
        deadlineToday: isSameDay(nextDeadline?.due_date),
        deadlineSoon: isWithinNextDays(nextDeadline?.due_date, 3),
        deadlineOverdue: (daysDiff(nextDeadline?.due_date) ?? 999) < 0 && normalizeText(nextDeadline?.status) !== 'concluido',
        hearingSoon: isWithinNextDays(nextHearing?.hearing_date, 7),
        areaLabel: meta.label,
      };
    });
  }, [areas, clientMap, deadlinesByProcess, hearingsByProcess, practiceAreaUiMap, processMetaMap, processes]);

  const filteredRows = useMemo(() => {
    const query = normalizeText(search);
    return [...rows]
      .filter((row) => {
        if (statusFilter !== 'all' && normalizeText(row.status) !== statusFilter) return false;
        if (areaFilter !== 'all' && normalizeText(row.area) !== areaFilter) return false;
        if (responsibleFilter !== 'all' && row.responsibleId !== responsibleFilter) return false;
        if (priorityFilter !== 'all' && (normalizeText(row.priority) || 'media') !== priorityFilter) return false;
        if (!query) return true;
        return [row.cnj, row.clientName, row.defendant, row.plaintiff, row.responsibleName, row.areaLabel, row.court, row.court_division, row.class_name]
          .some((v) => normalizeText(String(v || '')).includes(query));
      })
      .sort((l, r) => {
        const rank = (i: EnrichedProcess) => (i.deadlineOverdue ? 0 : i.deadlineToday ? 1 : i.deadlineSoon ? 2 : i.hearingSoon ? 3 : 4);
        return rank(l) - rank(r) || new Date(r.updated_at || r.created_at || 0).getTime() - new Date(l.updated_at || l.created_at || 0).getTime();
      });
  }, [areaFilter, priorityFilter, responsibleFilter, rows, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, areaFilter, responsibleFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const active = rows.filter((r) => !['finalizado', 'arquivado'].includes(normalizeText(r.status))).length;
    const closed = rows.filter((r) => ['finalizado', 'arquivado'].includes(normalizeText(r.status))).length;
    const dueToday = rows.filter((r) => r.deadlineToday).length;
    const upcomingHearings = rows.filter((r) => r.hearingSoon).length;
    return { total: rows.length, active, closed, dueToday, upcomingHearings };
  }, [rows]);

  const editingProcess = useMemo(() => rows.find((p) => p.id === editingProcessId) || null, [editingProcessId, rows]);

  const persistProcessMeta = async (processId: string, meta: ProcessMeta) => {
    const nextMap = { ...processMetaMap, [processId]: meta };
    setProcessMetaMap(nextMap);
    await saveWorkspaceStateItem('process_ui', processId, meta);
    queryClient.setQueryData(['workspace-state', 'process_ui', activeTenantId], nextMap);
  };

  const saveProcess = async (payload?: Record<string, unknown>, values?: ProcessFormValues) => {
    if (!payload || !values || !editingProcessId) return;
    const saved = await updateProcess.mutateAsync({ id: editingProcessId, ...payload } as any);
    await persistProcessMeta(saved.id, {
      responsibleId: values.responsibleId || '',
      responsibleName: employeeMap[values.responsibleId] || '',
    });
    await invalidateProcessRelatedQueries(queryClient, activeTenantId);
    setEditingProcessId(null);
  };

  const exportRows = () => {
    if (filteredRows.length === 0) {
      toast.error('Não há processos para exportar com os filtros atuais.');
      return;
    }
    const csv = buildCsv(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `processos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAreaFilter('all');
    setResponsibleFilter('all');
    setPriorityFilter('all');
  };

  const loading = [processesQuery.isLoading, clientsQuery.isLoading, hearingsQuery.isLoading, deadlinesQuery.isLoading].some(Boolean);
  const hasFilters = search !== '' || statusFilter !== 'all' || areaFilter !== 'all' || responsibleFilter !== 'all' || priorityFilter !== 'all';

  const columns: Column<EnrichedProcess>[] = [
    {
      key: 'cnj',
      header: 'Nº CNJ',
      width: '200px',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {(row.deadlineOverdue || row.deadlineToday) && (
            <span className={row.deadlineOverdue ? 'h-1.5 w-1.5 shrink-0 rounded-full bg-destructive' : 'h-1.5 w-1.5 shrink-0 rounded-full bg-warning'} />
          )}
          <span className="font-mono text-[12.5px] font-medium text-foreground">{row.cnj || '—'}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{row.clientName}</p>
          <p className="truncate text-[12px] text-muted-foreground">{row.defendant ? `x ${row.defendant}` : 'Parte contrária não informada'}</p>
        </div>
      ),
    },
    { key: 'area', header: 'Área', cell: (row) => <span className="text-foreground">{row.areaLabel}</span> },
    { key: 'phase', header: 'Fase', cell: (row) => <span className="capitalize text-muted-foreground">{phaseLabel(row.phase)}</span> },
    { key: 'responsible', header: 'Responsável', cell: (row) => <span className="truncate text-foreground">{row.responsibleName}</span> },
    { key: 'value', header: 'Valor', align: 'right', cell: (row) => <span className="tabular-nums text-foreground">{formatCurrency(row.cause_value)}</span> },
    {
      key: 'probability',
      header: 'Prob. êxito',
      cell: (row) => (row.probability ? <StatusBadge tone={PROB_TONE[normalizeText(row.probability)] ?? 'info'} dot={false}>{row.probability}</StatusBadge> : <span className="text-muted-foreground">—</span>),
    },
    { key: 'priority', header: 'Prioridade', cell: (row) => <PriorityBadge value={row.priority} /> },
    {
      key: 'next',
      header: 'Próximo prazo',
      cell: (row) =>
        row.nextDeadline ? (
          <span className={row.deadlineOverdue ? 'text-destructive' : 'text-foreground'}>{formatDate(row.nextDeadline.due_date)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const key = normalizeText(row.status);
        return <StatusBadge tone={STATUS_TONE[key] ?? 'neutral'}>{STATUS_LABEL[key] ?? row.status ?? '—'}</StatusBadge>;
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '56px',
      cell: (row) => (
        <RowActions
          actions={[
            { label: 'Abrir', icon: <Eye className="h-4 w-4" />, onClick: () => navigate(`/app/processos/${row.id}`) },
            { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => setEditingProcessId(row.id) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Contencioso"
        title="Processos"
        description="Carteira consolidada de clientes, áreas, audiências e prazos."
        actions={
          <>
            <Button variant="outline" onClick={exportRows}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={() => navigate('/app/processos/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo processo
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DsStatCard label="Total" value={stats.total} hint="Carteira cadastrada" icon={Scale} tone="default" />
        <DsStatCard label="Ativos" value={stats.active} hint="Em andamento" icon={FolderKanban} tone="info" />
        <DsStatCard label="Encerrados" value={stats.closed} hint="Arquivados" icon={Gavel} tone="default" />
        <DsStatCard label="Prazos hoje" value={stats.dueToday} hint="Atenção imediata" icon={AlarmClock} tone="warning" />
        <DsStatCard label="Audiências 7d" value={stats.upcomingHearings} hint="Próximos 7 dias" icon={CalendarClock} tone="success" />
      </div>

      <DataToolbar
        search={<SearchInput value={search} onChange={setSearch} placeholder="Buscar por CNJ, cliente, parte, responsável…" />}
        filters={
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="pre_processual">Pré-processual</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="finalizado">Encerrado</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {areaOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos responsáveis</SelectItem>
                {responsibleOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground">
                <FilterX className="mr-1.5 h-3.5 w-3.5" />
                Limpar
              </Button>
            )}
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={pagedRows}
        getRowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/app/processos/${row.id}`)}
        loading={loading}
        minWidth={1180}
        empty={<span className="text-sm text-muted-foreground">Nenhum processo encontrado. Ajuste os filtros ou cadastre um novo processo.</span>}
      />

      <Pagination page={page} totalPages={totalPages} totalCount={filteredRows.length} onPageChange={setPage} />

      <ProcessEditModal
        open={!!editingProcessId}
        mode="edit"
        processId={editingProcessId}
        process={editingProcess}
        defaultArea={areaOptions[0]?.value || 'civel'}
        clients={clients.map((c) => ({ value: c.id, label: String(c.name || c.full_name || c.razao_social || 'Cliente') }))}
        employees={responsibleOptions}
        areas={areaOptions}
        isSubmitting={updateProcess.isPending}
        onOpenChange={(next) => { if (!next) setEditingProcessId(null); }}
        onSave={saveProcess}
      />
    </div>
  );
}
