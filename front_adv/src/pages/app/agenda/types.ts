export type AgendaView = 'month' | 'week' | 'day' | 'list';

export type AgendaEventType =
  | 'AUDIENCIA'
  | 'PRAZO_PROCESSUAL'
  | 'REUNIAO_CLIENTE'
  | 'REUNIAO_INTERNA'
  | 'TAREFA'
  | 'COMPROMISSO'
  | 'LEMBRETE'
  | 'VENCIMENTO'
  | 'PROTOCOLO'
  | 'CONSULTA';

export type AgendaEventPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type AgendaEventStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'PENDENTE'
  | 'REALIZADO'
  | 'CANCELADO'
  | 'REMARCADO'
  | 'ATRASADO';

export type AgendaEventSource = 'custom' | 'hearing' | 'mock';

export type CalendarFeedItem = {
  id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  location?: string;
  color?: string;
  kind: string;
  source: 'custom' | 'hearing';
  process_id?: string | null;
  hearing_id?: string | null;
  status?: string | null;
  modality?: string | null;
};

export type AgendaSelectable = {
  id: string;
  label: string;
  secondary?: string;
};

export type AgendaProcessLookup = {
  id: string;
  cnj?: string | null;
  subject?: string | null;
  client_name?: string | null;
  tribunal?: string | null;
  vara?: string | null;
  comarca?: string | null;
  responsaveis?: { id?: string; name: string }[];
};

export type AgendaClientLookup = {
  id: string;
  name: string;
};

export type AgendaResponsibleLookup = {
  id: string;
  name: string;
};

export type AgendaEventMeta = {
  type?: AgendaEventType;
  priority?: AgendaEventPriority;
  status?: AgendaEventStatus;
  responsibleId?: string;
  responsibleName?: string;
  clientId?: string;
  clientName?: string;
  processId?: string;
  processNumber?: string;
  processLabel?: string;
  court?: string;
  branch?: string;
  district?: string;
  videoLink?: string;
  reminder?: string;
  recurrence?: string;
  observations?: string;
  history?: string[];
  updatedAt?: string;
};

export type AgendaEvent = {
  id: string;
  source: AgendaEventSource;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  type: AgendaEventType;
  priority: AgendaEventPriority;
  status: AgendaEventStatus;
  color: string;
  location: string;
  processId: string | null;
  processNumber: string | null;
  processLabel: string | null;
  clientId: string | null;
  clientName: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  court: string | null;
  branch: string | null;
  district: string | null;
  videoLink: string | null;
  reminder: string | null;
  recurrence: string | null;
  observations: string;
  modality: string | null;
  hearingId: string | null;
  editable: boolean;
  deletable: boolean;
  sourceLabel: string;
  history: string[];
  originalItem?: CalendarFeedItem;
};

export type AgendaFiltersState = {
  type: AgendaEventType | 'all';
  responsibleId: string | 'all';
  clientId: string | 'all';
  processId: string | 'all';
  status: AgendaEventStatus | 'all';
  priority: AgendaEventPriority | 'all';
  period: 'all' | 'today' | 'week' | 'month' | 'next7' | 'overdue';
  mineOnly: boolean;
  onlyHearings: boolean;
  onlyDeadlines: boolean;
};

export type AgendaEventFormState = {
  title: string;
  type: AgendaEventType;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  responsibleId: string;
  clientId: string;
  processId: string;
  priority: AgendaEventPriority;
  status: AgendaEventStatus;
  location: string;
  description: string;
  observations: string;
  reminder: string;
  recurrence: string;
  videoLink: string;
  court: string;
  branch: string;
  district: string;
};

export const DEFAULT_AGENDA_FILTERS: AgendaFiltersState = {
  type: 'all',
  responsibleId: 'all',
  clientId: 'all',
  processId: 'all',
  status: 'all',
  priority: 'all',
  period: 'all',
  mineOnly: false,
  onlyHearings: false,
  onlyDeadlines: false,
};

export const EMPTY_EVENT_FORM: AgendaEventFormState = {
  title: '',
  type: 'REUNIAO_CLIENTE',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  allDay: false,
  responsibleId: '',
  clientId: '',
  processId: '',
  priority: 'MEDIA',
  status: 'AGENDADO',
  location: '',
  description: '',
  observations: '',
  reminder: '30_min',
  recurrence: 'none',
  videoLink: '',
  court: '',
  branch: '',
  district: '',
};

export const AGENDA_VIEW_OPTIONS: { value: AgendaView; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
  { value: 'list', label: 'Lista' },
];

export const AGENDA_EVENT_TYPE_META: Record<
  AgendaEventType,
  { label: string; color: string; surface: string; border: string }
> = {
  AUDIENCIA: {
    label: 'Audiência',
    color: '#dc2626',
    surface: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.28)',
  },
  PRAZO_PROCESSUAL: {
    label: 'Prazo processual',
    color: '#ea580c',
    surface: 'rgba(234, 88, 12, 0.12)',
    border: 'rgba(234, 88, 12, 0.28)',
  },
  REUNIAO_CLIENTE: {
    label: 'Reunião com cliente',
    color: '#2563eb',
    surface: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.28)',
  },
  REUNIAO_INTERNA: {
    label: 'Reunião interna',
    color: '#7c3aed',
    surface: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.28)',
  },
  TAREFA: {
    label: 'Tarefa',
    color: '#16a34a',
    surface: 'rgba(22, 163, 74, 0.12)',
    border: 'rgba(22, 163, 74, 0.28)',
  },
  COMPROMISSO: {
    label: 'Compromisso',
    color: '#475569',
    surface: 'rgba(71, 85, 105, 0.12)',
    border: 'rgba(71, 85, 105, 0.28)',
  },
  LEMBRETE: {
    label: 'Lembrete',
    color: '#0ea5e9',
    surface: 'rgba(14, 165, 233, 0.12)',
    border: 'rgba(14, 165, 233, 0.28)',
  },
  VENCIMENTO: {
    label: 'Vencimento',
    color: '#f59e0b',
    surface: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.28)',
  },
  PROTOCOLO: {
    label: 'Protocolo',
    color: '#0891b2',
    surface: 'rgba(8, 145, 178, 0.12)',
    border: 'rgba(8, 145, 178, 0.28)',
  },
  CONSULTA: {
    label: 'Consulta',
    color: '#0284c7',
    surface: 'rgba(2, 132, 199, 0.12)',
    border: 'rgba(2, 132, 199, 0.28)',
  },
};

export const AGENDA_EVENT_TYPE_OPTIONS = Object.entries(AGENDA_EVENT_TYPE_META).map(([value, meta]) => ({
  value: value as AgendaEventType,
  label: meta.label,
}));

export const AGENDA_PRIORITY_OPTIONS: { value: AgendaEventPriority; label: string }[] = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

export const AGENDA_STATUS_OPTIONS: { value: AgendaEventStatus; label: string }[] = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'REMARCADO', label: 'Remarcado' },
  { value: 'ATRASADO', label: 'Atrasado' },
];

export const AGENDA_REMINDER_OPTIONS = [
  { value: 'none', label: 'Sem lembrete' },
  { value: '15_min', label: '15 minutos antes' },
  { value: '30_min', label: '30 minutos antes' },
  { value: '1_hour', label: '1 hora antes' },
  { value: '1_day', label: '1 dia antes' },
];

export const AGENDA_RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Não recorrente' },
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
];
