import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  Download,
  Eye,
  FileText,
  FilterX,
  Flame,
  FolderKanban,
  Gavel,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Scale,
  Search,
  TableProperties,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCreateProcess, useUpdateProcess, type DbProcess } from '@/hooks/useApiData';
import { api, apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import {
  getPracticeAreaIcon,
  practiceAreaPillStyle,
  type PracticeAreaUiMeta,
  resolvePracticeAreaByCode,
} from '@/lib/practice-area';
import {
  loadWorkspaceStateMap,
  saveWorkspaceStateItem,
} from '@/services/workspaceState';
import { invalidateProcessRelatedQueries } from '@/services/processQueryInvalidation';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatCard } from '@/components/shared/StatCard';
import { ProcessEditModal } from '@/components/processes/ProcessEditModal';
import type { ProcessFormValues } from '@/components/processes/ProcessValidation';
import { probExitoVariant, processStatusVariant, StatusBadge } from '@/components/shared/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type AreaCatalog = { id: string; name?: string | null; area?: string | null; is_active?: boolean };

type ClientItem = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  razao_social?: string | null;
};

type EmployeeItem = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type ProcessResponsible = {
  id?: string | null;
  name?: string | null;
  full_name?: string | null;
};

type ProcessItem = DbProcess & {
  court?: string | null;
  court_division?: string | null;
  class_name?: string | null;
  plaintiff?: string | null;
  defendant?: string | null;
  cause_value?: string | number | null;
  probability?: string | null;
  client?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  notes?: string | null;
  responsaveis?: ProcessResponsible[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type HearingItem = {
  id: string;
  process?: string | null;
  process_id?: string | null;
  hearing_date?: string | null;
  type?: string | null;
  status?: string | null;
};

type DeadlineItem = {
  id: string;
  process?: string | null;
  process_id?: string | null;
  due_date?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
};

type ProcessMeta = {
  responsibleId?: string;
  responsibleName?: string;
};

type ProcessFormState = {
  cnj: string;
  court: string;
  court_division: string;
  class_name: string;
  area: string;
  phase: string;
  status: string;
  cause_value: string;
  probability: string;
  plaintiff: string;
  defendant: string;
  client: string;
  responsibleId: string;
  notes: string;
};

type EnrichedProcess = ProcessItem & {
  clientName: string;
  responsibleId: string;
  responsibleName: string;
  nextHearing: HearingItem | null;
  nextDeadline: DeadlineItem | null;
  hearingToday: boolean;
  hearingSoon: boolean;
  deadlineToday: boolean;
  deadlineSoon: boolean;
  deadlineOverdue: boolean;
  areaLabel: string;
  areaColor: string;
  areaIcon: ReturnType<typeof getPracticeAreaIcon>;
};

const PAGE_SIZE = 12;

function normalizeText(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value || 0);
  return `R$ ${amount.toLocaleString('pt-BR')}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function isSameDay(value?: string | null) {
  if (!value) return false;
  const target = new Date(value);
  const now = new Date();
  return target.toDateString() === now.toDateString();
}

function daysDiff(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((startTarget - startToday) / 86400000);
}

function isWithinNextDays(value: string | null | undefined, days: number) {
  const diff = daysDiff(value);
  return diff !== null && diff >= 0 && diff <= days;
}

function resolveLinkedProcessId(item: { process?: string | null; process_id?: string | null }) {
  return String(item.process || item.process_id || '').trim();
}

function processPhaseLabel(value?: string | null) {
  const phase = normalizeText(value);
  if (!phase) return 'Não definida';
  return phase.replaceAll('_', ' ');
}

function processPhaseBadgeClass(value?: string | null) {
  const phase = normalizeText(value);
  if (phase === 'execucao' || phase === 'cumprimento' || phase === 'cumprimento_de_sentenca') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (phase === 'recursal' || phase === 'recurso') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function buildCsv(rows: EnrichedProcess[]) {
  const header = [
    'CNJ',
    'Cliente',
    'Parte contrária',
    'Área',
    'Tribunal',
    'Vara',
    'Responsável',
    'Valor da causa',
    'Probabilidade',
    'Próxima audiência',
    'Próximo prazo',
    'Status',
  ];

  const lines = rows.map((row) => [
    row.cnj || '',
    row.clientName,
    row.defendant || '',
    row.areaLabel,
    row.court || '',
    row.court_division || '',
    row.responsibleName,
    String(row.cause_value || 0),
    row.probability || '',
    row.nextHearing?.hearing_date || '',
    row.nextDeadline?.due_date || '',
    row.status || '',
  ]);

  return [header, ...lines]
    .map((line) => line.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(';'))
    .join('\n');
}

const DEFAULT_FORM = (areaValue = 'civel'): ProcessFormState => ({
  cnj: '',
  court: '',
  court_division: '',
  class_name: '',
  area: areaValue,
  phase: 'conhecimento',
  status: 'em_andamento',
  cause_value: '',
  probability: 'media',
  plaintiff: '',
  defendant: '',
  client: '',
  responsibleId: '',
  notes: '',
});

export default function ProcessesWorkspace() {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const createProcess = useCreateProcess();
  const updateProcess = useUpdateProcess();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [probabilityFilter, setProbabilityFilter] = useState('all');
  const [hearingFilter, setHearingFilter] = useState(false);
  const [deadlineFilter, setDeadlineFilter] = useState(false);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [form, setForm] = useState<ProcessFormState>(DEFAULT_FORM());
  const [dialogSeedCnj, setDialogSeedCnj] = useState('');
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

  const persistProcessMeta = async (processId: string, meta: ProcessMeta) => {
    const nextMap = { ...processMetaMap, [processId]: meta };
    setProcessMetaMap(nextMap);
    await saveWorkspaceStateItem('process_ui', processId, meta);
    queryClient.setQueryData(['workspace-state', 'process_ui', activeTenantId], nextMap);
    return nextMap;
  };

  const clientMap = useMemo(
    () =>
      Object.fromEntries(
        clients.map((client) => [client.id, String(client.name || client.full_name || client.razao_social || 'Cliente').trim()] as const),
      ),
    [clients],
  );

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((employee) => [employee.id, employee.full_name || employee.email || 'Responsável'] as const),
      ),
    [employees],
  );

  const areaOptions = useMemo(() => {
    const activeAreas = areas.filter((item) => item.is_active !== false);
    if (activeAreas.length === 0) {
      return [
        { value: 'civel', label: 'Direito Civil' },
        { value: 'trabalhista', label: 'Direito Trabalhista' },
        { value: 'criminal', label: 'Direito Penal' },
        { value: 'tributario', label: 'Direito Tributário' },
        { value: 'empresarial', label: 'Direito Empresarial' },
        { value: 'familia', label: 'Direito de Familia' },
      ];
    }

    return activeAreas.map((area) => {
      const meta = resolvePracticeAreaByCode(area.area, areas, practiceAreaUiMap);
      return { value: meta.code, label: meta.label };
    });
  }, [areas, practiceAreaUiMap]);

  const responsibleOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.filter((employee) => employee.is_active !== false).forEach((employee) => {
      map.set(employee.id, employee.full_name || employee.email || 'Responsável');
    });
    Object.entries(processMetaMap).forEach(([id, meta]) => {
      if (meta.responsibleId && meta.responsibleName) map.set(meta.responsibleId, meta.responsibleName);
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [employees, processMetaMap]);

  const hearingsByProcess = useMemo(() => {
    const map = new Map<string, HearingItem[]>();
    hearings.forEach((hearing) => {
      const processId = resolveLinkedProcessId(hearing);
      if (!processId) return;
      const list = map.get(processId) || [];
      list.push(hearing);
      map.set(processId, list);
    });
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((left, right) => new Date(left.hearing_date || 0).getTime() - new Date(right.hearing_date || 0).getTime()),
      );
    });
    return map;
  }, [hearings]);

  const deadlinesByProcess = useMemo(() => {
    const map = new Map<string, DeadlineItem[]>();
    deadlines.forEach((deadline) => {
      const processId = resolveLinkedProcessId(deadline);
      if (!processId) return;
      const list = map.get(processId) || [];
      list.push(deadline);
      map.set(processId, list);
    });
    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((left, right) => new Date(left.due_date || 0).getTime() - new Date(right.due_date || 0).getTime()),
      );
    });
    return map;
  }, [deadlines]);

  const rows = useMemo<EnrichedProcess[]>(() => {
    return processes.map((process) => {
      const meta = resolvePracticeAreaByCode(process.area, areas, practiceAreaUiMap);
      const backendResponsible = Array.isArray(process.responsaveis)
        ? process.responsaveis.map((item) => item.name || item.full_name || '').filter(Boolean)
        : [];
      const fallbackMeta = processMetaMap[process.id] || {};
      const responsibleName = backendResponsible.join(', ') || fallbackMeta.responsibleName || 'Não definido';
      const responsibleId = process.responsaveis?.[0]?.id ? String(process.responsaveis[0].id) : fallbackMeta.responsibleId || '';

      const nextHearing = (hearingsByProcess.get(process.id) || []).find((item) => (daysDiff(item.hearing_date) ?? 999) >= 0) || null;
      const nextDeadline = (deadlinesByProcess.get(process.id) || []).find((item) => normalizeText(item.status) !== 'concluido') || null;

      return {
        ...process,
        clientName: process.client_name || process.cliente_nome || clientMap[String(process.client || process.client_id || '')] || 'Sem cliente',
        responsibleId,
        responsibleName,
        nextHearing,
        nextDeadline,
        hearingToday: isSameDay(nextHearing?.hearing_date),
        hearingSoon: isWithinNextDays(nextHearing?.hearing_date, 7),
        deadlineToday: isSameDay(nextDeadline?.due_date),
        deadlineSoon: isWithinNextDays(nextDeadline?.due_date, 3),
        deadlineOverdue: (daysDiff(nextDeadline?.due_date) ?? 999) < 0 && normalizeText(nextDeadline?.status) !== 'concluido',
        areaLabel: meta.label,
        areaColor: meta.color,
        areaIcon: getPracticeAreaIcon(meta.icon),
      };
    });
  }, [areas, clientMap, deadlinesByProcess, hearingsByProcess, practiceAreaUiMap, processMetaMap, processes]);

  const filteredRows = useMemo(() => {
    const query = normalizeText(search);
    return [...rows]
      .filter((row) => {
        if (statusFilter !== 'all' && normalizeText(row.status) !== statusFilter) return false;
        if (phaseFilter !== 'all' && normalizeText(row.phase) !== phaseFilter) return false;
        if (areaFilter !== 'all' && normalizeText(row.area) !== areaFilter) return false;
        if (responsibleFilter !== 'all' && row.responsibleId !== responsibleFilter) return false;
        if (clientFilter !== 'all' && String(row.client || row.client_id || '') !== clientFilter) return false;
        if (probabilityFilter !== 'all' && normalizeText(row.probability) !== probabilityFilter) return false;
        if (hearingFilter && !row.hearingSoon) return false;
        if (deadlineFilter && !(row.deadlineSoon || row.deadlineOverdue || row.deadlineToday)) return false;
        if (!query) return true;
        return [
          row.cnj,
          row.clientName,
          row.defendant,
          row.plaintiff,
          row.responsibleName,
          row.areaLabel,
          row.court,
          row.court_division,
          row.class_name,
        ].some((value) => normalizeText(String(value || '')).includes(query));
      })
      .sort((left, right) => {
        const alertRank = (item: EnrichedProcess) => {
          if (item.deadlineOverdue) return 0;
          if (item.deadlineToday) return 1;
          if (item.deadlineSoon) return 2;
          if (item.hearingToday) return 3;
          if (item.hearingSoon) return 4;
          return 5;
        };
        return alertRank(left) - alertRank(right) || new Date(right.updated_at || right.created_at || 0).getTime() - new Date(left.updated_at || left.created_at || 0).getTime();
      });
  }, [areaFilter, clientFilter, deadlineFilter, hearingFilter, phaseFilter, probabilityFilter, responsibleFilter, rows, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, phaseFilter, areaFilter, responsibleFilter, clientFilter, probabilityFilter, hearingFilter, deadlineFilter, view]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const active = rows.filter((row) => !['finalizado', 'arquivado'].includes(normalizeText(row.status))).length;
    const closed = rows.filter((row) => ['finalizado', 'arquivado'].includes(normalizeText(row.status))).length;
    const dueToday = rows.filter((row) => row.deadlineToday).length;
    const upcomingHearings = rows.filter((row) => row.hearingSoon).length;
    return {
      total: rows.length,
      active,
      closed,
      dueToday,
      upcomingHearings,
    };
  }, [rows]);

  const editingProcess = useMemo(
    () => rows.find((process) => process.id === editingProcessId) || null,
    [editingProcessId, rows],
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProcessId(null);
    setDialogSeedCnj('');
  };

  const openCreate = (seedCnj = '') => {
    setEditingProcessId(null);
    setDialogSeedCnj(seedCnj);
    setDialogOpen(true);
  };

  const openEdit = (process: EnrichedProcess) => {
    setEditingProcessId(process.id);
    setDialogSeedCnj('');
    setDialogOpen(true);
  };

  const saveProcess = async (payload?: Record<string, unknown>, values?: ProcessFormValues) => {
    if (!payload || !values) return;

    const saved = editingProcessId
      ? await updateProcess.mutateAsync({ id: editingProcessId, ...payload } as any)
      : await createProcess.mutateAsync(payload as any);

    const responsibleName = employeeMap[values.responsibleId] || '';
    await persistProcessMeta(saved.id, {
      responsibleId: values.responsibleId || '',
      responsibleName,
    });
    await invalidateProcessRelatedQueries(queryClient, activeTenantId);
    closeDialog();
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
    setPhaseFilter('all');
    setAreaFilter('all');
    setResponsibleFilter('all');
    setClientFilter('all');
    setProbabilityFilter('all');
    setHearingFilter(false);
    setDeadlineFilter(false);
  };

  const loading = [processesQuery.isLoading, clientsQuery.isLoading, hearingsQuery.isLoading, deadlinesQuery.isLoading].some(Boolean);

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div className="page-header items-start gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-accent/55 px-3 py-1 font-mono-ui text-[10px] font-medium uppercase tracking-[0.18em] text-foreground">
            <Scale className="h-3.5 w-3.5" />
            Centro operacional dos processos
          </div>
          <div>
            <h1 className="page-title">Processos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatCount(rows.length)} processos com visão consolidada de clientes, áreas, audiências, prazos e próximos passos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportRows}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Processo
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total de processos" value={formatCount(stats.total)} description="Carteira completa cadastrada." icon={Scale} color="indigo" />
        <StatCard label="Processos ativos" value={formatCount(stats.active)} description="Em andamento ou pré-processual." icon={FolderKanban} color="emerald" />
        <StatCard label="Encerrados" value={formatCount(stats.closed)} description="Arquivados para consulta." icon={Gavel} color="slate" />
        <StatCard label="Prazos hoje" value={formatCount(stats.dueToday)} description="Exigem atenção imediata." icon={AlertTriangle} color="amber" />
        <StatCard label="Audiências próximas" value={formatCount(stats.upcomingHearings)} description="Próximos 7 dias." icon={CalendarClock} color="sky" />
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Buscar por CNJ, cliente, parte contrária, responsável, área ou tribunal"
              />
            </div>

            <div className="inline-flex items-center rounded-md border border-border/70 bg-background p-1">
              <Button type="button" size="sm" variant={view === 'table' ? 'default' : 'ghost'} onClick={() => setView('table')}>
                <TableProperties className="mr-2 h-4 w-4" />
                Tabela
              </Button>
              <Button type="button" size="sm" variant={view === 'cards' ? 'default' : 'ghost'} onClick={() => setView('cards')}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Cards
              </Button>
            </div>

            <Button type="button" variant="ghost" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="finalizado">Encerrado</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger><SelectValue placeholder="Fase" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                <SelectItem value="conhecimento">Conhecimento</SelectItem>
                <SelectItem value="recursal">Recurso</SelectItem>
                <SelectItem value="execucao">Execucao</SelectItem>
                <SelectItem value="cumprimento">Cumprimento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {areaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {responsibleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {String(client.name || client.full_name || client.razao_social || 'Cliente')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
              <SelectTrigger><SelectValue placeholder="Probabilidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as probabilidades</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Com audiência próxima</p>
                <p className="text-xs text-muted-foreground">Hoje ou nos próximos 7 dias.</p>
              </div>
              <Switch checked={hearingFilter} onCheckedChange={setHearingFilter} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Com prazo próximo</p>
                <p className="text-xs text-muted-foreground">Hoje, vencido ou nos próximos 3 dias.</p>
              </div>
              <Switch checked={deadlineFilter} onCheckedChange={setDeadlineFilter} />
            </div>

            <div className="rounded-lg border border-dashed border-border/70 px-4 py-3">
              <p className="text-sm font-medium text-foreground">{formatCount(filteredRows.length)} resultados</p>
              <p className="text-xs text-muted-foreground">Filtros combináveis para localizar o processo certo com rapidez.</p>
            </div>
          </div>
        </div>
      </div>

      {view === 'table' ? (
        <Card className="overflow-hidden border-border/60 shadow-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg">Painel operacional dos processos</CardTitle>
            <CardDescription>
              Visualize status, fase, responsável, valor, próxima audiência, próximo prazo e navegue direto para cada módulo do processo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-8">
                <EmptyState title="Nenhum processo encontrado" description="Ajuste os filtros ou cadastre um novo processo para iniciar a gestão jurídica." />
              </div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <Table className="table-fixed min-w-[1480px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[220px]">Nº CNJ</TableHead>
                      <TableHead className="w-[200px]">Cliente</TableHead>
                      <TableHead className="w-[170px]">Parte contrária</TableHead>
                      <TableHead className="w-[180px]">Vara / Tribunal</TableHead>
                      <TableHead className="w-[150px]">Área</TableHead>
                      <TableHead className="w-[150px]">Fase</TableHead>
                      <TableHead className="w-[170px]">Responsável</TableHead>
                      <TableHead className="w-[110px] text-right">Valor</TableHead>
                      <TableHead className="w-[120px]">Probabilidade</TableHead>
                      <TableHead className="w-[150px]">Próxima audiência</TableHead>
                      <TableHead className="w-[150px]">Próximo prazo</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="sticky right-0 z-20 w-[72px] bg-background shadow-[-12px_0_18px_-18px_hsl(var(--foreground)/0.35)]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((row) => (
                      <ProcessTableRow
                        key={row.id}
                        row={row}
                        onOpen={() => navigate(`/app/processos/${row.id}`)}
                        onEdit={() => openEdit(row)}
                        onOpenAgenda={() => navigate(`/app/agenda?q=${encodeURIComponent(row.cnj || row.clientName || row.defendant || '')}`)}
                        onOpenDocuments={() => navigate(`/app/processos/${row.id}?tab=documents`)}
                        onOpenDeadlines={() => navigate(`/app/processos/${row.id}?tab=deadlines`)}
                        onOpenHearings={() => navigate(`/app/processos/${row.id}?tab=hearings`)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}

          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-muted" />)
          ) : filteredRows.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="p-8">
                <EmptyState title="Nenhum processo para exibir" description="Experimente limpar os filtros ou criar um novo processo para alimentar o painel." />
              </CardContent>
            </Card>
          ) : (
            pagedRows.map((row) => (
              <ProcessCard
                key={row.id}
                row={row}
                onOpen={() => navigate(`/app/processos/${row.id}`)}
                onEdit={() => openEdit(row)}
                onOpenAgenda={() => navigate(`/app/agenda?q=${encodeURIComponent(row.cnj || row.clientName || row.defendant || '')}`)}
                onOpenDocuments={() => navigate(`/app/processos/${row.id}?tab=documents`)}
                onOpenDeadlines={() => navigate(`/app/processos/${row.id}?tab=deadlines`)}
                onOpenHearings={() => navigate(`/app/processos/${row.id}?tab=hearings`)}
              />
            ))
          )}
        </div>
      )}

      {view === 'cards' && totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-4 py-3">
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button>
          </div>
        </div>
      ) : null}

      {false ? (
      <Dialog open={dialogOpen} onOpenChange={(nextOpen) => (!nextOpen ? closeDialog() : setDialogOpen(true))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingProcessId ? 'Editar processo' : 'Novo processo'}</DialogTitle>
            <DialogDescription>
              Centralize CNJ, cliente, área, foro, risco e responsável principal para transformar o processo em ponto de entrada para agenda, documentos, prazos e audiências.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nº CNJ</Label>
              <Input value={form.cnj} onChange={(event) => setForm((current) => ({ ...current, cnj: event.target.value }))} placeholder="0000000-00.0000.0.00.0000" />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.client || '__none'} onValueChange={(value) => setForm((current) => ({ ...current, client: value === '__none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Sem cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {String(client.name || client.full_name || client.razao_social || 'Cliente')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Parte contrária</Label>
              <Input value={form.defendant} onChange={(event) => setForm((current) => ({ ...current, defendant: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Advogado responsável</Label>
              <Select value={form.responsibleId || '__none'} onValueChange={(value) => setForm((current) => ({ ...current, responsibleId: value === '__none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Definir depois" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Definir depois</SelectItem>
                  {responsibleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Área</Label>
              <Select value={form.area} onValueChange={(value) => setForm((current) => ({ ...current, area: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {areaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Classe</Label>
              <Input value={form.class_name} onChange={(event) => setForm((current) => ({ ...current, class_name: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Tribunal</Label>
              <Input value={form.court} onChange={(event) => setForm((current) => ({ ...current, court: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Vara</Label>
              <Input value={form.court_division} onChange={(event) => setForm((current) => ({ ...current, court_division: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Fase</Label>
              <Select value={form.phase} onValueChange={(value) => setForm((current) => ({ ...current, phase: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conhecimento">Conhecimento</SelectItem>
                  <SelectItem value="recursal">Recursal</SelectItem>
                  <SelectItem value="execucao">Execucao</SelectItem>
                  <SelectItem value="cumprimento">Cumprimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_processual">Pre-processual</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Probabilidade de êxito</Label>
              <Select value={form.probability} onValueChange={(value) => setForm((current) => ({ ...current, probability: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor da causa</Label>
              <Input type="number" step="0.01" value={form.cause_value} onChange={(event) => setForm((current) => ({ ...current, cause_value: event.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Polo ativo</Label>
              <Input value={form.plaintiff} onChange={(event) => setForm((current) => ({ ...current, plaintiff: event.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={4} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="button" onClick={() => undefined} disabled={createProcess.isPending || updateProcess.isPending}>
                {createProcess.isPending || updateProcess.isPending ? 'Salvando...' : editingProcessId ? 'Salvar alterações' : 'Criar processo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      ) : null}

      <ProcessEditModal
        open={dialogOpen}
        mode={editingProcessId ? 'edit' : 'create'}
        processId={editingProcessId}
        process={editingProcess}
        defaultArea={areaOptions[0]?.value || 'civel'}
        seedCnj={dialogSeedCnj}
        clients={clients.map((client) => ({
          value: client.id,
          label: String(client.name || client.full_name || client.razao_social || 'Cliente'),
        }))}
        employees={responsibleOptions}
        areas={areaOptions}
        isSubmitting={createProcess.isPending || updateProcess.isPending}
        onOpenChange={(nextOpen) => (nextOpen ? setDialogOpen(true) : closeDialog())}
        onSave={saveProcess}
      />
    </div>
  );
}


function ProcessTableRow({
  row,
  onOpen,
  onEdit,
  onOpenAgenda,
  onOpenDocuments,
  onOpenDeadlines,
  onOpenHearings,
}: {
  row: EnrichedProcess;
  onOpen: () => void;
  onEdit: () => void;
  onOpenAgenda: () => void;
  onOpenDocuments: () => void;
  onOpenDeadlines: () => void;
  onOpenHearings: () => void;
}) {
  const AreaIcon = row.areaIcon;
  const hasAttention = row.deadlineOverdue || row.deadlineToday || row.deadlineSoon || row.hearingToday || row.hearingSoon;
  const stickyCellToneClass = row.deadlineOverdue ? 'bg-red-50/60' : hasAttention ? 'bg-amber-50/50' : 'bg-background';

  return (
    <TableRow
      className={cn(
        'group',
        hasAttention && 'bg-amber-50/50',
        row.deadlineOverdue && 'bg-red-50/60',
      )}
    >
      <TableCell className="align-top">
        <button type="button" onClick={onOpen} className="w-full text-left">
          <p className="break-all font-mono text-[13px] font-semibold leading-5 text-foreground">{row.cnj || '-'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {row.deadlineOverdue ? <AlertPill icon={Flame} label="Prazo vencido" tone="danger" /> : null}
            {row.deadlineToday ? <AlertPill icon={AlertTriangle} label="Prazo hoje" tone="warning" /> : null}
            {row.hearingToday ? <AlertPill icon={CalendarClock} label="Audiência hoje" tone="info" /> : null}
          </div>
        </button>
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-1">
          <p className="line-clamp-2 font-medium leading-5 text-foreground">{row.clientName}</p>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{row.plaintiff || 'Polo ativo não informado'}</p>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <p className="line-clamp-3 text-sm leading-5 text-foreground">{row.defendant || '-'}</p>
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm leading-5 text-foreground">{row.court_division || '-'}</p>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{row.court || 'Sem tribunal'}</p>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <span className="inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold" style={practiceAreaPillStyle(row.areaColor)}>
          <AreaIcon className="h-3.5 w-3.5" />
          <span className="truncate">{row.areaLabel}</span>
        </span>
      </TableCell>
      <TableCell className="align-top">
        <span className={cn('inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-semibold capitalize', processPhaseBadgeClass(row.phase))}>
          {processPhaseLabel(row.phase)}
        </span>
      </TableCell>
      <TableCell className="align-top">
        <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground">{row.responsibleName}</p>
      </TableCell>
      <TableCell className="align-top text-right font-medium whitespace-nowrap">{formatCurrency(row.cause_value)}</TableCell>
      <TableCell className="align-top">
        <StatusBadge text={row.probability || '-'} variant={probExitoVariant(row.probability || undefined)} />
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-1">
          <p className="text-sm leading-5">{formatDateTime(row.nextHearing?.hearing_date)}</p>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{row.nextHearing?.type || (row.hearingSoon ? 'Audiência próxima' : 'Sem audiência')}</p>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-1">
          <p className="text-sm leading-5">{formatDateTime(row.nextDeadline?.due_date)}</p>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{row.nextDeadline?.description || (row.deadlineSoon ? 'Prazo próximo' : 'Sem prazo')}</p>
        </div>
      </TableCell>
      <TableCell className="align-top">
        <StatusBadge text={(row.status || '-').replaceAll('_', ' ')} variant={processStatusVariant(row.status || undefined)} />
      </TableCell>
      <TableCell
        className={cn(
          'sticky right-0 z-10 align-top border-l border-border/70 shadow-[-12px_0_18px_-18px_hsl(var(--foreground)/0.35)] group-hover:bg-muted/50',
          stickyCellToneClass,
        )}
      >
        <ProcessQuickActions
          onOpen={onOpen}
          onEdit={onEdit}
          onOpenAgenda={onOpenAgenda}
          onOpenDocuments={onOpenDocuments}
          onOpenDeadlines={onOpenDeadlines}
          onOpenHearings={onOpenHearings}
        />
      </TableCell>
    </TableRow>
  );
}

function ProcessCard({
  row,
  onOpen,
  onEdit,
  onOpenAgenda,
  onOpenDocuments,
  onOpenDeadlines,
  onOpenHearings,
}: {
  row: EnrichedProcess;
  onOpen: () => void;
  onEdit: () => void;
  onOpenAgenda: () => void;
  onOpenDocuments: () => void;
  onOpenDeadlines: () => void;
  onOpenHearings: () => void;
}) {
  const AreaIcon = row.areaIcon;

  return (
    <Card className={cn('border-border/60 shadow-card', row.deadlineOverdue && 'border-red-200 bg-red-50/40', !row.deadlineOverdue && row.deadlineSoon && 'border-amber-200 bg-amber-50/30')}>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="font-mono text-xs font-semibold text-muted-foreground">{row.cnj || 'CNJ não informado'}</p>
            <p className="text-lg font-semibold text-foreground">{row.clientName}</p>
            <p className="text-sm text-muted-foreground">{row.defendant || 'Parte contrária não informada'}</p>
          </div>
          <StatusBadge text={(row.status || '-').replaceAll('_', ' ')} variant={processStatusVariant(row.status || undefined)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold" style={practiceAreaPillStyle(row.areaColor)}>
            <AreaIcon className="h-3.5 w-3.5" />
            {row.areaLabel}
          </span>
          <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize', processPhaseBadgeClass(row.phase))}>
            {processPhaseLabel(row.phase)}
          </span>
          <StatusBadge text={row.probability || '-'} variant={probExitoVariant(row.probability || undefined)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoMini label="Tribunal / Vara" value={[row.court_division, row.court].filter(Boolean).join(' • ') || '-'} />
          <InfoMini label="Responsável" value={row.responsibleName} />
          <InfoMini label="Valor da causa" value={formatCurrency(row.cause_value)} />
          <InfoMini label="Classe" value={row.class_name || '-'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <AlertBlock label="Próxima audiência" value={formatDateTime(row.nextHearing?.hearing_date)} description={row.nextHearing?.type || 'Sem audiência agendada'} tone={row.hearingToday ? 'info' : row.hearingSoon ? 'warning' : 'neutral'} />
          <AlertBlock label="Próximo prazo" value={formatDateTime(row.nextDeadline?.due_date)} description={row.nextDeadline?.description || 'Sem prazo vinculado'} tone={row.deadlineOverdue ? 'danger' : row.deadlineToday || row.deadlineSoon ? 'warning' : 'neutral'} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onOpen}><Eye className="mr-2 h-4 w-4" />Abrir</Button>
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
          <Button size="sm" variant="ghost" onClick={onOpenAgenda}>Agenda</Button>
          <Button size="sm" variant="ghost" onClick={onOpenDocuments}>Documentos</Button>
          <Button size="sm" variant="ghost" onClick={onOpenDeadlines}>Prazos</Button>
          <Button size="sm" variant="ghost" onClick={onOpenHearings}>Audiências</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessQuickActions({
  onOpen,
  onEdit,
  onOpenAgenda,
  onOpenDocuments,
  onOpenDeadlines,
  onOpenHearings,
}: {
  onOpen: () => void;
  onEdit: () => void;
  onOpenAgenda: () => void;
  onOpenDocuments: () => void;
  onOpenDeadlines: () => void;
  onOpenHearings: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onOpen}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenAgenda}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Abrir agenda
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenDocuments}>
          <FileText className="mr-2 h-4 w-4" />
          Abrir documentos
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenDeadlines}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Abrir prazos
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onOpenHearings}>
          <Gavel className="mr-2 h-4 w-4" />
          Abrir audiências
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AlertPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof AlertTriangle;
  label: string;
  tone: 'danger' | 'warning' | 'info';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-sky-200 bg-sky-50 text-sky-700';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold', toneClass)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function InfoMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function AlertBlock({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: 'neutral' | 'warning' | 'danger' | 'info';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50/60'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50/60'
        : tone === 'info'
          ? 'border-sky-200 bg-sky-50/60'
          : 'border-border/70 bg-muted/20';

  return (
    <div className={cn('rounded-xl border p-3', toneClass)}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
