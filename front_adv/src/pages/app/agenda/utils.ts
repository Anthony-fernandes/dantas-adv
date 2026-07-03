import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { mockClients, mockCurrentUser, mockProcesses, mockUsers } from '@/lib/mock-data';
import type {
  AgendaClientLookup,
  AgendaEvent,
  AgendaEventFormState,
  AgendaEventMeta,
  AgendaEventPriority,
  AgendaEventStatus,
  AgendaEventType,
  AgendaFiltersState,
  AgendaProcessLookup,
  AgendaResponsibleLookup,
  AgendaView,
  CalendarFeedItem,
} from './types';
import { AGENDA_EVENT_TYPE_META, EMPTY_EVENT_FORM } from './types';

type AgendaLookups = {
  processById: Map<string, AgendaProcessLookup>;
  clientById: Map<string, AgendaClientLookup>;
};

export function normalizeText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildAgendaProcessLookups(processes: AgendaProcessLookup[]) {
  return new Map(processes.map((process) => [process.id, process]));
}

export function buildAgendaClientLookups(clients: AgendaClientLookup[]) {
  return new Map(clients.map((client) => [client.id, client]));
}

export function getMonthGridDays(currentDate: Date) {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(currentDate: Date) {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  const end = endOfWeek(currentDate, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getViewInterval(view: AgendaView, currentDate: Date) {
  if (view === 'week') {
    const days = getWeekDays(currentDate);
    return { start: startOfDay(days[0]), end: endOfDay(days[days.length - 1]), days };
  }

  if (view === 'day') {
    return { start: startOfDay(currentDate), end: endOfDay(currentDate), days: [startOfDay(currentDate)] };
  }

  if (view === 'list') {
    const start = startOfDay(currentDate);
    const end = endOfDay(addDays(currentDate, 13));
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }

  const days = getMonthGridDays(currentDate);
  return { start: startOfDay(days[0]), end: endOfDay(days[days.length - 1]), days };
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  return format(parseISO(value), "yyyy-MM-dd'T'HH:mm");
}

export function formatAgendaEventDateRange(event: Pick<AgendaEvent, 'allDay' | 'startAt' | 'endAt'>) {
  const start = parseISO(event.startAt);

  if (event.allDay) {
    if (!event.endAt) return format(start, "dd 'de' MMMM", { locale: ptBR });
    const end = parseISO(event.endAt);
    if (isSameDay(start, end)) return format(start, "dd 'de' MMMM", { locale: ptBR });
    return `${format(start, 'dd/MM/yyyy')} ate ${format(end, 'dd/MM/yyyy')}`;
  }

  if (!event.endAt) return format(start, "dd/MM/yyyy 'as' HH:mm");

  const end = parseISO(event.endAt);
  if (isSameDay(start, end)) {
    return `${format(start, "dd/MM/yyyy 'das' HH:mm")} as ${format(end, 'HH:mm')}`;
  }

  return `${format(start, 'dd/MM/yyyy HH:mm')} - ${format(end, 'dd/MM/yyyy HH:mm')}`;
}

export function formatAgendaEventTimeLabel(event: Pick<AgendaEvent, 'allDay' | 'startAt' | 'endAt'>) {
  const start = parseISO(event.startAt);

  if (event.allDay) return 'Dia inteiro';
  if (!event.endAt) return format(start, 'HH:mm');

  const end = parseISO(event.endAt);
  if (isSameDay(start, end)) return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  return `${format(start, 'dd/MM HH:mm')} - ${format(end, 'dd/MM HH:mm')}`;
}

export function formatDayLabel(date: Date) {
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

export function getCalendarPeriodLabel(view: AgendaView, currentDate: Date) {
  if (view === 'day') {
    return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  if (view === 'week') {
    const days = getWeekDays(currentDate);
    return `${format(days[0], 'dd MMM', { locale: ptBR })} - ${format(days[6], 'dd MMM yyyy', { locale: ptBR })}`;
  }

  if (view === 'list') {
    const end = addDays(currentDate, 13);
    return `${format(currentDate, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
  }

  return format(currentDate, 'MMMM yyyy', { locale: ptBR });
}

export function getMonthOptions() {
  return Array.from({ length: 12 }, (_, index) => ({
    value: String(index),
    label: format(new Date(2026, index, 1), 'MMMM', { locale: ptBR }),
  }));
}

export function getYearOptions(baseDate: Date) {
  const currentYear = baseDate.getFullYear();
  return Array.from({ length: 7 }, (_, index) => String(currentYear - 3 + index));
}

function normalizeAgendaStatus(value?: string | null): AgendaEventStatus {
  const normalized = normalizeText(value).replace(/_/g, ' ');
  const mapping: Record<string, AgendaEventStatus> = {
    agendado: 'AGENDADO',
    agendada: 'AGENDADO',
    confirmado: 'CONFIRMADO',
    confirmada: 'CONFIRMADO',
    pendente: 'PENDENTE',
    realizado: 'REALIZADO',
    realizada: 'REALIZADO',
    concluido: 'REALIZADO',
    concluida: 'REALIZADO',
    cancelado: 'CANCELADO',
    cancelada: 'CANCELADO',
    remarcado: 'REMARCADO',
    remarcada: 'REMARCADO',
    redesignada: 'REMARCADO',
    redesignado: 'REMARCADO',
    atrasado: 'ATRASADO',
    vencido: 'ATRASADO',
    vencida: 'ATRASADO',
  };

  return mapping[normalized] || 'AGENDADO';
}

function normalizeAgendaPriority(value?: string | null, type?: AgendaEventType): AgendaEventPriority {
  const normalized = normalizeText(value);
  const mapping: Record<string, AgendaEventPriority> = {
    baixa: 'BAIXA',
    media: 'MEDIA',
    alta: 'ALTA',
    urgente: 'URGENTE',
  };

  if (mapping[normalized]) return mapping[normalized];
  if (type === 'AUDIENCIA') return 'ALTA';
  if (type === 'PRAZO_PROCESSUAL' || type === 'VENCIMENTO') return 'URGENTE';
  return 'MEDIA';
}

export function isDeadlineType(type: AgendaEventType) {
  return type === 'PRAZO_PROCESSUAL' || type === 'VENCIMENTO' || type === 'PROTOCOLO';
}

function inferAgendaType(item: CalendarFeedItem, meta?: AgendaEventMeta): AgendaEventType {
  if (meta?.type) return meta.type;
  if (item.source === 'hearing') return 'AUDIENCIA';

  const haystack = normalizeText(`${item.kind} ${item.title} ${item.description || ''}`);
  if (haystack.includes('prazo')) return 'PRAZO_PROCESSUAL';
  if (haystack.includes('vencimento')) return 'VENCIMENTO';
  if (haystack.includes('reuniao interna')) return 'REUNIAO_INTERNA';
  if (haystack.includes('reuniao') || haystack.includes('cliente')) return 'REUNIAO_CLIENTE';
  if (haystack.includes('protocolo') || haystack.includes('peticao')) return 'PROTOCOLO';
  if (haystack.includes('consulta')) return 'CONSULTA';
  if (haystack.includes('lembrete')) return 'LEMBRETE';
  if (haystack.includes('tarefa')) return 'TAREFA';
  return 'COMPROMISSO';
}

export function sortAgendaEvents(events: AgendaEvent[]) {
  return [...events].sort((left, right) => {
    const startCompare = new Date(left.startAt).getTime() - new Date(right.startAt).getTime();
    if (startCompare !== 0) return startCompare;

    const priorityWeight: Record<AgendaEventPriority, number> = {
      URGENTE: 0,
      ALTA: 1,
      MEDIA: 2,
      BAIXA: 3,
    };

    return priorityWeight[left.priority] - priorityWeight[right.priority];
  });
}

export function groupAgendaEventsByDay(events: AgendaEvent[]) {
  const map = new Map<string, AgendaEvent[]>();

  events.forEach((event) => {
    const start = parseISO(event.startAt);
    const rawEnd = event.endAt ? parseISO(event.endAt) : start;
    const end = rawEnd >= start ? rawEnd : start;

    eachDayOfInterval({ start: startOfDay(start), end: startOfDay(end) }).forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const current = map.get(key) ?? [];
      current.push(event);
      map.set(key, current);
    });
  });

  map.forEach((items, key) => {
    map.set(key, sortAgendaEvents(items));
  });

  return map;
}

function resolveProcessLabel(process?: AgendaProcessLookup | null) {
  if (!process) return null;
  return process.subject || process.cnj || process.id;
}

function buildEventHistory(sourceLabel: string, meta?: AgendaEventMeta) {
  const history = [`Sincronizado via ${sourceLabel.toLowerCase()}.`];
  if (meta?.updatedAt) {
    history.unshift(`Última personalização em ${format(parseISO(meta.updatedAt), 'dd/MM/yyyy HH:mm')}.`);
  }
  return meta?.history?.length ? [...history, ...meta.history] : history;
}

const RECURRENCE_MAX_OCCURRENCES = 400;

function shiftIso(iso: string, from: Date, to: Date) {
  const original = parseISO(iso);
  const shifted = new Date(original.getTime() + (to.getTime() - from.getTime()));
  return shifted.toISOString();
}

/** Expande eventos recorrentes do feed em ocorrências dentro da janela visível.

A ocorrência original mantém o id verdadeiro (editar/excluir agem na série);
as demais recebem sufixo ::yyyy-MM-dd e são somente leitura. */
export function expandRecurringFeedItems(
  items: CalendarFeedItem[],
  windowStart: Date,
  windowEnd: Date,
): CalendarFeedItem[] {
  const output: CalendarFeedItem[] = [];

  for (const item of items) {
    const recurrence = item.recurrence || 'none';
    if (item.source !== 'custom' || recurrence === 'none') {
      output.push(item);
      continue;
    }

    const seriesStart = parseISO(item.start_at);
    if (Number.isNaN(seriesStart.getTime())) {
      output.push(item);
      continue;
    }

    const untilLimit = item.recurrence_until
      ? endOfDay(parseISO(`${item.recurrence_until}T00:00:00`))
      : addYears(seriesStart, 1);
    const hardEnd = windowEnd < untilLimit ? windowEnd : untilLimit;

    const step = (date: Date): Date => {
      if (recurrence === 'daily') return addDays(date, 1);
      if (recurrence === 'weekly') return addDays(date, 7);
      if (recurrence === 'monthly') return addMonths(date, 1);
      return addYears(date, 1);
    };

    let cursor = new Date(seriesStart);
    let guard = 0;
    while (cursor <= hardEnd && guard < RECURRENCE_MAX_OCCURRENCES) {
      guard += 1;
      if (cursor >= windowStart || isSameDay(cursor, windowStart)) {
        const isOriginal = cursor.getTime() === seriesStart.getTime();
        output.push({
          ...item,
          id: isOriginal ? item.id : `${item.id}::${format(cursor, 'yyyy-MM-dd')}`,
          start_at: isOriginal ? item.start_at : shiftIso(item.start_at, seriesStart, cursor),
          end_at: item.end_at ? (isOriginal ? item.end_at : shiftIso(item.end_at, seriesStart, cursor)) : item.end_at,
        });
      }
      cursor = step(cursor);
    }
  }

  return output;
}

export function buildAgendaEventFromFeedItem(
  item: CalendarFeedItem,
  lookups: AgendaLookups,
  meta?: AgendaEventMeta,
): AgendaEvent {
  const type = inferAgendaType(item, meta);
  const process = item.process_id ? lookups.processById.get(item.process_id) : undefined;
  const clientName = meta?.clientName || process?.client_name || null;
  const processLabel = meta?.processLabel || resolveProcessLabel(process);
  const sourceLabel = item.source === 'hearing' ? 'Audiências' : 'Agenda';
  const fallbackResponsible = process?.responsaveis?.[0];

  return {
    id: item.id,
    source: item.source,
    title: item.title,
    description: item.description || '',
    startAt: item.start_at,
    endAt: item.end_at || null,
    allDay: item.all_day,
    type,
    priority: normalizeAgendaPriority(meta?.priority, type),
    status: meta?.status || normalizeAgendaStatus(item.status),
    color: item.color || AGENDA_EVENT_TYPE_META[type].color,
    location: item.location || '',
    processId: meta?.processId || item.process_id || null,
    processNumber: meta?.processNumber || process?.cnj || null,
    processLabel,
    clientId: meta?.clientId || null,
    clientName,
    responsibleId: meta?.responsibleId || fallbackResponsible?.id || null,
    responsibleName: meta?.responsibleName || fallbackResponsible?.name || mockCurrentUser.name,
    court: meta?.court || process?.tribunal || null,
    branch: meta?.branch || process?.vara || null,
    district: meta?.district || process?.comarca || null,
    videoLink: meta?.videoLink || null,
    reminder: meta?.reminder || '30_min',
    recurrence: item.recurrence || meta?.recurrence || 'none',
    recurrenceUntil: item.recurrence_until || null,
    observations: meta?.observations || '',
    modality: item.modality || null,
    hearingId: item.hearing_id || null,
    editable: item.source === 'custom' && !item.id.includes('::'),
    deletable: item.source === 'custom' && !item.id.includes('::'),
    sourceLabel,
    history: buildEventHistory(sourceLabel, meta),
    originalItem: item,
  };
}

export function buildMockAgendaEvents(
  referenceDate: Date,
  lookups: {
    processes?: AgendaProcessLookup[];
    clients?: AgendaClientLookup[];
    responsibles?: AgendaResponsibleLookup[];
  },
) {
  const processes = lookups.processes?.length
    ? lookups.processes
    : mockProcesses.map((process) => ({
        id: process.id,
        cnj: process.cnj,
        subject: process.classe,
        client_name: process.cliente_nome,
        tribunal: process.tribunal,
        vara: process.vara,
        responsaveis: process.responsaveis.map((responsavel) => ({ id: responsavel.id, name: responsavel.name })),
      }));
  const clients = lookups.clients?.length ? lookups.clients : mockClients.map((client) => ({ id: client.id, name: client.name }));
  const responsibles = lookups.responsibles?.length
    ? lookups.responsibles
    : mockUsers.map((user) => ({ id: user.id, name: user.name }));

  const mainProcess = processes[0];
  const secondProcess = processes[1] || processes[0];
  const mainClient = clients.find((client) => client.name === mainProcess?.client_name) || clients[0];
  const secondClient = clients.find((client) => client.name === secondProcess?.client_name) || clients[1] || clients[0];
  const mainResponsible = responsibles[0] || { id: 'u1', name: mockCurrentUser.name };
  const secondResponsible = responsibles[1] || responsibles[0] || { id: 'u2', name: 'Dra. Ana Oliveira' };

  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const baseDay = Math.max(3, Math.min(20, referenceDate.getDate()));

  const buildDate = (offset: number, hour: number, minute: number) =>
    new Date(y, m, Math.min(27, baseDay + offset), hour, minute, 0, 0).toISOString();

  const events: AgendaEvent[] = [
    {
      id: `mock-audiencia-${y}-${m}`,
      source: 'mock',
      title: 'Audiência de conciliação',
      description: 'Preparação para tentativa de acordo e alinhamento de documentos de suporte.',
      startAt: buildDate(1, 14, 0),
      endAt: buildDate(1, 15, 0),
      allDay: false,
      type: 'AUDIENCIA',
      priority: 'ALTA',
      status: 'CONFIRMADO',
      color: AGENDA_EVENT_TYPE_META.AUDIENCIA.color,
      location: 'Fórum Central - Sala 302',
      processId: mainProcess?.id || null,
      processNumber: mainProcess?.cnj || null,
      processLabel: resolveProcessLabel(mainProcess) || 'Audiência de conciliação',
      clientId: mainClient?.id || null,
      clientName: mainClient?.name || null,
      responsibleId: mainResponsible.id,
      responsibleName: mainResponsible.name,
      court: mainProcess?.tribunal || 'TJSP',
      branch: mainProcess?.vara || '1ª Vara Cível',
      district: null,
      videoLink: null,
      reminder: '1_day',
      recurrence: 'none',
      observations: 'Conferir procuração, documentos de representação e estratégia de acordo.',
      modality: 'PRESENCIAL',
      hearingId: null,
      editable: false,
      deletable: false,
      sourceLabel: 'Demonstração',
      history: ['Criado a partir de dados de demonstração da agenda.'],
    },
    {
      id: `mock-prazo-${y}-${m}`,
      source: 'mock',
      title: 'Prazo para contestação',
      description: 'Entrega final da contestação com revisão de anexos e estratégia de pedidos.',
      startAt: buildDate(2, 17, 0),
      endAt: buildDate(2, 18, 0),
      allDay: false,
      type: 'PRAZO_PROCESSUAL',
      priority: 'URGENTE',
      status: 'PENDENTE',
      color: AGENDA_EVENT_TYPE_META.PRAZO_PROCESSUAL.color,
      location: 'PJe / e-SAJ',
      processId: secondProcess?.id || null,
      processNumber: secondProcess?.cnj || null,
      processLabel: resolveProcessLabel(secondProcess) || 'Prazo processual',
      clientId: secondClient?.id || null,
      clientName: secondClient?.name || null,
      responsibleId: secondResponsible.id,
      responsibleName: secondResponsible.name,
      court: secondProcess?.tribunal || 'TRT-2',
      branch: secondProcess?.vara || '3ª Vara do Trabalho',
      district: null,
      videoLink: null,
      reminder: '1_day',
      recurrence: 'none',
      observations: 'Priorizar revisão da fundamentação e conferência de prazo fatal.',
      modality: null,
      hearingId: null,
      editable: false,
      deletable: false,
      sourceLabel: 'Demonstração',
      history: ['Criado a partir de dados de demonstração da agenda.'],
    },
    {
      id: `mock-reuniao-${y}-${m}`,
      source: 'mock',
      title: 'Reuniao de alinhamento com cliente',
      description: 'Atualização de estratégia, riscos e próximos passos do caso.',
      startAt: buildDate(0, 10, 30),
      endAt: buildDate(0, 11, 15),
      allDay: false,
      type: 'REUNIAO_CLIENTE',
      priority: 'MEDIA',
      status: 'AGENDADO',
      color: AGENDA_EVENT_TYPE_META.REUNIAO_CLIENTE.color,
      location: 'Sala de reuniões / Google Meet',
      processId: mainProcess?.id || null,
      processNumber: mainProcess?.cnj || null,
      processLabel: resolveProcessLabel(mainProcess) || null,
      clientId: mainClient?.id || null,
      clientName: mainClient?.name || null,
      responsibleId: mainResponsible.id,
      responsibleName: mainResponsible.name,
      court: mainProcess?.tribunal || null,
      branch: mainProcess?.vara || null,
      district: null,
      videoLink: 'https://meet.google.com/exemplo-agenda',
      reminder: '30_min',
      recurrence: 'none',
      observations: 'Levar cronograma atualizado e pauta objetiva para decisao do cliente.',
      modality: 'ONLINE',
      hearingId: null,
      editable: false,
      deletable: false,
      sourceLabel: 'Demonstração',
      history: ['Criado a partir de dados de demonstracao da agenda.'],
    },
    {
      id: `mock-protocolo-${y}-${m}`,
      source: 'mock',
      title: 'Protocolo de peticao intercorrente',
      description: 'Envio de peticao com juntada de comprovantes e memoriais.',
      startAt: buildDate(4, 15, 0),
      endAt: buildDate(4, 16, 0),
      allDay: false,
      type: 'PROTOCOLO',
      priority: 'ALTA',
      status: 'PENDENTE',
      color: AGENDA_EVENT_TYPE_META.PROTOCOLO.color,
      location: 'Portal do tribunal',
      processId: secondProcess?.id || null,
      processNumber: secondProcess?.cnj || null,
      processLabel: resolveProcessLabel(secondProcess) || null,
      clientId: secondClient?.id || null,
      clientName: secondClient?.name || null,
      responsibleId: secondResponsible.id,
      responsibleName: secondResponsible.name,
      court: secondProcess?.tribunal || null,
      branch: secondProcess?.vara || null,
      district: null,
      videoLink: null,
      reminder: '1_hour',
      recurrence: 'none',
      observations: 'Validar anexos antes do envio definitivo.',
      modality: null,
      hearingId: null,
      editable: false,
      deletable: false,
      sourceLabel: 'Demonstração',
      history: ['Criado a partir de dados de demonstracao da agenda.'],
    },
    {
      id: `mock-interno-${y}-${m}`,
      source: 'mock',
      title: 'Reuniao interna de triagem de prazos',
      description: 'Revisao da agenda da semana, distribuicao de tarefas e alinhamento de prioridades.',
      startAt: buildDate(6, 8, 30),
      endAt: buildDate(6, 9, 30),
      allDay: false,
      type: 'REUNIAO_INTERNA',
      priority: 'MEDIA',
      status: 'CONFIRMADO',
      color: AGENDA_EVENT_TYPE_META.REUNIAO_INTERNA.color,
      location: 'Sala estrategica',
      processId: null,
      processNumber: null,
      processLabel: 'Rotina operacional',
      clientId: null,
      clientName: null,
      responsibleId: mainResponsible.id,
      responsibleName: mainResponsible.name,
      court: null,
      branch: null,
      district: null,
      videoLink: null,
      reminder: '15_min',
      recurrence: 'weekly',
      observations: 'Conferir demandas urgentes, distribuicao da semana e retorno a clientes.',
      modality: null,
      hearingId: null,
      editable: false,
      deletable: false,
      sourceLabel: 'Demonstração',
      history: ['Criado a partir de dados de demonstracao da agenda.'],
    },
  ];

  return sortAgendaEvents(events);
}

export function buildAgendaEventPayload(form: AgendaEventFormState) {
  const date = form.date || format(new Date(), 'yyyy-MM-dd');
  const startTime = form.allDay ? '00:00' : form.startTime || '09:00';
  const endTime = form.allDay ? '23:59' : form.endTime || '';
  const typeMeta = AGENDA_EVENT_TYPE_META[form.type];

  return {
    title: form.title,
    start_at: `${date}T${startTime}`,
    end_at: endTime ? `${date}T${endTime}` : null,
    location: form.location || '',
    description: form.description || '',
    color: typeMeta.color,
    all_day: form.allDay,
    recurrence: form.recurrence || 'none',
    recurrence_until: form.recurrenceUntil || null,
  };
}

export function buildAgendaMetaFromForm(
  form: AgendaEventFormState,
  clients: AgendaClientLookup[],
  processes: AgendaProcessLookup[],
  responsibles: AgendaResponsibleLookup[],
): AgendaEventMeta {
  const selectedClient = clients.find((client) => client.id === form.clientId);
  const selectedProcess = processes.find((process) => process.id === form.processId);
  const selectedResponsible = responsibles.find((responsible) => responsible.id === form.responsibleId);

  return {
    type: form.type,
    priority: form.priority,
    status: form.status,
    responsibleId: form.responsibleId || undefined,
    responsibleName: selectedResponsible?.name,
    clientId: form.clientId || undefined,
    clientName: selectedClient?.name,
    processId: form.processId || undefined,
    processNumber: selectedProcess?.cnj || undefined,
    processLabel: resolveProcessLabel(selectedProcess || null) || undefined,
    court: form.court || selectedProcess?.tribunal || undefined,
    branch: form.branch || selectedProcess?.vara || undefined,
    district: form.district || selectedProcess?.comarca || undefined,
    videoLink: form.videoLink || undefined,
    reminder: form.reminder || undefined,
    recurrence: form.recurrence || undefined,
    observations: form.observations || undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function agendaEventToForm(event: AgendaEvent): AgendaEventFormState {
  const start = parseISO(event.startAt);
  const end = event.endAt ? parseISO(event.endAt) : null;

  return {
    title: event.title,
    type: event.type,
    date: format(start, 'yyyy-MM-dd'),
    startTime: format(start, 'HH:mm'),
    endTime: end ? format(end, 'HH:mm') : '',
    allDay: event.allDay,
    responsibleId: event.responsibleId || '',
    clientId: event.clientId || '',
    processId: event.processId || '',
    priority: event.priority,
    status: event.status,
    location: event.location || '',
    description: event.description || '',
    observations: event.observations || '',
    reminder: event.reminder || '30_min',
    recurrence: event.recurrence || 'none',
    recurrenceUntil: event.recurrenceUntil || '',
    videoLink: event.videoLink || '',
    court: event.court || '',
    branch: event.branch || '',
    district: event.district || '',
  };
}

export function buildInitialAgendaForm(date?: Date) {
  if (!date) return { ...EMPTY_EVENT_FORM };
  return {
    ...EMPTY_EVENT_FORM,
    date: format(date, 'yyyy-MM-dd'),
  };
}

export function cloneAgendaForm(form: AgendaEventFormState) {
  return { ...form, title: `${form.title} (copia)` };
}

export function isEventOverdue(event: AgendaEvent, referenceDate = new Date()) {
  if (event.status === 'REALIZADO' || event.status === 'CANCELADO') return false;
  return isBefore(endOfDay(event.endAt ? parseISO(event.endAt) : parseISO(event.startAt)), startOfDay(referenceDate));
}

export function isDeadlineSoon(event: AgendaEvent, referenceDate = new Date()) {
  if (!isDeadlineType(event.type)) return false;
  const diffMs = startOfDay(parseISO(event.startAt)).getTime() - startOfDay(referenceDate).getTime();
  const diffDays = Math.round(diffMs / 86400000);
  return diffDays >= 0 && diffDays <= 3;
}

export function isTodayEvent(event: AgendaEvent, referenceDate = new Date()) {
  return isSameDay(parseISO(event.startAt), referenceDate);
}

export function filterAgendaEvents(
  events: AgendaEvent[],
  searchTerm: string,
  filters: AgendaFiltersState,
  currentDate: Date,
  currentUserName: string,
) {
  const normalizedSearch = normalizeText(searchTerm);

  return events.filter((event) => {
    if (filters.type !== 'all' && event.type !== filters.type) return false;
    if (filters.status !== 'all' && event.status !== filters.status) return false;
    if (filters.priority !== 'all' && event.priority !== filters.priority) return false;
    if (filters.responsibleId !== 'all' && event.responsibleId !== filters.responsibleId) return false;
    if (filters.clientId !== 'all' && event.clientId !== filters.clientId) return false;
    if (filters.processId !== 'all' && event.processId !== filters.processId) return false;
    if (filters.mineOnly && normalizeText(event.responsibleName) !== normalizeText(currentUserName)) return false;
    if (filters.onlyHearings && event.type !== 'AUDIENCIA') return false;
    if (filters.onlyDeadlines && !isDeadlineType(event.type)) return false;

    if (filters.period === 'today' && !isTodayEvent(event, currentDate)) return false;
    if (filters.period === 'week') {
      const { start, end } = getViewInterval('week', currentDate);
      const startAt = parseISO(event.startAt);
      if (startAt < start || startAt > end) return false;
    }
    if (filters.period === 'month') {
      const { start, end } = getViewInterval('month', currentDate);
      const startAt = parseISO(event.startAt);
      if (startAt < start || startAt > end) return false;
    }
    if (filters.period === 'next7') {
      const startAt = parseISO(event.startAt);
      if (startAt < startOfDay(currentDate) || startAt > endOfDay(addDays(currentDate, 6))) return false;
    }
    if (filters.period === 'overdue' && !isEventOverdue(event, currentDate)) return false;

    if (!normalizedSearch) return true;

    const searchable = normalizeText(
      [
        event.title,
        event.description,
        event.clientName,
        event.processNumber,
        event.processLabel,
        event.responsibleName,
        event.location,
      ].join(' '),
    );

    return searchable.includes(normalizedSearch);
  });
}

export function buildFallbackResponsibles() {
  return mockUsers.map((user) => ({ id: user.id, name: user.name }));
}

export function buildFallbackClients() {
  return mockClients.map((client) => ({ id: client.id, name: client.name }));
}

export function buildFallbackProcesses() {
  return mockProcesses.map((process) => ({
    id: process.id,
    cnj: process.cnj,
    subject: process.classe,
    client_name: process.cliente_nome,
    tribunal: process.tribunal,
    vara: process.vara,
    responsaveis: process.responsaveis.map((responsavel) => ({ id: responsavel.id, name: responsavel.name })),
  }));
}
