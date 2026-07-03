import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, format, parseISO, setMonth, setYear, subDays, subMonths } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/contexts/TenantContext';
import { api, apiGetAllPages } from '@/integrations/api/client';
import { deleteWorkspaceStateItem, loadWorkspaceStateMap, saveWorkspaceStateItem } from '@/services/workspaceState';
import { AgendaCalendarGrid } from './agenda/AgendaCalendarGrid';
import { AgendaEventDetailsSheet } from './agenda/AgendaEventDetailsSheet';
import { AgendaEventFormDialog } from './agenda/AgendaEventFormDialog';
import { AgendaFilters } from './agenda/AgendaFilters';
import type {
  AgendaClientLookup,
  AgendaEvent,
  AgendaEventFormState,
  AgendaEventMeta,
  AgendaFiltersState,
  AgendaProcessLookup,
  AgendaResponsibleLookup,
  AgendaView,
  CalendarFeedItem,
} from './agenda/types';
import { AGENDA_EVENT_TYPE_META, AGENDA_VIEW_OPTIONS, DEFAULT_AGENDA_FILTERS } from './agenda/types';
import {
  agendaEventToForm,
  buildAgendaClientLookups,
  buildAgendaEventFromFeedItem,
  buildAgendaEventPayload,
  buildAgendaMetaFromForm,
  buildAgendaProcessLookups,
  buildFallbackClients,
  buildFallbackProcesses,
  buildFallbackResponsibles,
  buildInitialAgendaForm,
  buildMockAgendaEvents,
  cloneAgendaForm,
  filterAgendaEvents,
  formatAgendaEventDateRange,
  formatAgendaEventTimeLabel,
  formatDayLabel,
  getCalendarPeriodLabel,
  getMonthOptions,
  getViewInterval,
  getYearOptions,
  groupAgendaEventsByDay,
  isDeadlineSoon,
  isEventOverdue,
  isTodayEvent,
  sortAgendaEvents,
} from './agenda/utils';

function uniqueById<T extends { id: string }>(items: T[]) {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
}

function toProcessLookup(raw: any): AgendaProcessLookup {
  const responsaveis = Array.isArray(raw?.responsaveis)
    ? raw.responsaveis
        .map((responsavel: any) => ({
          id: responsavel?.id ? String(responsavel.id) : undefined,
          name: String(responsavel?.name || responsavel?.full_name || '').trim(),
        }))
        .filter((responsavel: { name: string }) => responsavel.name)
    : [];

  return {
    id: String(raw?.id || ''),
    cnj: raw?.cnj || null,
    subject: raw?.class_name || raw?.subject || raw?.classe || null,
    client_name:
      raw?.client_name ||
      raw?.cliente_nome ||
      raw?.client?.name ||
      raw?.client_display ||
      raw?.client_label ||
      null,
    tribunal: raw?.tribunal || raw?.court || null,
    vara: raw?.vara || raw?.court_division || null,
    comarca: raw?.comarca || raw?.district || null,
    responsaveis,
  };
}

function toClientLookup(raw: any): AgendaClientLookup {
  return {
    id: String(raw?.id || ''),
    name: String(raw?.name || raw?.full_name || raw?.razao_social || 'Cliente').trim(),
  };
}

function AgendaStatCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string | number;
  description: string;
  tone: 'default' | 'warning' | 'danger' | 'success';
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: 'bg-accent/45 border-gold/20',
    warning: 'bg-warning/10 border-warning/20',
    danger: 'bg-destructive/5 border-destructive/20',
    success: 'bg-success/10 border-success/20',
  };

  return (
    <Card className="overflow-hidden border-border shadow-card">
      <CardContent className={`border-t-2 p-5 ${toneClasses[tone]}`}>
        <p className="kpi-label">{title}</p>
        <p className="mt-3 font-display text-[2.15rem] font-semibold leading-none text-foreground">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function AgendaLoadingState() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-10 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="h-[170px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function AgendaDayPanel({
  date,
  events,
  onOpenEvent,
  onCreate,
}: {
  date: Date;
  events: AgendaEvent[];
  onOpenEvent: (event: AgendaEvent) => void;
  onCreate: (date: Date) => void;
}) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="border-b bg-surface-2/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Dia em foco</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{formatDayLabel(date)}</p>
          </div>
          <Button size="sm" onClick={() => onCreate(date)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {events.length === 0 ? (
          <EmptyState
            title="Sem compromissos nesta data"
            description="Use a agenda para registrar reuniões, audiências, prazos e tarefas vinculadas ao escritório."
            action={{ label: 'Criar evento', onClick: () => onCreate(date) }}
          />
        ) : (
          events.map((event) => {
            const typeMeta = AGENDA_EVENT_TYPE_META[event.type];

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onOpenEvent(event)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-card"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ backgroundColor: typeMeta.surface, color: typeMeta.color }}
                  >
                    {typeMeta.label}
                  </span>
                  <StatusBadge variant={isEventOverdue(event) ? 'destructive' : isDeadlineSoon(event) ? 'warning' : 'info'} dot={false}>
                    {event.status}
                  </StatusBadge>
                </div>

                <p className="mt-3 text-base font-semibold">{event.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatAgendaEventDateRange(event)}</p>

                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  {event.clientName ? <p>Cliente: {event.clientName}</p> : null}
                  {event.processNumber ? <p>Processo: {event.processNumber}</p> : null}
                  {event.responsibleName ? <p>Responsável: {event.responsibleName}</p> : null}
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function AgendaAttentionPanel({ events }: { events: AgendaEvent[] }) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="border-b bg-surface-2/40">
        <CardTitle className="text-lg">Atenção jurídica</CardTitle>
        <p className="text-sm text-muted-foreground">Itens que exigem leitura imediata da equipe.</p>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Nenhum item crítico no período atual.
          </div>
        ) : (
          events.slice(0, 5).map((event) => {
            const meta = AGENDA_EVENT_TYPE_META[event.type];
            const danger = isEventOverdue(event);
            const soon = isDeadlineSoon(event);

            return (
              <div
                key={event.id}
                className="rounded-lg border p-4"
                style={{ borderColor: danger || soon ? meta.border : 'hsl(var(--border))', backgroundColor: meta.surface }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{formatAgendaEventTimeLabel(event)}</p>
                  </div>
                  {danger ? (
                    <StatusBadge variant="destructive" dot={false}>
                      Atrasado
                    </StatusBadge>
                  ) : soon ? (
                    <StatusBadge variant="warning" dot={false}>
                      Próximo
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="info" dot={false}>
                      {event.status}
                    </StatusBadge>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {event.processNumber ? <p>Processo: {event.processNumber}</p> : null}
                  {event.clientName ? <p>Cliente: {event.clientName}</p> : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function AgendaListView({ events, onOpenEvent }: { events: AgendaEvent[]; onOpenEvent: (event: AgendaEvent) => void }) {
  const grouped = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();

    events.forEach((event) => {
      const key = format(parseISO(event.startAt), 'yyyy-MM-dd');
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    });

    return Array.from(map.entries()).map(([key, dayEvents]) => ({
      key,
      label: formatDayLabel(parseISO(`${key}T12:00:00`)),
      events: sortAgendaEvents(dayEvents),
    }));
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8">
        <EmptyState
          title="Nenhum evento na lista"
          description="Ajuste filtros ou cadastre novos compromissos para visualizar a agenda em formato de lista."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <div key={group.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
            <p className="text-xs text-muted-foreground">{group.events.length} compromisso(s)</p>
          </div>

          <div className="space-y-3">
            {group.events.map((event) => {
              const meta = AGENDA_EVENT_TYPE_META[event.type];

              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onOpenEvent(event)}
                  className="w-full rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:shadow-card"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                          style={{ backgroundColor: meta.surface, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <StatusBadge variant={isEventOverdue(event) ? 'destructive' : 'info'} dot={false}>
                          {event.status}
                        </StatusBadge>
                      </div>

                      <div>
                        <p className="text-base font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{formatAgendaEventDateRange(event)}</p>
                      </div>
                    </div>

                    <div className="grid gap-1 text-sm text-muted-foreground lg:text-right">
                      {event.clientName ? <p>{event.clientName}</p> : null}
                      {event.processNumber ? <p>{event.processNumber}</p> : null}
                      {event.responsibleName ? <p>{event.responsibleName}</p> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgendaDayTimeline({ date, events, onOpenEvent }: { date: Date; events: AgendaEvent[]; onOpenEvent: (event: AgendaEvent) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Visão diária</p>
        <h3 className="mt-1 text-xl font-semibold capitalize">{formatDayLabel(date)}</h3>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8">
          <EmptyState
            title="Nenhum evento neste dia"
            description="Selecione outra data ou crie um compromisso jurídico para preencher esta agenda."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const meta = AGENDA_EVENT_TYPE_META[event.type];

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onOpenEvent(event)}
                className="grid w-full gap-4 rounded-lg border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:shadow-card md:grid-cols-[110px_minmax(0,1fr)]"
              >
                <div className="rounded-lg px-4 py-3 text-center" style={{ backgroundColor: meta.surface }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: meta.color }}>
                    Horário
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatAgendaEventTimeLabel(event)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                      style={{ backgroundColor: meta.surface, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <StatusBadge variant={isEventOverdue(event) ? 'destructive' : 'info'} dot={false}>
                      {event.status}
                    </StatusBadge>
                  </div>

                  <div>
                    <p className="text-base font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.description || 'Compromisso jurídico sem descrição complementar.'}</p>
                  </div>

                  <div className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                    {event.location ? <p>Local: {event.location}</p> : null}
                    {event.clientName ? <p>Cliente: {event.clientName}</p> : null}
                    {event.processNumber ? <p>Processo: {event.processNumber}</p> : null}
                    {event.responsibleName ? <p>Responsável: {event.responsibleName}</p> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatMonthHeader(date: Date) {
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  const year = date.toLocaleDateString('pt-BR', { year: 'numeric' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} . ${year}`;
}

export default function AgendaPage() {
  const qc = useQueryClient();
  const { activeTenantId } = useTenant();
  const [searchParams] = useSearchParams();
  const seededSearch = searchParams.get('q') || '';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<AgendaView>('month');
  const [searchTerm, setSearchTerm] = useState(seededSearch);
  const [filters, setFilters] = useState<AgendaFiltersState>(DEFAULT_AGENDA_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [form, setForm] = useState<AgendaEventFormState>(() => buildInitialAgendaForm(new Date()));
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [detailsEventId, setDetailsEventId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [metaMap, setMetaMap] = useState<Record<string, AgendaEventMeta>>({});

  const metaQuery = useQuery({
    queryKey: ['workspace-state', 'agenda_meta', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<AgendaEventMeta>('agenda_meta'),
  });

  useEffect(() => {
    setSearchTerm(seededSearch);
  }, [seededSearch]);

  useEffect(() => {
    setMetaMap(metaQuery.data ?? {});
  }, [metaQuery.data]);

  const interval = useMemo(() => getViewInterval(view, currentDate), [view, currentDate]);

  const feedQuery = useQuery({
    queryKey: ['calendar-feed', activeTenantId, view, format(interval.start, 'yyyy-MM-dd'), format(interval.end, 'yyyy-MM-dd')],
    enabled: !!activeTenantId,
    queryFn: () =>
      api.get<CalendarFeedItem[]>('/calendar/events/feed/', {
        start: interval.start.toISOString(),
        end: addDays(interval.end, 1).toISOString(),
      }),
  });

  const processesQuery = useQuery({
    queryKey: ['agenda-processes', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<any>('/processes/'),
  });

  const clientsQuery = useQuery({
    queryKey: ['agenda-clients', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<any>('/clients/'),
  });

  const processes = useMemo(() => {
    const live = (processesQuery.data ?? []).map(toProcessLookup).filter((process) => process.id);
    return live.length ? uniqueById(live) : buildFallbackProcesses();
  }, [processesQuery.data]);

  const clients = useMemo(() => {
    const live = (clientsQuery.data ?? []).map(toClientLookup).filter((client) => client.id);
    return live.length ? uniqueById(live) : buildFallbackClients();
  }, [clientsQuery.data]);

  const responsibles = useMemo(() => {
    const base = buildFallbackResponsibles();
    const fromProcesses = processes.flatMap((process) =>
      (process.responsaveis ?? []).map((responsavel) => ({
        id: responsavel.id || responsavel.name,
        name: responsavel.name,
      })),
    );
    return uniqueById([...base, ...fromProcesses].filter((item) => item.id && item.name)) as AgendaResponsibleLookup[];
  }, [processes]);

  const processById = useMemo(() => buildAgendaProcessLookups(processes), [processes]);
  const clientById = useMemo(() => buildAgendaClientLookups(clients), [clients]);

  const backendEvents = useMemo(() => {
    const items = feedQuery.data ?? [];
    return items.map((item) => buildAgendaEventFromFeedItem(item, { processById, clientById }, metaMap[item.id]));
  }, [clientById, feedQuery.data, metaMap, processById]);

  const mockEvents = useMemo(() => {
    if ((feedQuery.data ?? []).length > 0) return [] as AgendaEvent[];
    return buildMockAgendaEvents(currentDate, { processes, clients, responsibles });
  }, [clients, currentDate, feedQuery.data, processes, responsibles]);

  const allEvents = useMemo(() => sortAgendaEvents([...backendEvents, ...mockEvents]), [backendEvents, mockEvents]);

  const filteredEvents = useMemo(
    () => filterAgendaEvents(allEvents, searchTerm, filters, currentDate, responsibles[0]?.name || 'Dr. Carlos Silva'),
    [allEvents, currentDate, filters, responsibles, searchTerm],
  );

  const eventsByDay = useMemo(() => groupAgendaEventsByDay(filteredEvents), [filteredEvents]);
  const detailsEvent = useMemo(() => allEvents.find((event) => event.id === detailsEventId) || null, [allEvents, detailsEventId]);
  const deleteTarget = useMemo(() => allEvents.find((event) => event.id === deleteTargetId) || null, [allEvents, deleteTargetId]);
  const editingEvent = useMemo(() => allEvents.find((event) => event.id === editingEventId) || null, [allEvents, editingEventId]);

  const selectedDayEvents = useMemo(() => {
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDay.get(key) ?? [];
  }, [eventsByDay, selectedDate]);

  const currentDayEvents = useMemo(() => {
    const key = format(currentDate, 'yyyy-MM-dd');
    return eventsByDay.get(key) ?? [];
  }, [currentDate, eventsByDay]);

  const criticalEvents = useMemo(
    () =>
      filteredEvents.filter((event) => isEventOverdue(event) || isDeadlineSoon(event) || (event.type === 'AUDIENCIA' && isTodayEvent(event))),
    [filteredEvents],
  );

  const stats = useMemo(() => {
    const todayEvents = allEvents.filter((event) => isTodayEvent(event));
    const soonDeadlines = allEvents.filter((event) => isDeadlineSoon(event));
    const overdue = allEvents.filter((event) => isEventOverdue(event));
    const hearingsToday = allEvents.filter((event) => event.type === 'AUDIENCIA' && isTodayEvent(event));

    return {
      todayEvents: todayEvents.length,
      soonDeadlines: soonDeadlines.length,
      overdue: overdue.length,
      hearingsToday: hearingsToday.length,
    };
  }, [allEvents]);

  const updateMetaMap = async (eventId: string, partial: AgendaEventMeta | null) => {
    let nextMap: Record<string, AgendaEventMeta> = {};
    let nextPayload: AgendaEventMeta | null = null;
    setMetaMap((current) => {
      nextMap = { ...current };
      if (partial === null) {
        delete nextMap[eventId];
      } else {
        nextPayload = { ...(current[eventId] ?? {}), ...partial, updatedAt: new Date().toISOString() };
        nextMap[eventId] = nextPayload;
      }
      return nextMap;
    });

    if (partial === null) {
      await deleteWorkspaceStateItem('agenda_meta', eventId);
    } else if (nextPayload) {
      await saveWorkspaceStateItem('agenda_meta', eventId, nextPayload);
    }

    qc.setQueryData(['workspace-state', 'agenda_meta', activeTenantId], nextMap);
  };

  const openCreateDialog = (date: Date) => {
    setEditingEventId(null);
    setFormMode('create');
    setForm(buildInitialAgendaForm(date));
    setSelectedDate(date);
    setFormOpen(true);
  };

  const openEditDialog = (event: AgendaEvent) => {
    setEditingEventId(event.id);
    setFormMode('edit');
    setForm(agendaEventToForm(event));
    setFormOpen(true);
  };

  const openDuplicateDialog = (event: AgendaEvent) => {
    setEditingEventId(null);
    setFormMode('duplicate');
    setForm(cloneAgendaForm(agendaEventToForm(event)));
    setFormOpen(true);
  };

  const handleOpenDetails = (event: AgendaEvent) => {
    setDetailsEventId(event.id);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ createAnother }: { createAnother: boolean }) => {
      if (!activeTenantId) throw new Error('Selecione um escritório antes de salvar o evento.');

      const payload = buildAgendaEventPayload(form);

      if (formMode === 'edit' && editingEvent?.editable) {
        const response = await api.patch<CalendarFeedItem>(`/calendar/events/${editingEvent.id}/`, payload);
        return { response, createAnother, savedEventId: editingEvent.id };
      }

      const response = await api.post<CalendarFeedItem>('/calendar/events/', payload);
      return { response, createAnother, savedEventId: response?.id || null };
    },
    onSuccess: async ({ response, createAnother, savedEventId }) => {
      const targetId = savedEventId || response?.id;

      if (targetId) {
        await updateMetaMap(targetId, buildAgendaMetaFromForm(form, clients, processes, responsibles));
      }

      await qc.invalidateQueries({ queryKey: ['calendar-feed'] });

      toast.success(formMode === 'edit' ? 'Evento atualizado com sucesso.' : 'Evento criado na agenda.');

      if (createAnother) {
        setEditingEventId(null);
        setFormMode('create');
        setForm(buildInitialAgendaForm(selectedDate));
        return;
      }

      setFormOpen(false);
      setEditingEventId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível salvar o evento.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) throw new Error('Evento inválido para exclusão.');
      if (!deleteTarget.deletable) throw new Error('Este evento não pode ser excluído diretamente pela agenda.');
      await api.delete(`/calendar/events/${deleteTarget.id}/`);
    },
    onSuccess: async () => {
      if (deleteTarget) {
        await updateMetaMap(deleteTarget.id, null);
      }
      await qc.invalidateQueries({ queryKey: ['calendar-feed'] });
      toast.success('Evento excluído da agenda.');
      setDeleteTargetId(null);
      setDetailsEventId(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível excluir o evento.');
    },
  });

  const handleMarkAsDone = async (event: AgendaEvent) => {
    await updateMetaMap(event.id, { status: 'REALIZADO' });
    toast.success('Evento marcado como realizado.');
  };

  const handleReschedule = (event: AgendaEvent) => {
    openEditDialog(event);
    setDetailsEventId(null);
  };

  const handleCopyLink = async (event: AgendaEvent) => {
    if (!event.videoLink) return;

    try {
      await navigator.clipboard.writeText(event.videoLink);
      toast.success('Link copiado para a área de transferência.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const goToPreviousPeriod = () => {
    if (view === 'month') {
      setCurrentDate((current) => subMonths(current, 1));
      return;
    }
    if (view === 'week' || view === 'list') {
      setCurrentDate((current) => subDays(current, view === 'week' ? 7 : 14));
      return;
    }
    const nextDate = subDays(currentDate, 1);
    setCurrentDate(nextDate);
    setSelectedDate(nextDate);
  };

  const goToNextPeriod = () => {
    if (view === 'month') {
      setCurrentDate((current) => addMonths(current, 1));
      return;
    }
    if (view === 'week' || view === 'list') {
      setCurrentDate((current) => addDays(current, view === 'week' ? 7 : 14));
      return;
    }
    const nextDate = addDays(currentDate, 1);
    setCurrentDate(nextDate);
    setSelectedDate(nextDate);
  };

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions(currentDate);
  const calendarLabel = view === 'month' ? formatMonthHeader(currentDate) : getCalendarPeriodLabel(view, currentDate);
  const isMonthView = view === 'month';
  const isCalendarGridView = view === 'month' || view === 'week';
  const viewLabels: Record<AgendaView, string> = {
    month: 'Mes',
    week: 'Semana',
    day: 'Dia',
    list: 'Lista',
  };

  return (
    <div className="page-container animate-fade-in space-y-8">
      <div className="space-y-8 border-b border-border pb-8">
        <div className="space-y-3">
          <p className="eyebrow">Painel . Agenda</p>
          <h1 className="font-display text-[3rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[3.5rem]">
            Agenda integrada
          </h1>
          <p className="hidden">
            Centralize audiências, prazos, reuniões com clientes, compromissos internos e tarefas do escritório com leitura jurídica clara e operacional.
          </p>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Anterior" className="h-11 w-11 rounded-md" onClick={goToPreviousPeriod}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-[220px] px-2 font-display text-[1.8rem] font-semibold capitalize tracking-[-0.03em] text-foreground sm:text-[2rem]">
                {calendarLabel}
              </div>

              <Button variant="outline" size="icon" aria-label="Próximo" className="h-11 w-11 rounded-md" onClick={goToNextPeriod}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-11 rounded-md px-5"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(today);
              }}
            >
              Hoje
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={view}
              onValueChange={(value) => {
                const nextView = value as AgendaView;
                setView(nextView);
                if (nextView === 'day') {
                  setCurrentDate(selectedDate);
                }
              }}
            >
              <TabsList className="gap-2 rounded-none border-0 bg-transparent p-0 shadow-none">
                {AGENDA_VIEW_OPTIONS.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="h-10 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                  >
                    {viewLabels[option.value]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {!isMonthView ? (
              <Button className="h-10 rounded-md px-4" onClick={() => openCreateDialog(selectedDate)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo evento
              </Button>
            ) : null}
          </div>
        </div>

        {!isMonthView ? (
          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[280px] flex-1 lg:max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
                placeholder="Buscar por evento, cliente, processo ou responsável"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start rounded-md">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[760px] max-w-[calc(100vw-2rem)] border-border p-5 shadow-elevated">
                <AgendaFilters
                  filters={filters}
                  onChange={setFilters}
                  onClear={() => setFilters(DEFAULT_AGENDA_FILTERS)}
                  clients={clients}
                  processes={processes}
                  responsibles={responsibles}
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : null}

        <div className="hidden">
          <div className="relative min-w-[280px] flex-1 xl:w-[320px] xl:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
              placeholder="Buscar por evento, cliente, processo ou responsável"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start rounded-md">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[760px] max-w-[calc(100vw-2rem)] border-border p-5 shadow-elevated">
              <AgendaFilters
                filters={filters}
                onChange={setFilters}
                onClear={() => setFilters(DEFAULT_AGENDA_FILTERS)}
                clients={clients}
                processes={processes}
                responsibles={responsibles}
              />
            </PopoverContent>
          </Popover>

          <Tabs
            value={view}
            onValueChange={(value) => {
              const nextView = value as AgendaView;
              setView(nextView);
              if (nextView === 'day') {
                setCurrentDate(selectedDate);
              }
            }}
          >
            <TabsList>
              {AGENDA_VIEW_OPTIONS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button onClick={() => openCreateDialog(selectedDate)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Button>
        </div>
      </div>

      <div className="hidden">
        <AgendaStatCard
          title="Compromissos de hoje"
          value={stats.todayEvents}
          description="Eventos que pedem retorno imediato da equipe nesta data."
          tone="default"
        />
        <AgendaStatCard
          title="Prazos próximos"
          value={stats.soonDeadlines}
          description="Prazos e vencimentos com janela curta para execução."
          tone="warning"
        />
        <AgendaStatCard
          title="Audiências hoje"
          value={stats.hearingsToday}
          description="Audiências agendadas para o dia atual com destaque jurídico."
          tone="success"
        />
        <AgendaStatCard
          title="Itens atrasados"
          value={stats.overdue}
          description="Eventos vencidos ou sem baixa que precisam de revisão."
          tone="danger"
        />
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border-border shadow-card">
          <CardHeader className="hidden gap-4 border-b bg-surface-2/40">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Anterior" onClick={goToPreviousPeriod}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDate(today);
                  }}
                >
                  Hoje
                </Button>
                <Button variant="outline" size="icon" aria-label="Próximo" onClick={goToNextPeriod}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-left xl:text-center">
                <CardTitle className="text-xl capitalize">{getCalendarPeriodLabel(view, currentDate)}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Navegação jurídica por período com leitura de densidade e eventos vinculados.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={String(currentDate.getMonth())} onValueChange={(value) => setCurrentDate((current) => setMonth(current, Number(value)))}>
                  <SelectTrigger className="w-[150px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(currentDate.getFullYear())} onValueChange={(value) => setCurrentDate((current) => setYear(current, Number(value)))}>
                  <SelectTrigger className="w-[110px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className={isCalendarGridView ? 'p-0' : 'p-6 sm:p-8'}>
            {feedQuery.isLoading ? (
              <div className="p-6 sm:p-8">
                <AgendaLoadingState />
              </div>
            ) : isCalendarGridView ? (
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <AgendaCalendarGrid
                    days={interval.days}
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    eventsByDay={eventsByDay}
                    onSelectDate={(date) => {
                      setSelectedDate(date);
                      if (view === 'week' || format(date, 'MM') !== format(currentDate, 'MM')) {
                        setCurrentDate(date);
                      }
                    }}
                    onEventClick={handleOpenDetails}
                    view={view}
                  />
                </div>
              </div>
            ) : view === 'day' ? (
              <AgendaDayTimeline date={currentDate} events={currentDayEvents} onOpenEvent={handleOpenDetails} />
            ) : (
              <AgendaListView events={filteredEvents} onOpenEvent={handleOpenDetails} />
            )}

            {!feedQuery.isLoading && feedQuery.isError ? (
              <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Não foi possível sincronizar o feed da agenda. A visualização continua disponível com a estrutura local do módulo.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="hidden space-y-6">
          <AgendaDayPanel date={selectedDate} events={selectedDayEvents} onOpenEvent={handleOpenDetails} onCreate={openCreateDialog} />
          <AgendaAttentionPanel events={criticalEvents} />
        </div>
      </div>

      <AgendaEventFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingEventId(null);
          }
        }}
        form={form}
        onFormChange={setForm}
        onSave={() => saveMutation.mutate({ createAnother: false })}
        onSaveAndCreateAnother={() => saveMutation.mutate({ createAnother: true })}
        isSaving={saveMutation.isPending}
        mode={formMode}
        clients={clients}
        processes={processes}
        responsibles={responsibles}
      />

      <AgendaEventDetailsSheet
        open={!!detailsEvent}
        onOpenChange={(open) => {
          if (!open) setDetailsEventId(null);
        }}
        event={detailsEvent}
        onEdit={(event) => {
          openEditDialog(event);
          setDetailsEventId(null);
        }}
        onDuplicate={(event) => {
          openDuplicateDialog(event);
          setDetailsEventId(null);
        }}
        onDeleteRequest={(event) => setDeleteTargetId(event.id)}
        onMarkAsDone={handleMarkAsDone}
        onReschedule={handleReschedule}
        onCopyLink={handleCopyLink}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o evento da agenda. Confirme apenas se o compromisso não deve mais existir no escritório.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="font-medium">{deleteTarget.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatAgendaEventDateRange(deleteTarget)}</p>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir evento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
