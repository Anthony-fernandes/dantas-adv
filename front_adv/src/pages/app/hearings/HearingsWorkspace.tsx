import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CalendarDays,
  CalendarPlus2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  Files,
  Gavel,
  History,
  Landmark,
  MapPin,
  Paperclip,
  Pencil,
  RefreshCcw,
  Scale,
  Upload,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { api, apiGetAllPages } from '@/integrations/api/client';
import { processService } from '@/services/api';
import { loadWorkspaceStateMap, saveWorkspaceStateItem } from '@/services/workspaceState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { DocumentFile } from '@/types/models';
import {
  formatDocumentDate,
  formatFileSize,
  getDocumentKind,
  getDocumentUrl,
  groupDocuments,
} from '@/components/process-documents/utils';

type Paginated<T> = { results?: T[] } | T[];
const asList = <T,>(data: Paginated<T> | undefined | null): T[] => (!data ? [] : Array.isArray(data) ? data : (data.results ?? []));

type ProcessResponsible = { id: string; name?: string | null };

type ProcessItem = {
  id: string;
  cnj?: string | null;
  subject?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  tribunal?: string | null;
  court?: string | null;
  vara?: string | null;
  court_division?: string | null;
  classe?: string | null;
  class_name?: string | null;
  comarca?: string | null;
  polo_ativo?: string | null;
  plaintiff?: string | null;
  polo_passivo?: string | null;
  defendant?: string | null;
  responsaveis?: ProcessResponsible[] | null;
  client?: string | null;
  cliente_id?: string | null;
};

type HearingItem = {
  id: string;
  process: string;
  type?: string | null;
  hearing_date: string;
  end_date?: string | null;
  location?: string | null;
  online_link?: string | null;
  modality: string;
  status: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WorkflowStatus = 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'adiada';

type HearingNoteEntry = {
  id: string;
  content: string;
  createdAt: string;
  author: string;
};

type HearingTimelineEntry = {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
};

type HearingExtraRecord = {
  workflowStatus?: WorkflowStatus;
  forum?: string;
  room?: string;
  fullAddress?: string;
  comarca?: string;
  responsibleLawyer?: string;
  opposingParty?: string;
  judge?: string;
  prosecutor?: string;
  reminders?: {
    oneDayBefore: boolean;
    oneHourBefore: boolean;
  };
  notesHistory?: HearingNoteEntry[];
  timeline?: HearingTimelineEntry[];
};

type HearingFormState = {
  process: string;
  type: string;
  hearing_date: string;
  end_date: string;
  modality: string;
  workflowStatus: WorkflowStatus;
  location: string;
  online_link: string;
  forum: string;
  room: string;
  fullAddress: string;
  comarca: string;
  responsibleLawyer: string;
  opposingParty: string;
  judge: string;
  prosecutor: string;
  notes: string;
};

const blankForm: HearingFormState = {
  process: '',
  type: 'Audiência de conciliação',
  hearing_date: '',
  end_date: '',
  modality: 'presencial',
  workflowStatus: 'agendada',
  location: '',
  online_link: '',
  forum: '',
  room: '',
  fullAddress: '',
  comarca: '',
  responsibleLawyer: '',
  opposingParty: '',
  judge: '',
  prosecutor: '',
  notes: '',
};

function defaultDateTime(daysAhead: number = 3, hours: number = 9, minutes: number = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hours, minutes, 0, 0);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatDateOnly(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTimeOnly(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function durationLabel(start?: string | null, end?: string | null) {
  if (!start || !end) return 'Não informada';
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  if (Number.isNaN(startDate) || Number.isNaN(endDate) || endDate <= startDate) return 'Não informada';
  const minutes = Math.round((endDate - startDate) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

function workflowStatusLabel(value: WorkflowStatus) {
  const labels: Record<WorkflowStatus, string> = {
    agendada: 'Agendada',
    confirmada: 'Confirmada',
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    adiada: 'Adiada',
  };
  return labels[value];
}

function workflowStatusClasses(value: WorkflowStatus) {
  const classes: Record<WorkflowStatus, string> = {
    agendada: 'bg-sky-50 text-sky-700 ring-sky-200',
    confirmada: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    realizada: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    cancelada: 'bg-rose-50 text-rose-700 ring-rose-200',
    adiada: 'bg-amber-50 text-amber-700 ring-amber-200',
  };
  return classes[value];
}

function modalityLabel(value?: string | null) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'online') return 'Online';
  if (normalized === 'hibrida') return 'Hibrida';
  return 'Presencial';
}

function modalityClasses(value?: string | null) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'online') return 'bg-violet-50 text-violet-700 ring-violet-200';
  if (normalized === 'hibrida') return 'bg-indigo-50 text-indigo-700 ring-indigo-200';
  return 'bg-muted text-muted-foreground ring-border';
}

function mapBackendStatusToWorkflow(value?: string | null): WorkflowStatus {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'confirmada') return 'confirmada';
  if (normalized === 'realizada') return 'realizada';
  if (normalized === 'cancelada') return 'cancelada';
  if (normalized === 'redesignada') return 'adiada';
  return 'agendada';
}

function mapWorkflowToBackend(value: WorkflowStatus) {
  if (value === 'adiada') return 'redesignada';
  return value;
}

function hearingAttention(hearingDate?: string | null, workflowStatus?: WorkflowStatus) {
  if (!hearingDate || workflowStatus === 'realizada' || workflowStatus === 'cancelada') return null;
  const target = new Date(hearingDate);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  const sameDay = target.toDateString() === now.toDateString();

  if (sameDay) {
    return { label: 'Audiência hoje', helper: 'Preparar equipe, cliente e documentos.', classes: 'bg-amber-50 text-amber-700 ring-amber-200' };
  }
  if (diff < 0) {
    return { label: 'Atrasada', helper: 'Revisar status ou remarcar a pauta.', classes: 'bg-rose-50 text-rose-700 ring-rose-200' };
  }
  if (diff <= 1000 * 60 * 60 * 24 * 2) {
    return { label: 'Próxima', helper: 'Compromisso em menos de 48 horas.', classes: 'bg-yellow-50 text-yellow-700 ring-yellow-200' };
  }
  return { label: 'Programada', helper: 'Audiência dentro do fluxo previsto.', classes: 'bg-muted text-muted-foreground ring-border' };
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  description?: string;
  icon: typeof Gavel;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function InfoLine({ label, value, emphasize = false }: { label: string; value?: string | null; emphasize?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed pb-3 last:border-none last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-right text-sm ${emphasize ? 'font-semibold text-foreground' : 'text-foreground/85'}`}>{value || 'Não informado'}</span>
    </div>
  );
}

function readingUserName(profileName?: string | null) {
  return profileName?.trim() || 'Equipe jurídica';
}

function buildProcessLabel(process?: ProcessItem | null) {
  if (!process) return 'Processo não localizado';
  return process.cnj || process.subject || process.id;
}

function buildDefaultExtra(hearing: HearingItem, process: ProcessItem | undefined, currentUserName: string): HearingExtraRecord {
  const responsibleLawyer = process?.responsaveis?.map((item) => item.name).filter(Boolean).join(', ') || currentUserName;
  const opposingParty = process?.polo_passivo || process?.defendant || '';
  const baseNotes = hearing.notes?.trim()
    ? [{ id: `initial-${hearing.id}`, content: hearing.notes.trim(), createdAt: hearing.created_at || hearing.hearing_date, author: 'Sistema' }]
    : [];

  return {
    workflowStatus: mapBackendStatusToWorkflow(hearing.status),
    forum: process?.tribunal || process?.court || '',
    room: '',
    fullAddress: hearing.location || '',
    comarca: process?.comarca || '',
    responsibleLawyer,
    opposingParty,
    judge: '',
    prosecutor: '',
    reminders: {
      oneDayBefore: true,
      oneHourBefore: true,
    },
    notesHistory: baseNotes,
    timeline: [],
  };
}

export default function HearingsWorkspace() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useTenant();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const noteEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const currentUserName = readingUserName(profile?.full_name);
  const [extrasMap, setExtrasMap] = useState<Record<string, HearingExtraRecord>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHearingId, setSelectedHearingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<HearingItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<HearingFormState>({ ...blankForm, hearing_date: defaultDateTime(), end_date: defaultDateTime(3, 10, 0) });
  const [dateConflicts, setDateConflicts] = useState<Array<{ id: string; hearing_date: string; type?: string | null; process_cnj?: string | null; responsible_name?: string | null }>>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(defaultDateTime(5, 9, 0));
  const [rescheduleEndDate, setRescheduleEndDate] = useState(defaultDateTime(5, 10, 0));
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const hearingsQuery = useQuery({
    queryKey: ['hearings-module', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<HearingItem>('/hearings/', { ordering: 'hearing_date' }),
  });

  const processesQuery = useQuery({
    queryKey: ['hearings-processes', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<ProcessItem>('/processes/'),
  });

  const hearingExtrasQuery = useQuery({
    queryKey: ['workspace-state', 'hearings_workspace', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<HearingExtraRecord>('hearings_workspace'),
  });

  const hearings = asList(hearingsQuery.data);
  const processes = asList(processesQuery.data);
  const processMap = useMemo(() => Object.fromEntries(processes.map((process) => [process.id, process])), [processes]);

  useEffect(() => {
    setExtrasMap(hearingExtrasQuery.data ?? {});
  }, [hearingExtrasQuery.data]);

  const persistHearingExtra = async (hearingId: string, nextExtra: HearingExtraRecord) => {
    const nextMap = {
      ...extrasMap,
      [hearingId]: nextExtra,
    };
    setExtrasMap(nextMap);
    await saveWorkspaceStateItem('hearings_workspace', hearingId, nextExtra);
    queryClient.setQueryData(['workspace-state', 'hearings_workspace', activeTenantId], nextMap);
    return nextMap;
  };

  useEffect(() => {
    if (hearings.length === 0) {
      setSelectedHearingId(null);
      return;
    }
    if (!selectedHearingId || !hearings.some((hearing) => hearing.id === selectedHearingId)) {
      setSelectedHearingId(hearings[0].id);
    }
  }, [hearings, selectedHearingId]);

  const resolveExtra = (hearing: HearingItem) => {
    const existing = extrasMap[hearing.id];
    const defaults = buildDefaultExtra(hearing, processMap[hearing.process], currentUserName);
    return {
      ...defaults,
      ...existing,
      reminders: { ...defaults.reminders, ...existing?.reminders },
      notesHistory: existing?.notesHistory ?? defaults.notesHistory,
      timeline: existing?.timeline ?? defaults.timeline,
    } satisfies HearingExtraRecord;
  };

  const workflowStatusFor = (hearing: HearingItem) => resolveExtra(hearing).workflowStatus || mapBackendStatusToWorkflow(hearing.status);

  const filteredHearings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return hearings.filter((hearing) => {
      const process = processMap[hearing.process];
      const workflowStatus = workflowStatusFor(hearing);
      if (statusFilter !== 'all' && workflowStatus !== statusFilter) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        hearing.type,
        buildProcessLabel(process),
        process?.client_name,
        process?.cliente_nome,
        process?.subject,
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [hearings, processMap, search, statusFilter, extrasMap]);

  useEffect(() => {
    if (filteredHearings.length === 0) return;
    if (!selectedHearingId || !filteredHearings.some((hearing) => hearing.id === selectedHearingId)) {
      setSelectedHearingId(filteredHearings[0].id);
    }
  }, [filteredHearings, selectedHearingId]);

  // Checagem de conflito de pauta (aviso não bloqueante) ao escolher data/hora.
  useEffect(() => {
    if (!formOpen || !form.hearing_date) {
      setDateConflicts([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const iso = new Date(form.hearing_date).toISOString();
        const params = new URLSearchParams({ hearing_date: iso });
        if (editing?.id) params.set('exclude', editing.id);
        const result = await api.get<{ has_conflict: boolean; conflicts: typeof dateConflicts }>(`/hearings/check-conflict/?${params.toString()}`);
        setDateConflicts(result?.conflicts || []);
      } catch {
        setDateConflicts([]);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [formOpen, form.hearing_date, editing?.id]);

  const selectedHearing = useMemo(
    () => filteredHearings.find((hearing) => hearing.id === selectedHearingId) || hearings.find((hearing) => hearing.id === selectedHearingId) || null,
    [filteredHearings, hearings, selectedHearingId],
  );
  const selectedProcess = selectedHearing ? processMap[selectedHearing.process] : undefined;
  const selectedExtra = selectedHearing ? resolveExtra(selectedHearing) : null;
  const selectedWorkflowStatus = selectedHearing ? workflowStatusFor(selectedHearing) : 'agendada';
  const selectedAttention = selectedHearing ? hearingAttention(selectedHearing.hearing_date, selectedWorkflowStatus) : null;

  const documentsQuery = useQuery({
    queryKey: ['hearing-documents', activeTenantId, selectedHearing?.process],
    enabled: !!activeTenantId && !!selectedHearing?.process,
    queryFn: async () => await processService.documents(String(selectedHearing?.process)),
  });

  const documentGroups = useMemo(() => groupDocuments(asList<DocumentFile>(documentsQuery.data as Paginated<DocumentFile> | undefined)), [documentsQuery.data]);

  const noteEntries = useMemo(() => {
    if (!selectedExtra?.notesHistory) return [];
    return [...selectedExtra.notesHistory].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [selectedExtra]);

  const timelineEntries = useMemo(() => {
    if (!selectedHearing) return [];
    const entries: HearingTimelineEntry[] = [];
    if (selectedHearing.created_at) {
      entries.push({
        id: `created-${selectedHearing.id}`,
        title: 'Audiência registrada',
        description: 'Cadastro inicial da audiência no painel jurídico.',
        date: selectedHearing.created_at,
        author: 'Sistema',
      });
    }
    if (selectedHearing.updated_at && selectedHearing.updated_at !== selectedHearing.created_at) {
      entries.push({
        id: `updated-${selectedHearing.id}`,
        title: 'Dados atualizados',
        description: 'Informações da audiência foram revisadas.',
        date: selectedHearing.updated_at,
        author: 'Sistema',
      });
    }
    return [...entries, ...(selectedExtra?.timeline ?? [])].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [selectedExtra, selectedHearing]);

  const stats = useMemo(() => {
    const now = Date.now();
    const today = new Date().toDateString();
    return {
      total: hearings.length,
      today: hearings.filter((hearing) => new Date(hearing.hearing_date).toDateString() === today).length,
      next72h: hearings.filter((hearing) => {
        const diff = new Date(hearing.hearing_date).getTime() - now;
        return diff >= 0 && diff <= 1000 * 60 * 60 * 72;
      }).length,
      completed: hearings.filter((hearing) => workflowStatusFor(hearing) === 'realizada').length,
    };
  }, [hearings, extrasMap]);

  async function updateExtra(hearing: HearingItem, updater: (current: HearingExtraRecord) => HearingExtraRecord) {
    const existing = extrasMap[hearing.id];
    const defaults = buildDefaultExtra(hearing, processMap[hearing.process], currentUserName);
    const merged = {
      ...defaults,
      ...existing,
      reminders: { ...defaults.reminders, ...existing?.reminders },
      notesHistory: existing?.notesHistory ?? defaults.notesHistory,
      timeline: existing?.timeline ?? defaults.timeline,
    } satisfies HearingExtraRecord;
    await persistHearingExtra(hearing.id, updater(merged));
  }

  function resetForm(nextProcessId?: string) {
    setEditing(null);
    setForm({
      ...blankForm,
      process: nextProcessId || '',
      hearing_date: defaultDateTime(),
      end_date: defaultDateTime(3, 10, 0),
    });
  }

  function openCreate() {
    resetForm(selectedHearing?.process);
    setFormOpen(true);
  }

  function openEdit(hearing: HearingItem) {
    const extra = resolveExtra(hearing);
    setEditing(hearing);
    setForm({
      process: hearing.process,
      type: hearing.type || 'Audiência',
      hearing_date: toDateTimeLocal(hearing.hearing_date),
      end_date: toDateTimeLocal(hearing.end_date),
      modality: String(hearing.modality || 'presencial').toLowerCase(),
      workflowStatus: extra.workflowStatus || mapBackendStatusToWorkflow(hearing.status),
      location: hearing.location || '',
      online_link: hearing.online_link || '',
      forum: extra.forum || '',
      room: extra.room || '',
      fullAddress: extra.fullAddress || hearing.location || '',
      comarca: extra.comarca || '',
      responsibleLawyer: extra.responsibleLawyer || '',
      opposingParty: extra.opposingParty || '',
      judge: extra.judge || '',
      prosecutor: extra.prosecutor || '',
      notes: hearing.notes || '',
    });
    setFormOpen(true);
  }

  async function refreshHearings() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hearings-module', activeTenantId] }),
      queryClient.invalidateQueries({ queryKey: ['hearing-documents', activeTenantId, selectedHearing?.process] }),
    ]);
  }

  async function handleSaveForm() {
    if (!activeTenantId) {
      toast.error('Selecione um escritório antes de salvar a audiência.');
      return;
    }
    if (!form.process) {
      toast.error('Selecione o processo vinculado.');
      return;
    }
    if (!form.hearing_date) {
      toast.error('Informe a data e hora da audiência.');
      return;
    }

    setIsSavingForm(true);
    try {
      const payload: Record<string, any> = {
        process: form.process,
        type: form.type.trim() || 'Audiência',
        hearing_date: form.hearing_date,
        end_date: form.end_date || undefined,
        modality: form.modality,
        status: mapWorkflowToBackend(form.workflowStatus),
        location: form.location.trim() || form.fullAddress.trim() || undefined,
        online_link: form.online_link.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      const result = editing
        ? await api.patch<HearingItem>(`/hearings/${editing.id}/`, payload)
        : await api.post<HearingItem>('/hearings/', payload);

      const timelineEntry: HearingTimelineEntry = {
        id: crypto.randomUUID(),
        title: editing ? 'Audiência editada' : 'Audiência criada',
        description: editing
          ? 'Dados de pauta, participantes ou local foram atualizados.'
          : 'Nova audiência registrada na pauta do escritório.',
        date: new Date().toISOString(),
        author: currentUserName,
      };

      await persistHearingExtra(result.id, {
        ...(editing ? extrasMap[editing.id] : {}),
        ...buildDefaultExtra(result, processMap[result.process], currentUserName),
        ...extrasMap[result.id],
        workflowStatus: form.workflowStatus,
        forum: form.forum.trim(),
        room: form.room.trim(),
        fullAddress: form.fullAddress.trim(),
        comarca: form.comarca.trim(),
        responsibleLawyer: form.responsibleLawyer.trim(),
        opposingParty: form.opposingParty.trim(),
        judge: form.judge.trim(),
        prosecutor: form.prosecutor.trim(),
        reminders: extrasMap[result.id]?.reminders || extrasMap[editing?.id || '']?.reminders || { oneDayBefore: true, oneHourBefore: true },
        notesHistory: extrasMap[result.id]?.notesHistory || extrasMap[editing?.id || '']?.notesHistory || buildDefaultExtra(result, processMap[result.process], currentUserName).notesHistory,
        timeline: [...(extrasMap[result.id]?.timeline || extrasMap[editing?.id || '']?.timeline || []), timelineEntry],
      });

      await refreshHearings();
      setSelectedHearingId(result.id);
      setFormOpen(false);
      resetForm();
      toast.success(editing ? 'Audiência atualizada.' : 'Audiência criada.');
    } catch (error: any) {
      toast.error(error?.message || error?.detail || 'Falha ao salvar audiência.');
    } finally {
      setIsSavingForm(false);
    }
  }

  async function handleStatusAction(nextStatus: WorkflowStatus, successMessage: string, description: string) {
    if (!selectedHearing) return;
    setBusyAction(nextStatus);
    try {
      await api.patch(`/hearings/${selectedHearing.id}/`, { status: mapWorkflowToBackend(nextStatus) });
      await updateExtra(selectedHearing, (current) => ({
        ...current,
        workflowStatus: nextStatus,
        timeline: [
          ...(current.timeline || []),
          { id: crypto.randomUUID(), title: successMessage, description, date: new Date().toISOString(), author: currentUserName },
        ],
      }));
      await refreshHearings();
      toast.success(successMessage);
    } catch (error: any) {
      toast.error(error?.message || error?.detail || 'Falha ao atualizar a audiência.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReschedule() {
    if (!selectedHearing || !rescheduleDate) return;
    setBusyAction('reschedule');
    try {
      await api.patch(`/hearings/${selectedHearing.id}/`, {
        hearing_date: rescheduleDate,
        end_date: rescheduleEndDate || undefined,
        status: 'redesignada',
      });
      await updateExtra(selectedHearing, (current) => ({
        ...current,
        workflowStatus: 'adiada',
        timeline: [
          ...(current.timeline || []),
          {
            id: crypto.randomUUID(),
            title: 'Audiência remarcada',
            description: rescheduleReason.trim() || 'Nova data registrada para a audiência.',
            date: new Date().toISOString(),
            author: currentUserName,
          },
        ],
      }));
      await refreshHearings();
      setRescheduleOpen(false);
      setRescheduleReason('');
      toast.success('Audiência remarcada.');
    } catch (error: any) {
      toast.error(error?.message || error?.detail || 'Não foi possível remarcar a audiência.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCancel() {
    if (!selectedHearing) return;
    setBusyAction('cancel');
    try {
      await api.patch(`/hearings/${selectedHearing.id}/`, { status: 'cancelada' });
      await updateExtra(selectedHearing, (current) => ({
        ...current,
        workflowStatus: 'cancelada',
        timeline: [
          ...(current.timeline || []),
          {
            id: crypto.randomUUID(),
            title: 'Audiência cancelada',
            description: cancelReason.trim() || 'Cancelamento registrado no painel.',
            date: new Date().toISOString(),
            author: currentUserName,
          },
        ],
      }));
      await refreshHearings();
      setCancelOpen(false);
      setCancelReason('');
      toast.success('Audiência cancelada.');
    } catch (error: any) {
      toast.error(error?.message || error?.detail || 'Não foi possível cancelar a audiência.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDuplicate() {
    if (!selectedHearing) return;
    setBusyAction('duplicate');
    try {
      const payload = {
        process: selectedHearing.process,
        type: selectedHearing.type || 'Audiência',
        hearing_date: defaultDateTime(7, 9, 0),
        end_date: defaultDateTime(7, 10, 0),
        modality: selectedHearing.modality,
        status: 'agendada',
        location: selectedHearing.location || undefined,
        online_link: selectedHearing.online_link || undefined,
        notes: selectedHearing.notes || undefined,
      };

      const duplicated = await api.post<HearingItem>('/hearings/', payload);
      if (selectedExtra) {
        await persistHearingExtra(duplicated.id, {
          ...selectedExtra,
          workflowStatus: 'agendada',
          notesHistory: selectedExtra.notesHistory || [],
          timeline: [
            ...(selectedExtra.timeline || []),
            {
              id: crypto.randomUUID(),
              title: 'Audiência duplicada',
              description: 'Nova pauta criada a partir de uma audiência existente.',
              date: new Date().toISOString(),
              author: currentUserName,
            },
          ],
        });
      }
      await refreshHearings();
      setSelectedHearingId(duplicated.id);
      toast.success('Audiência duplicada.');
    } catch (error: any) {
      toast.error(error?.message || error?.detail || 'Não foi possível duplicar a audiência.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDocumentUpload(file: File) {
    if (!selectedHearing?.process) {
      toast.error('Selecione uma audiência vinculada a processo.');
      return;
    }
    setBusyAction('document');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('category', 'audiencia');
      const clientId = selectedProcess?.client || selectedProcess?.cliente_id;
      if (clientId) formData.append('client', clientId);
      await processService.uploadDocument(selectedHearing.process, formData);
      await updateExtra(selectedHearing, (current) => ({
        ...current,
        timeline: [
          ...(current.timeline || []),
          {
            id: crypto.randomUUID(),
            title: 'Documento anexado',
            description: `${file.name} foi vinculado ao processo a partir da audiência.`,
            date: new Date().toISOString(),
            author: currentUserName,
          },
        ],
      }));
      await refreshHearings();
      toast.success('Documento anexado ao processo.');
    } catch (error: any) {
      toast.error(error?.message || error?.detail || 'Falha ao anexar documento.');
    } finally {
      setBusyAction(null);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  }

  async function saveNote() {
    if (!selectedHearing || !noteDraft.trim()) return;
    await updateExtra(selectedHearing, (current) => ({
      ...current,
      notesHistory: [
        { id: crypto.randomUUID(), content: noteDraft.trim(), createdAt: new Date().toISOString(), author: currentUserName },
        ...(current.notesHistory || []),
      ],
      timeline: [
        ...(current.timeline || []),
        {
          id: crypto.randomUUID(),
          title: 'Anotacao adicionada',
          description: noteDraft.trim(),
          date: new Date().toISOString(),
          author: currentUserName,
        },
      ],
    }));
    setNoteDraft('');
    toast.success('Anotação salva no histórico da audiência.');
  }

  async function toggleReminder(field: 'oneDayBefore' | 'oneHourBefore', checked: boolean) {
    if (!selectedHearing) return;
    await updateExtra(selectedHearing, (current) => ({
      ...current,
      reminders: {
        oneDayBefore: current.reminders?.oneDayBefore ?? true,
        oneHourBefore: current.reminders?.oneHourBefore ?? true,
        [field]: checked,
      },
      timeline: [
        ...(current.timeline || []),
        {
          id: crypto.randomUUID(),
          title: 'Lembrete atualizado',
          description: checked ? `Lembrete ${field === 'oneDayBefore' ? 'de 1 dia' : 'de 1 hora'} ativado.` : `Lembrete ${field === 'oneDayBefore' ? 'de 1 dia' : 'de 1 hora'} desativado.`,
          date: new Date().toISOString(),
          author: currentUserName,
        },
      ],
    }));
  }

  const documentCategorySummary = useMemo(() => {
    const grouped: Record<string, number> = {};
    documentGroups.forEach((group) => {
      const category = String(group.latest.category || 'geral');
      grouped[category] = (grouped[category] || 0) + 1;
    });
    return Object.entries(grouped).slice(0, 4);
  }, [documentGroups]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Audiências</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel jurídico para acompanhar pauta, status, documentos, notas e histórico das audiências do escritório.
          </p>
        </div>
        <Button onClick={openCreate}>
          <CalendarPlus2 className="mr-2 h-4 w-4" />
          Nova audiência
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Hoje</p>
            <p className="mt-2 text-2xl font-semibold">{stats.today}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Próximas 72h</p>
            <p className="mt-2 text-2xl font-semibold">{stats.next72h}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Realizadas</p>
            <p className="mt-2 text-2xl font-semibold">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
            <CardTitle className="mr-auto text-base">Pauta de audiências</CardTitle>
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-9" placeholder="Buscar por tipo, CNJ ou cliente" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="agendada">Agendadas</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="realizada">Realizadas</SelectItem>
                <SelectItem value="adiada">Adiadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hearingsQuery.isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 rounded-lg bg-muted" />)}
            </div>
          ) : filteredHearings.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Nenhuma audiência encontrada"
                description="Ajuste os filtros ou cadastre uma nova audiência para iniciar o acompanhamento."
                action={{ label: 'Nova audiência', onClick: openCreate }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]" style={{ minWidth: 860 }}>
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                    <th className="px-4 py-2.5 text-left font-medium">Processo / Cliente</th>
                    <th className="px-4 py-2.5 text-left font-medium">Data / Hora</th>
                    <th className="px-4 py-2.5 text-left font-medium">Modalidade</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Atenção</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHearings.map((hearing) => {
                    const process = processMap[hearing.process];
                    const workflowStatus = workflowStatusFor(hearing);
                    const attention = hearingAttention(hearing.hearing_date, workflowStatus);
                    const selected = hearing.id === selectedHearing?.id;
                    return (
                      <tr
                        key={hearing.id}
                        onClick={() => setSelectedHearingId(hearing.id)}
                        className={cn(
                          'cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30',
                          selected && 'bg-primary/5',
                        )}
                      >
                        <td className="px-4 py-2.5 align-middle font-medium text-foreground">{hearing.type || 'Audiência'}</td>
                        <td className="px-4 py-2.5 align-middle">
                          <p className="max-w-[260px] truncate text-foreground">{buildProcessLabel(process)}</p>
                          <p className="max-w-[260px] truncate text-[11.5px] text-muted-foreground">{process?.client_name || process?.cliente_nome || 'Cliente não informado'}</p>
                        </td>
                        <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                          <p className="text-foreground">{formatDateOnly(hearing.hearing_date)}</p>
                          <p className="text-[11.5px] text-muted-foreground">{formatTimeOnly(hearing.hearing_date)}</p>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${modalityClasses(hearing.modality)}`}>
                            {modalityLabel(hearing.modality)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${workflowStatusClasses(workflowStatus)}`}>
                            {workflowStatusLabel(workflowStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          {attention ? (
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${attention.classes}`}>
                              {attention.label}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {selectedHearing ? (
          <div className="space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${workflowStatusClasses(selectedWorkflowStatus)}`}>
                        {workflowStatusLabel(selectedWorkflowStatus)}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${modalityClasses(selectedHearing.modality)}`}>
                        {modalityLabel(selectedHearing.modality)}
                      </span>
                      {selectedAttention ? (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${selectedAttention.classes}`}>
                          {selectedAttention.label}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{selectedHearing.type || 'Audiência'}</h2>
                      <p className="mt-1 text-sm font-medium text-foreground">{buildProcessLabel(selectedProcess)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedProcess?.client_name || selectedProcess?.cliente_nome || 'Cliente não informado'} · {selectedProcess?.tribunal || selectedProcess?.court || 'Tribunal não informado'} · {selectedProcess?.vara || selectedProcess?.court_division || 'Vara não informada'}
                      </p>
                    </div>
                    {selectedAttention ? <p className="max-w-2xl text-sm text-muted-foreground">{selectedAttention.helper}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:max-w-[360px] xl:justify-end">
                    <Button variant="outline" onClick={() => openEdit(selectedHearing)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" onClick={() => handleStatusAction('realizada', 'Audiência marcada como realizada.', 'Conclusão registrada no painel da audiência.')} disabled={busyAction !== null || selectedWorkflowStatus === 'realizada'}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Marcar como realizada
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setRescheduleDate(toDateTimeLocal(selectedHearing.hearing_date) || defaultDateTime(5, 9, 0));
                      setRescheduleEndDate(toDateTimeLocal(selectedHearing.end_date) || defaultDateTime(5, 10, 0));
                      setRescheduleOpen(true);
                    }} disabled={busyAction !== null}>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Remarcar
                    </Button>
                    <Button variant="outline" onClick={() => setCancelOpen(true)} disabled={busyAction !== null || selectedWorkflowStatus === 'cancelada'}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button variant="outline" onClick={() => noteEditorRef.current?.focus()}>
                      <Paperclip className="mr-2 h-4 w-4" />
                      Adicionar anotação
                    </Button>
                    <Button variant="outline" onClick={handleDuplicate} disabled={busyAction !== null}>
                      Duplicar
                    </Button>
                    <Button onClick={() => navigate(`/app/processos/${selectedHearing.process}`)}>
                      Ir para processo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <SectionCard title="Data e horário" description="Janela principal da pauta e leitura de tempo." icon={CalendarClock}>
                <div className="space-y-3">
                  <InfoLine label="Data" value={formatDateOnly(selectedHearing.hearing_date)} emphasize />
                  <InfoLine label="Hora de início" value={formatTimeOnly(selectedHearing.hearing_date)} />
                  <InfoLine label="Hora de fim" value={formatTimeOnly(selectedHearing.end_date)} />
                  <InfoLine label="Duração estimada" value={durationLabel(selectedHearing.hearing_date, selectedHearing.end_date)} />
                </div>
              </SectionCard>

              <SectionCard title="Local" description="Presencial ou online, com acesso rápido ao ambiente." icon={MapPin} action={
                selectedHearing.online_link ? (
                  <Button variant="outline" size="sm" onClick={() => window.open(selectedHearing.online_link || '#', '_blank', 'noopener,noreferrer')}>
                    Entrar na audiência
                  </Button>
                ) : undefined
              }>
                <div className="space-y-3">
                  <InfoLine label="Modalidade" value={modalityLabel(selectedHearing.modality)} emphasize />
                  <InfoLine label="Fórum" value={selectedExtra?.forum} />
                  <InfoLine label="Sala" value={selectedExtra?.room} />
                  <InfoLine label="Endereço completo" value={selectedExtra?.fullAddress || selectedHearing.location} />
                  <InfoLine label="Link da sala virtual" value={selectedHearing.online_link} />
                </div>
              </SectionCard>

              <SectionCard title="Processo" description="Contexto jurídico vinculado à audiência." icon={Scale}>
                <div className="space-y-3">
                  <InfoLine label="Número do processo" value={buildProcessLabel(selectedProcess)} emphasize />
                  <InfoLine label="Classe" value={selectedProcess?.classe || selectedProcess?.class_name} />
                  <InfoLine label="Tribunal" value={selectedProcess?.tribunal || selectedProcess?.court} />
                  <InfoLine label="Vara" value={selectedProcess?.vara || selectedProcess?.court_division} />
                  <InfoLine label="Comarca" value={selectedExtra?.comarca || selectedProcess?.comarca} />
                </div>
              </SectionCard>

              <SectionCard title="Envolvidos" description="Participantes centrais da audiência e responsáveis." icon={Users}>
                <div className="space-y-3">
                  <InfoLine label="Advogado responsável" value={selectedExtra?.responsibleLawyer} emphasize />
                  <InfoLine label="Cliente" value={selectedProcess?.client_name || selectedProcess?.cliente_nome} />
                  <InfoLine label="Parte contrária" value={selectedExtra?.opposingParty || selectedProcess?.polo_passivo || selectedProcess?.defendant} />
                  <InfoLine label="Juiz" value={selectedExtra?.judge} />
                  <InfoLine label="Promotor" value={selectedExtra?.prosecutor} />
                </div>
              </SectionCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_400px]">
              <SectionCard
                title="Documentos relacionados"
                description="Arquivos do processo com acesso rápido a peças, provas e anexos do cliente."
                icon={Files}
                action={
                  <>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleDocumentUpload(file);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => uploadInputRef.current?.click()} disabled={busyAction === 'document'}>
                      <Upload className="mr-2 h-4 w-4" />
                      Anexar novo
                    </Button>
                  </>
                }
              >
                <div className="space-y-4">
                  {documentCategorySummary.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {documentCategorySummary.map(([category, total]) => (
                        <span key={category} className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          {category} · {total}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {documentsQuery.isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-2xl bg-muted" />)}
                    </div>
                  ) : documentGroups.length === 0 ? (
                    <EmptyState
                      title="Nenhum documento vinculado"
                      description="Anexe peças, provas ou documentos do cliente diretamente a partir desta audiência."
                      action={{ label: 'Anexar arquivo', onClick: () => uploadInputRef.current?.click() }}
                    />
                  ) : (
                    <div className="space-y-3">
                      {documentGroups.slice(0, 6).map((group) => (
                        <div key={group.key} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-medium">{group.latest.title || group.latest.filename || 'Documento'}</p>
                            <p className="text-sm text-muted-foreground">
                              {String(group.latest.category || 'geral')} · {formatDocumentDate(group.latest.created_at)} · {formatFileSize(group.latest.file_size)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(getDocumentUrl(group.latest) || '#', '_blank', 'noopener,noreferrer')} disabled={!getDocumentUrl(group.latest)}>
                              Abrir
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.open(getDocumentUrl(group.latest) || '#', '_blank', 'noopener,noreferrer')} disabled={!getDocumentUrl(group.latest)}>
                              Baixar
                            </Button>
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                              {getDocumentKind(group.latest)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>

              <div className="space-y-6">
                <SectionCard title="Lembretes e alertas" description="Leitura operacional da pauta e avisos internos." icon={BellRing}>
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        {selectedAttention?.label === 'Atrasada' || selectedWorkflowStatus === 'cancelada' ? (
                          <CircleAlert className="mt-0.5 h-5 w-5 text-rose-600" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                        )}
                        <div>
                          <p className="font-medium">{selectedAttention?.label || 'Fluxo sob controle'}</p>
                          <p className="text-sm text-muted-foreground">{selectedAttention?.helper || 'Sem alertas críticos no momento.'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border p-4">
                      <div>
                        <p className="font-medium">Lembrar 1 dia antes</p>
                        <p className="text-sm text-muted-foreground">Aviso preparatório para revisar pauta e documentos.</p>
                      </div>
                      <Switch checked={selectedExtra?.reminders?.oneDayBefore ?? true} onCheckedChange={(checked) => toggleReminder('oneDayBefore', checked)} />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border p-4">
                      <div>
                        <p className="font-medium">Lembrar 1 hora antes</p>
                        <p className="text-sm text-muted-foreground">Aviso de última milha para deslocamento ou acesso online.</p>
                      </div>
                      <Switch checked={selectedExtra?.reminders?.oneHourBefore ?? true} onCheckedChange={(checked) => toggleReminder('oneHourBefore', checked)} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Anotações da audiência" description="Registro rápido de pontos importantes e orientações." icon={Paperclip}>
                  <div className="space-y-4">
                    <Textarea
                      ref={noteEditorRef}
                      rows={5}
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Ex.: Juiz solicitou prazo de 10 dias. Cliente aceitou proposta parcial."
                    />
                    <div className="flex justify-end">
                      <Button onClick={saveNote} disabled={!noteDraft.trim()}>
                        Salvar anotação
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {noteEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma anotação registrada ainda.</p>
                      ) : (
                        noteEntries.map((entry) => (
                          <div key={entry.id} className="rounded-2xl border p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{entry.content}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)} · {entry.author}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>

            <SectionCard title="Histórico" description="Linha do tempo da audiência com mudanças e registros relevantes." icon={History}>
              <div className="space-y-4">
                {timelineEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem eventos de histórico registrados.</p>
                ) : (
                  timelineEntries.map((entry) => (
                    <div key={entry.id} className="relative rounded-2xl border p-4 pl-6">
                      <span className="absolute left-3 top-6 h-2.5 w-2.5 rounded-full bg-primary" />
                      <p className="font-medium">{entry.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(entry.date)} · {entry.author}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma audiência selecionada"
            description="Escolha uma audiência da pauta para abrir o painel detalhado ou cadastre uma nova."
            action={{ label: 'Nova audiência', onClick: openCreate }}
          />
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar audiência' : 'Nova audiência'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Processo</Label>
              <Select value={form.process || '__none'} onValueChange={(value) => setForm((current) => ({ ...current, process: value === '__none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Selecione</SelectItem>
                  {processes.map((process) => (
                    <SelectItem key={process.id} value={process.id}>{buildProcessLabel(process)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo da audiência</Label>
              <Input value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} placeholder="Conciliação, instrução, julgamento..." />
            </div>

            <div className="space-y-2">
              <Label>Data e hora de início</Label>
              <Input type="datetime-local" value={form.hearing_date} onChange={(event) => setForm((current) => ({ ...current, hearing_date: event.target.value }))} />
              {dateConflicts.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-700 dark:bg-amber-950/40">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">⚠ Conflito de agenda</p>
                  <ul className="mt-1 space-y-0.5 text-amber-700 dark:text-amber-400">
                    {dateConflicts.map((conflict) => (
                      <li key={conflict.id}>
                        {new Date(conflict.hearing_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {' — '}{conflict.type || 'Audiência'}{conflict.process_cnj ? ` (${conflict.process_cnj})` : ''}
                        {conflict.responsible_name ? ` · ${conflict.responsible_name}` : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-amber-700/80 dark:text-amber-400/80">Você pode salvar mesmo assim, mas revise a pauta.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data e hora de fim</Label>
              <Input type="datetime-local" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select value={form.modality} onValueChange={(value) => setForm((current) => ({ ...current, modality: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hibrida">Híbrida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status operacional</Label>
              <Select value={form.workflowStatus} onValueChange={(value) => setForm((current) => ({ ...current, workflowStatus: value as WorkflowStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="adiada">Adiada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fórum</Label>
              <Input value={form.forum} onChange={(event) => setForm((current) => ({ ...current, forum: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Sala</Label>
              <Input value={form.room} onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Endereço ou local resumido</Label>
              <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Endereço completo</Label>
              <Input value={form.fullAddress} onChange={(event) => setForm((current) => ({ ...current, fullAddress: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Comarca</Label>
              <Input value={form.comarca} onChange={(event) => setForm((current) => ({ ...current, comarca: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Link da audiência online</Label>
              <Input value={form.online_link} onChange={(event) => setForm((current) => ({ ...current, online_link: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Advogado responsável</Label>
              <Input value={form.responsibleLawyer} onChange={(event) => setForm((current) => ({ ...current, responsibleLawyer: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Parte contrária</Label>
              <Input value={form.opposingParty} onChange={(event) => setForm((current) => ({ ...current, opposingParty: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Juiz</Label>
              <Input value={form.judge} onChange={(event) => setForm((current) => ({ ...current, judge: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Promotor</Label>
              <Input value={form.prosecutor} onChange={(event) => setForm((current) => ({ ...current, prosecutor: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações base</Label>
            <Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveForm} disabled={isSavingForm}>
              {isSavingForm ? 'Salvando...' : 'Salvar audiência'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarcar audiência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo início</Label>
              <Input type="datetime-local" value={rescheduleDate} onChange={(event) => setRescheduleDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Novo fim</Label>
              <Input type="datetime-local" value={rescheduleEndDate} onChange={(event) => setRescheduleEndDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Textarea rows={4} value={rescheduleReason} onChange={(event) => setRescheduleReason(event.target.value)} placeholder="Ex.: pauta redesignada pelo juízo." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Voltar</Button>
              <Button onClick={handleReschedule} disabled={busyAction !== null}>Confirmar remarcação</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar audiência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-rose-50/60 p-4 text-sm text-rose-700">
              Informe o motivo para registrar o cancelamento no histórico da audiência.
            </div>
            <div className="space-y-2">
              <Label>Motivo do cancelamento</Label>
              <Textarea rows={4} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Ex.: audiência retirada de pauta pelo juízo." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelOpen(false)}>Voltar</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={busyAction !== null}>Cancelar audiência</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
