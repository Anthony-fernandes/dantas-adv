import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  StatusBadge,
  deadlinePriorityVariant,
  deadlineStatusVariant,
  hearingModalityVariant,
  hearingStatusVariant,
  probExitoVariant,
  processStatusVariant,
} from '@/components/shared/status-badges';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  FileText,
  Gavel,
  History,
  Landmark,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  PenSquare,
  PlusCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserCircle2,
  Trash2,
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, apiGetAllPages } from '@/integrations/api/client';
import { processService } from '@/services/api';
import { invalidateProcessRelatedQueries } from '@/services/processQueryInvalidation';
import { deleteWorkspaceStateItem, loadWorkspaceStateMap, saveWorkspaceStateItem } from '@/services/workspaceState';
import { ProcessDocumentsCenter } from '@/components/process-documents/ProcessDocumentsCenter';
import { ProcessEditModal } from '@/components/processes/ProcessEditModal';
import type { ProcessFormValues } from '@/components/processes/ProcessValidation';
import { getDocumentUrl } from '@/components/process-documents/utils';
import { getPracticeAreaIcon, practiceAreaPillStyle, resolvePracticeAreaByCode, type PracticeAreaUiMeta } from '@/lib/practice-area';
import { cn } from '@/lib/utils';

type Paginated<T> = { results?: T[] } | T[];

type ProcessRecord = {
  id: string;
  cnj?: string | null;
  status?: string | null;
  probability?: string | null;
  area?: string | null;
  phase?: string | null;
  cause_value?: string | number | null;
  court?: string | null;
  court_division?: string | null;
  class_name?: string | null;
  subject?: string | null;
  plaintiff?: string | null;
  defendant?: string | null;
  notes?: string | null;
  client?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  updated_at?: string | null;
  responsaveis?: Array<{ id?: string | null; name?: string | null; full_name?: string | null }> | null;
};

type MovementRecord = {
  id: string;
  type?: string | null;
  date?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type DeadlineRecord = {
  id: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string | null;
};

type HearingRecord = {
  id: string;
  type?: string | null;
  hearing_date?: string | null;
  end_date?: string | null;
  location?: string | null;
  online_link?: string | null;
  modality?: string | null;
  status?: string | null;
  notes?: string | null;
};

type TimelineRecord = {
  id: string;
  type?: string | null;
  date?: string | null;
  title?: string | null;
  description?: string | null;
  actor?: string | null;
};

type DocumentRecord = {
  id: string;
  group_id?: string | null;
  title?: string | null;
  filename?: string | null;
  category?: string | null;
  version?: number | null;
  is_template?: boolean;
  file_download_url?: string | null;
  file_url?: string | null;
  created_at?: string | null;
  file_size?: number | null;
};

type ClientRecord = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  razao_social?: string | null;
};

type AreaRecord = {
  id: string;
  name?: string | null;
  area?: string | null;
  is_active?: boolean | null;
};

type EmployeeRecord = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type MovementAttachment = {
  id: string;
  title: string;
  filename: string;
  url: string;
  createdAt?: string | null;
};

type MovementExtraRecord = {
  authorName?: string;
  responsibleName?: string;
  attachments?: MovementAttachment[];
};

type MovementExtraMap = Record<string, MovementExtraRecord>;

type MovementFormPayload = {
  type: string;
  date: string;
  description: string;
  responsibleName: string;
  files: File[];
};

type DeadlineFormPayload = {
  description: string;
  due_date: string;
  priority: string;
  status: string;
};

type HearingFormPayload = {
  type?: string;
  hearing_date: string;
  end_date?: string;
  location?: string;
  online_link?: string;
  modality: string;
  status: string;
  notes?: string;
};

type ProcessFormState = {
  cnj: string;
  court: string;
  court_division: string;
  class_name: string;
  subject: string;
  area: string;
  phase: string;
  status: string;
  probability: string;
  cause_value: string;
  client: string;
  plaintiff: string;
  defendant: string;
  notes: string;
  responsibleId: string;
};

function asList<T>(data: Paginated<T> | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : (data.results ?? []);
}

function humanizeValue(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  const normalized = raw.replace(/_/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDisplayDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function formatDisplayDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(amount) ? amount : 0);
}

function defaultDate(daysAhead: number = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function defaultDateTime(daysAhead: number = 0, hours: number = 9, minutes: number = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hours, minutes, 0, 0);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function normalizeText(value?: string | null) {
  return String(value || '').trim().toLowerCase();
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  return Math.round((startTarget - startToday) / 86400000);
}

function isToday(value?: string | null) {
  return daysUntil(value) === 0;
}

function isSoon(value?: string | null, maxDays: number) {
  const diff = daysUntil(value);
  return diff !== null && diff >= 0 && diff <= maxDays;
}

function isOverdue(value?: string | null) {
  const diff = daysUntil(value);
  return diff !== null && diff < 0;
}

function latestDate(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));
  if (timestamps.length === 0) return undefined;
  return new Date(Math.max(...timestamps)).toISOString();
}

function toMovementAttachment(document: DocumentRecord): MovementAttachment {
  return {
    id: document.id,
    title: document.title || document.filename || 'Documento',
    filename: document.filename || document.title || 'arquivo',
    url: getDocumentUrl(document as any),
    createdAt: document.created_at,
  };
}

function processPhaseTone(value?: string | null) {
  const normalized = normalizeText(value);
  if (normalized === 'execucao' || normalized === 'cumprimento' || normalized === 'cumprimento_de_sentenca') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (normalized === 'recursal' || normalized === 'recurso') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function buildProcessForm(process: ProcessRecord, responsibleId?: string | null): ProcessFormState {
  return {
    cnj: process.cnj || '',
    court: process.court || '',
    court_division: process.court_division || '',
    class_name: process.class_name || '',
    subject: process.subject || '',
    area: process.area || 'civel',
    phase: process.phase || 'conhecimento',
    status: process.status || 'em_andamento',
    probability: process.probability || 'media',
    cause_value: process.cause_value != null ? String(process.cause_value) : '',
    client: getProcessClientId(process) || '',
    plaintiff: process.plaintiff || '',
    defendant: process.defendant || '',
    notes: process.notes || '',
    responsibleId: responsibleId || '',
  };
}

function getProcessClientId(process?: ProcessRecord) {
  return String(process?.client ?? process?.client_id ?? '').trim() || undefined;
}

function MovementForm({
  onSubmit,
  isLoading,
  initialValue,
  submitLabel,
  onCancel,
  currentUserName,
}: {
  onSubmit: (payload: MovementFormPayload) => Promise<unknown>;
  isLoading: boolean;
  initialValue?: {
    type?: string | null;
    date?: string | null;
    description?: string | null;
    responsibleName?: string | null;
  };
  submitLabel?: string;
  onCancel?: () => void;
  currentUserName: string;
}) {
  const [type, setType] = useState('outro');
  const [date, setDate] = useState(defaultDate());
  const [description, setDescription] = useState('');
  const [responsibleName, setResponsibleName] = useState(currentUserName);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    setType(initialValue?.type || 'outro');
    setDate(initialValue?.date ? String(initialValue.date).slice(0, 10) : defaultDate());
    setDescription(initialValue?.description || '');
    setResponsibleName(initialValue?.responsibleName || currentUserName);
    setFiles([]);
  }, [currentUserName, initialValue?.date, initialValue?.description, initialValue?.responsibleName, initialValue?.type]);

  async function handleSubmit() {
    if (!description.trim()) {
      toast.error('Informe a descrição do andamento.');
      return;
    }

    await onSubmit({
      type,
      date,
      description: description.trim(),
      responsibleName: responsibleName.trim() || currentUserName,
      files,
    });

    setType('outro');
    setDate(defaultDate());
    setDescription('');
    setResponsibleName(currentUserName);
    setFiles([]);
  }

  return (
    <div className="grid gap-4 rounded-lg border p-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="despacho">Despacho</SelectItem>
              <SelectItem value="decisao">Decisão</SelectItem>
              <SelectItem value="sentenca">Sentença</SelectItem>
              <SelectItem value="peticao">Petição</SelectItem>
              <SelectItem value="audiencia">Audiência</SelectItem>
              <SelectItem value="publicacao">Publicação</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Responsável</Label>
          <Input value={responsibleName} onChange={(event) => setResponsibleName(event.target.value)} placeholder="Responsável pelo registro" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Descrição</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descreva o andamento ocorrido no processo."
        />
      </div>
      <div className="grid gap-2">
        <Label>Anexos do andamento</Label>
        <Input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} />
        <p className="text-xs text-muted-foreground">
          {files.length > 0 ? `${files.length} arquivo(s) selecionado(s). Eles também serão enviados para a central de documentos.` : 'Opcional. PDF, imagem e outros arquivos podem ser vinculados ao andamento.'}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Salvando...' : submitLabel || 'Adicionar andamento'}
        </Button>
      </div>
    </div>
  );
}

function DeadlineForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (payload: DeadlineFormPayload) => Promise<unknown>;
  isLoading: boolean;
}) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(defaultDateTime(7, 18, 0));
  const [priority, setPriority] = useState('media');
  const [status, setStatus] = useState('pendente');

  async function handleSubmit() {
    if (!description.trim() || !dueDate) {
      toast.error('Informe a descrição e o vencimento do prazo.');
      return;
    }

    await onSubmit({
      description: description.trim(),
      due_date: dueDate,
      priority,
      status,
    });

    setDescription('');
    setDueDate(defaultDateTime(7, 18, 0));
    setPriority('media');
    setStatus('pendente');
  }

  return (
    <div className="grid gap-4 rounded-lg border p-4">
      <div className="grid gap-2">
        <Label>Descrição</Label>
        <Textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ex.: protocolar manifestação, anexar documentos, apresentar defesa."
        />
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Vencimento</Label>
          <Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
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
      </div>
      <div className="grid gap-2">
        <Label>Status inicial</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Adicionar prazo'}
        </Button>
      </div>
    </div>
  );
}

function HearingForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (payload: HearingFormPayload) => Promise<unknown>;
  isLoading: boolean;
}) {
  const [type, setType] = useState('');
  const [hearingDate, setHearingDate] = useState(defaultDateTime(3, 9, 0));
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [onlineLink, setOnlineLink] = useState('');
  const [modality, setModality] = useState('presencial');
  const [status, setStatus] = useState('agendada');
  const [notes, setNotes] = useState('');

  async function handleSubmit() {
    if (!hearingDate) {
      toast.error('Informe a data da audiência.');
      return;
    }

    await onSubmit({
      type: type.trim() || undefined,
      hearing_date: hearingDate,
      end_date: endDate || undefined,
      location: location.trim() || undefined,
      online_link: onlineLink.trim() || undefined,
      modality,
      status,
      notes: notes.trim() || undefined,
    });

    setType('');
    setHearingDate(defaultDateTime(3, 9, 0));
    setEndDate('');
    setLocation('');
    setOnlineLink('');
    setModality('presencial');
    setStatus('agendada');
    setNotes('');
  }

  return (
    <div className="grid gap-4 rounded-lg border p-4">
      <div className="grid gap-2">
        <Label>Tipo da audiência</Label>
        <Input
          value={type}
          onChange={(event) => setType(event.target.value)}
          placeholder="Instrução, conciliação, julgamento..."
        />
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Data e hora</Label>
          <Input
            type="datetime-local"
            value={hearingDate}
            onChange={(event) => setHearingDate(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Fim</Label>
          <Input type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Modalidade</Label>
          <Select value={modality} onValueChange={setModality}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="hibrida">Híbrida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agendada">Agendada</SelectItem>
              <SelectItem value="realizada">Realizada</SelectItem>
              <SelectItem value="redesignada">Redesignada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Local</Label>
          <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Fórum, sala, endereço..." />
        </div>
        <div className="grid gap-2">
          <Label>Link online</Label>
          <Input value={onlineLink} onChange={(event) => setOnlineLink(event.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Adicionar audiência'}
        </Button>
      </div>
    </div>
  );
}

export default function ProcessDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeTenantId, isLoadingTenants } = useTenant();
  const { profile } = useAuth();
  const currentUserName = profile?.full_name?.trim() || 'Equipe do escritório';

  const processId = id ?? '';
  const [editProcessOpen, setEditProcessOpen] = useState(false);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [movementExtraMap, setMovementExtraMap] = useState<MovementExtraMap>({});
  const [processForm, setProcessForm] = useState<ProcessFormState>({
    cnj: '',
    court: '',
    court_division: '',
    class_name: '',
    subject: '',
    area: 'civel',
    phase: 'conhecimento',
    status: 'em_andamento',
    probability: 'media',
    cause_value: '',
    client: '',
    plaintiff: '',
    defendant: '',
    notes: '',
    responsibleId: '',
  });

  const practiceAreaUiQuery = useQuery({
    queryKey: ['workspace-state', 'practice_area_ui', activeTenantId],
    queryFn: () => loadWorkspaceStateMap<PracticeAreaUiMeta>('practice_area_ui'),
    enabled: Boolean(activeTenantId),
  });

  const processMetaQuery = useQuery({
    queryKey: ['workspace-state', 'process_ui', activeTenantId],
    queryFn: () => loadWorkspaceStateMap<{ responsibleId?: string; responsibleName?: string }>('process_ui'),
    enabled: Boolean(activeTenantId),
  });

  const movementExtrasQuery = useQuery({
    queryKey: ['workspace-state', 'process_movement_ui', activeTenantId, processId],
    queryFn: () => loadWorkspaceStateMap<MovementExtraRecord>('process_movement_ui', processId),
    enabled: Boolean(activeTenantId && processId),
  });

  useEffect(() => {
    setMovementExtraMap(movementExtrasQuery.data ?? {});
  }, [movementExtrasQuery.data]);

  const processQuery = useQuery({
    queryKey: ['process', activeTenantId, processId],
    queryFn: async () => await processService.get(processId),
    enabled: Boolean(processId && activeTenantId),
  });

  const movementsQuery = useQuery({
    queryKey: ['process', activeTenantId, processId, 'movements'],
    queryFn: async () => await processService.movements(processId),
    enabled: Boolean(processId && activeTenantId),
  });

  const deadlinesQuery = useQuery({
    queryKey: ['process', activeTenantId, processId, 'deadlines'],
    queryFn: async () => await processService.deadlines(processId),
    enabled: Boolean(processId && activeTenantId),
  });

  const hearingsQuery = useQuery({
    queryKey: ['process', activeTenantId, processId, 'hearings'],
    queryFn: async () => await processService.hearings(processId),
    enabled: Boolean(processId && activeTenantId),
  });

  const documentsQuery = useQuery({
    queryKey: ['process', activeTenantId, processId, 'documents'],
    queryFn: async () => await processService.documents(processId),
    enabled: Boolean(processId && activeTenantId),
  });

  const timelineQuery = useQuery({
    queryKey: ['process-timeline', activeTenantId, processId],
    queryFn: async () => await processService.timeline(processId),
    enabled: Boolean(processId && activeTenantId),
  });

  const clientsQuery = useQuery({
    queryKey: ['process-detail-clients', activeTenantId],
    queryFn: async () => await apiGetAllPages<ClientRecord>('/clients/'),
    enabled: Boolean(activeTenantId),
  });

  const areasQuery = useQuery({
    queryKey: ['process-detail-areas', activeTenantId],
    queryFn: async () => await apiGetAllPages<AreaRecord>('/causes/'),
    enabled: Boolean(activeTenantId),
  });

  const employeesQuery = useQuery({
    queryKey: ['process-detail-employees', activeTenantId],
    queryFn: async () => await apiGetAllPages<EmployeeRecord>('/employees/'),
    enabled: Boolean(activeTenantId),
  });

  const process = processQuery.data as ProcessRecord | undefined;
  const movements = useMemo(() => asList<MovementRecord>(movementsQuery.data as Paginated<MovementRecord> | undefined), [movementsQuery.data]);
  const deadlines = useMemo(() => asList<DeadlineRecord>(deadlinesQuery.data as Paginated<DeadlineRecord> | undefined), [deadlinesQuery.data]);
  const hearings = useMemo(() => asList<HearingRecord>(hearingsQuery.data as Paginated<HearingRecord> | undefined), [hearingsQuery.data]);
  const documents = useMemo(() => asList<DocumentRecord>(documentsQuery.data as Paginated<DocumentRecord> | undefined), [documentsQuery.data]);
  const timelineItems = (timelineQuery.data as TimelineRecord[] | undefined) ?? [];
  const clients = clientsQuery.data ?? [];
  const areas = areasQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const practiceAreaUiMap = practiceAreaUiQuery.data ?? {};
  const clientMap = useMemo(
    () =>
      Object.fromEntries(
        clients.map((client) => [client.id, String(client.name || client.full_name || client.razao_social || 'Cliente').trim()] as const),
      ),
    [clients],
  );
  const employeeOptions = useMemo(
    () =>
      employees
        .filter((employee) => employee.is_active !== false)
        .map((employee) => ({
          value: employee.id,
          label: employee.full_name || employee.email || 'Responsável',
        })),
    [employees],
  );
  const storedProcessMeta = processMetaQuery.data?.[processId] || null;
  const tabOptions = ['movements', 'deadlines', 'timeline', 'hearings', 'documents'];
  const requestedTab = searchParams.get('tab') || '';
  const activeTab = tabOptions.includes(requestedTab) ? requestedTab : 'movements';

  useEffect(() => {
    if (!process) return;
    const backendResponsibleId = process.responsaveis?.[0]?.id ? String(process.responsaveis[0].id) : '';
    setProcessForm(buildProcessForm(process, backendResponsibleId || storedProcessMeta?.responsibleId || ''));
  }, [process, storedProcessMeta?.responsibleId]);

  const clientName = process?.client_name || process?.cliente_nome || (process ? clientMap[getProcessClientId(process) || ''] : '') || 'Cliente não informado';
  const responsibleName = useMemo(() => {
    const backendNames = (process?.responsaveis || []).map((item) => item?.name || item?.full_name || '').filter(Boolean);
    if (backendNames.length > 0) return backendNames.join(', ');
    if (storedProcessMeta?.responsibleName) return storedProcessMeta.responsibleName;
    const employeeName = employeeOptions.find((item) => item.value === processForm.responsibleId)?.label;
    return employeeName || currentUserName;
  }, [currentUserName, employeeOptions, process?.responsaveis, processForm.responsibleId, storedProcessMeta?.responsibleName]);

  const areaMeta = process
    ? resolvePracticeAreaByCode(process.area, areas, practiceAreaUiMap)
    : resolvePracticeAreaByCode(undefined, areas, practiceAreaUiMap);
  const AreaIcon = getPracticeAreaIcon(areaMeta.icon);

  const sortedDeadlines = useMemo(
    () =>
      [...deadlines].sort((left, right) => new Date(left.due_date || 0).getTime() - new Date(right.due_date || 0).getTime()),
    [deadlines],
  );
  const sortedHearings = useMemo(
    () =>
      [...hearings].sort((left, right) => new Date(left.hearing_date || 0).getTime() - new Date(right.hearing_date || 0).getTime()),
    [hearings],
  );
  const nextDeadline = sortedDeadlines.find((item) => normalizeText(item.status) !== 'concluido' && (daysUntil(item.due_date) ?? 9999) >= 0) || sortedDeadlines[0] || null;
  const nextHearing = sortedHearings.find((item) => (daysUntil(item.hearing_date) ?? 9999) >= 0) || sortedHearings[0] || null;
  const latestUpdatedAt = latestDate([
    process?.updated_at,
    ...movements.map((item) => item.updated_at || item.created_at || item.date),
    ...deadlines.map((item) => item.due_date),
    ...hearings.map((item) => item.hearing_date),
    ...documents.map((item) => item.created_at),
    ...timelineItems.map((item) => item.date),
  ]);
  const movementEditing = editingMovementId ? movements.find((movement) => movement.id === editingMovementId) || null : null;

  const alertItems = [
    nextDeadline && isOverdue(nextDeadline.due_date)
      ? { id: 'deadline-overdue', title: 'Prazo vencido', description: `${nextDeadline.description || 'Prazo processual'} em ${formatDisplayDateTime(nextDeadline.due_date)}`, tone: 'danger' as const }
      : null,
    nextDeadline && !isOverdue(nextDeadline.due_date) && isSoon(nextDeadline.due_date, 3)
      ? { id: 'deadline-soon', title: 'Prazo próximo', description: `${nextDeadline.description || 'Prazo processual'} em ${formatDisplayDateTime(nextDeadline.due_date)}`, tone: 'warning' as const }
      : null,
    nextHearing && isToday(nextHearing.hearing_date)
      ? { id: 'hearing-today', title: 'Audiência hoje', description: `${nextHearing.type || 'Audiência'} em ${formatDisplayDateTime(nextHearing.hearing_date)}`, tone: 'info' as const }
      : null,
    nextHearing && !isToday(nextHearing.hearing_date) && isSoon(nextHearing.hearing_date, 7)
      ? { id: 'hearing-soon', title: 'Audiência próxima', description: `${nextHearing.type || 'Audiência'} em ${formatDisplayDateTime(nextHearing.hearing_date)}`, tone: 'info' as const }
      : null,
  ].filter(Boolean) as Array<{ id: string; title: string; description: string; tone: 'danger' | 'warning' | 'info' }>;

  const unifiedTimeline = useMemo(() => {
    const items = [
      ...timelineItems.map((item) => ({
        id: `timeline-${item.id}`,
        date: item.date || null,
        title: item.title || humanizeValue(item.type),
        description: item.description || '',
        label: humanizeValue(item.type),
        actor: item.actor || '',
      })),
      ...movements.map((item) => ({
        id: `movement-${item.id}`,
        date: item.date || item.created_at || null,
        title: humanizeValue(item.type),
        description: item.description || '',
        label: 'Andamento',
        actor: movementExtraMap[item.id]?.authorName || movementExtraMap[item.id]?.responsibleName || '',
      })),
      ...deadlines.map((item) => ({
        id: `deadline-${item.id}`,
        date: item.due_date || null,
        title: item.description || 'Prazo processual',
        description: `Status: ${humanizeValue(item.status)} - Prioridade: ${humanizeValue(item.priority)}`,
        label: 'Prazo',
        actor: '',
      })),
      ...hearings.map((item) => ({
        id: `hearing-${item.id}`,
        date: item.hearing_date || null,
        title: item.type || 'Audiência',
        description: [item.location, item.notes].filter(Boolean).join(' - '),
        label: 'Audiência',
        actor: '',
      })),
      ...documents.map((item) => ({
        id: `document-${item.id}`,
        date: item.created_at || null,
        title: item.title || item.filename || 'Documento',
        description: humanizeValue(item.category),
        label: 'Documento',
        actor: '',
      })),
    ];

    return items.sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime());
  }, [deadlines, documents, hearings, movementExtraMap, movements, timelineItems]);

  async function uploadMovementFiles(files: File[]) {
    const uploaded: MovementAttachment[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('category', 'peticao');
      const document = await processService.uploadDocument(processId, formData);
      uploaded.push(toMovementAttachment(document as unknown as DocumentRecord));
    }
    return uploaded;
  }

  const updateMovementExtra = async (movementId: string, updater: (current: MovementExtraRecord) => MovementExtraRecord) => {
    let nextMap: MovementExtraMap = {};
    setMovementExtraMap((current) => {
      nextMap = {
        ...current,
        [movementId]: updater(current[movementId] || {}),
      };
      return nextMap;
    });
    await saveWorkspaceStateItem('process_movement_ui', movementId, nextMap[movementId], processId);
    queryClient.setQueryData(['workspace-state', 'process_movement_ui', activeTenantId, processId], nextMap);
  };

  const removeMovementExtra = async (movementId: string) => {
    let nextMap: MovementExtraMap = {};
    setMovementExtraMap((current) => {
      nextMap = { ...current };
      delete nextMap[movementId];
      return nextMap;
    });
    await deleteWorkspaceStateItem('process_movement_ui', movementId, processId);
    queryClient.setQueryData(['workspace-state', 'process_movement_ui', activeTenantId, processId], nextMap);
  };

  const updateProcessMutation = useMutation({
    mutationFn: async (payload: ProcessFormState) => {
      const body = {
        cnj: payload.cnj || null,
        court: payload.court || null,
        court_division: payload.court_division || null,
        class_name: payload.class_name || null,
        subject: payload.subject || null,
        area: payload.area,
        phase: payload.phase,
        status: payload.status,
        probability: payload.probability,
        cause_value: payload.cause_value ? parseFloat(payload.cause_value) : 0,
        client: payload.client || null,
        plaintiff: payload.plaintiff || null,
        defendant: payload.defendant || null,
        notes: payload.notes || null,
      };
      return await processService.update(processId, body as any);
    },
    onSuccess: async () => {
      if (activeTenantId) {
        const nextMeta = {
          responsibleId: processForm.responsibleId || '',
          responsibleName: employeeOptions.find((item) => item.value === processForm.responsibleId)?.label || '',
        };
        await saveWorkspaceStateItem('process_ui', processId, nextMeta);
        queryClient.setQueryData(['workspace-state', 'process_ui', activeTenantId], {
          ...(processMetaQuery.data ?? {}),
          [processId]: nextMeta,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId] }),
        queryClient.invalidateQueries({ queryKey: ['processes-workspace', activeTenantId] }),
      ]);
      toast.success('Processo atualizado.');
      setEditProcessOpen(false);
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao atualizar processo.'),
  });

  const richUpdateProcessMutation = useMutation({
    mutationFn: async ({
      payload,
      values,
    }: {
      payload: Record<string, unknown>;
      values: ProcessFormValues;
    }) => await processService.update(processId, payload as any),
    onSuccess: async (_data, variables) => {
      if (activeTenantId) {
        const nextMeta = {
          responsibleId: variables.values.responsibleId || '',
          responsibleName: employeeOptions.find((item) => item.value === variables.values.responsibleId)?.label || '',
        };
        await saveWorkspaceStateItem('process_ui', processId, nextMeta);
        queryClient.setQueryData(['workspace-state', 'process_ui', activeTenantId], {
          ...(processMetaQuery.data ?? {}),
          [processId]: nextMeta,
        });
      }

      await invalidateProcessRelatedQueries(queryClient, activeTenantId);
      toast.success('Processo atualizado.');
      setEditProcessOpen(false);
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao atualizar processo.'),
  });

  const addMovement = useMutation({
    mutationFn: async (payload: MovementFormPayload) => {
      const movement = await processService.addMovement(processId, {
        type: payload.type,
        date: payload.date,
        description: payload.description,
      } as any);
      const attachments = payload.files.length > 0 ? await uploadMovementFiles(payload.files) : [];
      return { movement: movement as unknown as MovementRecord, attachments, responsibleName: payload.responsibleName };
    },
    onSuccess: async ({ movement, attachments, responsibleName }) => {
      await updateMovementExtra(movement.id, (current) => ({
        ...current,
        authorName: currentUserName,
        responsibleName: responsibleName || currentUserName,
        attachments: [...(current.attachments || []), ...attachments],
      }));
      await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'movements'] }),
      queryClient.invalidateQueries({ queryKey: ['process-timeline', activeTenantId, processId] }),
      queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'documents'] }),
      ]);
      toast.success('Andamento adicionado.');
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao adicionar andamento.'),
  });

  const editMovement = useMutation({
    mutationFn: async (payload: MovementFormPayload) => {
      if (!editingMovementId) throw new Error('Andamento invalido.');
      const movement = await api.patch<MovementRecord>(`/movements/${editingMovementId}/`, {
        type: payload.type,
        date: payload.date,
        description: payload.description,
      });
      const attachments = payload.files.length > 0 ? await uploadMovementFiles(payload.files) : [];
      return { movement, attachments, responsibleName: payload.responsibleName };
    },
    onSuccess: async ({ movement, attachments, responsibleName }) => {
      await updateMovementExtra(movement.id, (current) => ({
        ...current,
        authorName: current.authorName || currentUserName,
        responsibleName: responsibleName || current.responsibleName || currentUserName,
        attachments: [...(current.attachments || []), ...attachments],
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'movements'] }),
        queryClient.invalidateQueries({ queryKey: ['process-timeline', activeTenantId, processId] }),
        queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'documents'] }),
      ]);
      toast.success('Andamento atualizado.');
      setEditingMovementId(null);
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao atualizar andamento.'),
  });

  const deleteMovement = useMutation({
    mutationFn: async (movementId: string) => {
      await api.delete(`/movements/${movementId}/`);
      return movementId;
    },
    onSuccess: async (movementId) => {
      await removeMovementExtra(movementId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'movements'] }),
        queryClient.invalidateQueries({ queryKey: ['process-timeline', activeTenantId, processId] }),
      ]);
      toast.success('Andamento excluído.');
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao excluir andamento.'),
  });

  const addDeadline = useMutation({
    mutationFn: async (payload: DeadlineFormPayload) => await processService.addDeadline(processId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'deadlines'] }),
        queryClient.invalidateQueries({ queryKey: ['process-timeline', activeTenantId, processId] }),
      ]);
      toast.success('Prazo adicionado.');
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao adicionar prazo.'),
  });

  const addHearing = useMutation({
    mutationFn: async (payload: HearingFormPayload) => await processService.addHearing(processId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'hearings'] }),
        queryClient.invalidateQueries({ queryKey: ['process-timeline', activeTenantId, processId] }),
      ]);
      toast.success('Audiência adicionada.');
    },
    onError: (error: any) => toast.error(error?.message || error?.detail || 'Erro ao adicionar audiência.'),
  });

  const openTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'movements') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  if (isLoadingTenants || (activeTenantId && processQuery.isLoading)) {
    return (
      <div className="page-container space-y-4">
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-40 rounded bg-muted" />
        <div className="h-72 rounded bg-muted" />
      </div>
    );
  }

  if (!activeTenantId) {
    return (
      <div className="page-container space-y-4">
        <Button variant="ghost" onClick={() => navigate('/app/processos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <p className="text-sm text-muted-foreground">
          Selecione um escritório no topo para carregar os dados do processo.
        </p>
      </div>
    );
  }

  if (processQuery.isError) {
    return (
      <div className="page-container space-y-4">
        <Button variant="ghost" onClick={() => navigate('/app/processos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <p className="text-sm text-destructive">Não foi possível carregar este processo.</p>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="page-container space-y-4">
        <Button variant="ghost" onClick={() => navigate('/app/processos')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <p className="text-sm text-muted-foreground">Processo não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      <Card className="overflow-hidden border-border/60 shadow-card">
        <CardContent className="space-y-8 p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between xl:gap-8">
            <div className="space-y-5">
              <div className="flex flex-col items-start gap-3">
                <Button variant="ghost" onClick={() => navigate('/app/processos')} className="w-fit px-0 hover:bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para processos
                </Button>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Centro operacional do processo
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">{process.cnj || 'Processo sem CNJ'}</h1>
                  <StatusBadge text={humanizeValue(process.status)} variant={processStatusVariant(process.status ?? undefined)} />
                  <StatusBadge text={`Probabilidade: ${humanizeValue(process.probability)}`} variant={probExitoVariant(process.probability ?? undefined)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold" style={practiceAreaPillStyle(areaMeta.color)}>
                    <AreaIcon className="h-3.5 w-3.5" />
                    {areaMeta.label}
                  </span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize border-emerald-200 bg-emerald-50 text-emerald-700">
                    {humanizeValue(process.phase)}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <HeaderInfo icon={UserCircle2} label="Cliente" value={clientName} />
                  <HeaderInfo icon={Scale} label="Parte contrária" value={process.defendant || '-'} />
                  <HeaderInfo icon={Landmark} label="Tribunal / Vara" value={[process.court_division, process.court].filter(Boolean).join(' - ') || '-'} />
                  <HeaderInfo icon={ShieldCheck} label="Advogado responsável" value={responsibleName} />
                </div>
              </div>
            </div>

            <div className="flex w-full justify-start xl:w-auto xl:justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="justify-start">
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    Mais ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openTab('movements')}>
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Novo andamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate(`/app/agenda?q=${encodeURIComponent(process.cnj || clientName)}`)}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Abrir agenda relacionada
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => openTab('timeline')}>
                    <History className="mr-2 h-4 w-4" />
                    Ver timeline geral
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {alertItems.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {alertItems.map((alert) => (
                <AlertCard key={alert.id} title={alert.title} description={alert.description} tone={alert.tone} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-800">
              Nenhum alerta crítico no momento. O processo está sem prazo vencido e sem audiência imediata.
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={() => openTab('movements')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              + Andamento
            </Button>
            <Button size="sm" variant="outline" onClick={() => openTab('deadlines')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              + Prazo
            </Button>
            <Button size="sm" variant="outline" onClick={() => openTab('hearings')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              + Audiência
            </Button>
            <Button size="sm" variant="outline" onClick={() => openTab('documents')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              + Documento
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={BriefcaseBusiness} label="Área" value={areaMeta.label} helper="Especialidade principal do caso." />
        <SummaryCard icon={TimerReset} label="Fase" value={humanizeValue(process.phase)} helper={process.class_name || 'Classe processual'} />
        <SummaryCard icon={Landmark} label="Tribunal / Vara" value={[process.court_division, process.court].filter(Boolean).join(' - ') || '-'} helper={process.subject || 'Assunto não informado'} />
        <SummaryCard icon={Scale} label="Valor da causa" value={formatMoney(process.cause_value)} helper={`Última atualização: ${formatDisplayDateTime(latestUpdatedAt)}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Resumo do processo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoRow label="Classe" value={process.class_name || '-'} />
            <InfoRow label="Assunto" value={process.subject || '-'} />
            <InfoRow label="Cliente" value={clientName} />
            <InfoRow label="Autor" value={process.plaintiff || '-'} />
            <InfoRow label="Réu" value={process.defendant || '-'} />
            <InfoRow label="Responsável" value={responsibleName} />
            <InfoRow label="Próximo prazo" value={nextDeadline ? `${nextDeadline.description || 'Prazo processual'} - ${formatDisplayDateTime(nextDeadline.due_date)}` : 'Sem prazo cadastrado'} />
            <InfoRow label="Próxima audiência" value={nextHearing ? `${nextHearing.type || 'Audiência'} - ${formatDisplayDateTime(nextHearing.hearing_date)}` : 'Sem audiência cadastrada'} />
            <InfoRow label="CNJ" value={process.cnj || '-'} />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Visão rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickMetric label="Andamentos" value={String(movements.length)} />
            <QuickMetric label="Prazos" value={String(deadlines.length)} />
            <QuickMetric label="Audiências" value={String(hearings.length)} />
            <QuickMetric label="Documentos" value={String(documents.length)} />
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams);
          if (value === 'movements') next.delete('tab');
          else next.set('tab', value);
          setSearchParams(next, { replace: true });
        }}
        className="w-full space-y-4"
      >
        <TabsList className="flex h-auto flex-wrap justify-start gap-3 bg-transparent p-0">
          <TabsTrigger value="movements">
            <MessageSquareText className="mr-2 h-4 w-4" />
            Andamentos
          </TabsTrigger>
          <TabsTrigger value="deadlines">
            <CalendarClock className="mr-2 h-4 w-4" />
            Prazos
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <History className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="hearings">
            <Gavel className="mr-2 h-4 w-4" />
            Audiências
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle>{editingMovementId ? 'Editar andamento' : 'Adicionar andamento'}</CardTitle>
              </CardHeader>
              <CardContent>
                <MovementForm
                  onSubmit={async (payload) => {
                    if (editingMovementId) {
                      await editMovement.mutateAsync(payload);
                      return;
                    }
                    await addMovement.mutateAsync(payload);
                  }}
                  isLoading={addMovement.isPending || editMovement.isPending}
                  currentUserName={currentUserName}
                  submitLabel={editingMovementId ? 'Salvar andamento' : 'Adicionar andamento'}
                  initialValue={
                    movementEditing
                      ? {
                          type: movementEditing.type,
                          date: movementEditing.date,
                          description: movementEditing.description,
                          responsibleName: movementExtraMap[movementEditing.id]?.responsibleName || currentUserName,
                        }
                      : undefined
                  }
                  onCancel={editingMovementId ? () => setEditingMovementId(null) : undefined}
                />
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle>Timeline de andamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {movementsQuery.isError ? (
                  <p className="text-sm text-destructive">Não foi possível carregar os andamentos.</p>
                ) : movements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem andamentos cadastrados.</p>
                ) : (
                  <div className="space-y-4">
                    {[...movements]
                      .sort((left, right) => new Date(right.date || right.created_at || 0).getTime() - new Date(left.date || left.created_at || 0).getTime())
                      .map((movement) => {
                        const extra = movementExtraMap[movement.id] || {};
                        return (
                          <div key={movement.id} className="relative rounded-2xl border border-border/70 p-5 pl-8">
                            <span className="absolute left-4 top-6 h-2.5 w-2.5 rounded-full bg-primary" />
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-foreground">{humanizeValue(movement.type)}</span>
                                  <span className="text-xs text-muted-foreground">{formatDisplayDate(movement.date)}</span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{movement.description || '-'}</p>
                                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                  <span>Responsável: {extra.responsibleName || currentUserName}</span>
                                  <span>Criado por: {extra.authorName || currentUserName}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setEditingMovementId(movement.id)}>
                                  <PenSquare className="mr-2 h-4 w-4" />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    if (window.confirm('Deseja excluir este andamento?')) {
                                      deleteMovement.mutate(movement.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </Button>
                              </div>
                            </div>

                            {extra.attachments?.length ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {extra.attachments.map((attachment) => (
                                  <a
                                    key={attachment.id}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
                                  >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    {attachment.title}
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deadlines">
          <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle>Novo prazo</CardTitle>
              </CardHeader>
              <CardContent>
                <DeadlineForm onSubmit={async (payload) => await addDeadline.mutateAsync(payload)} isLoading={addDeadline.isPending} />
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle>Controle de prazos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deadlinesQuery.isError ? (
                  <p className="text-sm text-destructive">Não foi possível carregar os prazos.</p>
                ) : deadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem prazos cadastrados.</p>
                ) : (
                  [...sortedDeadlines].map((deadline) => (
                    <div
                      key={deadline.id}
                      className={cn(
                        'rounded-2xl border p-4',
                        isOverdue(deadline.due_date) && normalizeText(deadline.status) !== 'concluido' && 'border-red-200 bg-red-50/60',
                        !isOverdue(deadline.due_date) && isSoon(deadline.due_date, 3) && 'border-amber-200 bg-amber-50/60',
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{deadline.description || '-'}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{formatDisplayDateTime(deadline.due_date)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge text={humanizeValue(deadline.priority)} variant={deadlinePriorityVariant(deadline.priority ?? undefined)} />
                          <StatusBadge text={humanizeValue(deadline.status)} variant={deadlineStatusVariant(deadline.status ?? undefined)} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle>Timeline unificada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timelineQuery.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => <div key={item} className="h-16 rounded bg-muted" />)}
                </div>
              ) : unifiedTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos na timeline.</p>
              ) : (
                unifiedTimeline.map((item) => (
                  <div key={item.id} className="relative rounded-2xl border border-border/70 p-4 pl-8">
                    <span className="absolute left-4 top-6 h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDisplayDateTime(item.date)} - {item.label}
                          {item.actor ? ` - ${item.actor}` : ''}
                        </div>
                      </div>
                    </div>
                    {item.description ? <div className="mt-2 whitespace-pre-wrap text-sm">{item.description}</div> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hearings">
          <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle>Nova audiência</CardTitle>
              </CardHeader>
              <CardContent>
                <HearingForm onSubmit={async (payload) => await addHearing.mutateAsync(payload)} isLoading={addHearing.isPending} />
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-card">
              <CardHeader>
                <CardTitle>Audiências do processo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hearingsQuery.isError ? (
                  <p className="text-sm text-destructive">Não foi possível carregar as audiências.</p>
                ) : hearings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem audiências cadastradas.</p>
                ) : (
                  sortedHearings.map((hearing) => (
                    <div key={hearing.id} className={cn('rounded-2xl border p-4', isToday(hearing.hearing_date) && 'border-sky-200 bg-sky-50/60')}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{hearing.type || 'Audiência'}</div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {formatDisplayDateTime(hearing.hearing_date)}
                            {hearing.end_date ? ` até ${formatDisplayDateTime(hearing.end_date)}` : ''}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge text={humanizeValue(hearing.status)} variant={hearingStatusVariant(hearing.status ?? undefined)} />
                          <StatusBadge text={humanizeValue(hearing.modality)} variant={hearingModalityVariant(hearing.modality ?? undefined)} />
                        </div>
                      </div>
                      {hearing.location ? <div className="mt-2 text-sm">Local: {hearing.location}</div> : null}
                      {hearing.online_link ? (
                        <div className="mt-1 text-sm">
                          Link:{' '}
                          <a href={hearing.online_link} target="_blank" rel="noreferrer" className="underline">
                            {hearing.online_link}
                          </a>
                        </div>
                      ) : null}
                      {hearing.notes ? <div className="mt-2 whitespace-pre-wrap text-sm">{hearing.notes}</div> : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle>Central de documentos do processo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Consulte arquivos, envie novos documentos, acompanhe versões e use a central documental como apoio imediato à rotina do processo.
              </p>
            </CardContent>
          </Card>
          <ProcessDocumentsCenter
            processId={processId}
            processNumber={process.cnj}
            clientId={getProcessClientId(process)}
            clientName={process.client_name || process.cliente_nome || undefined}
            documents={documents as any}
            isLoading={documentsQuery.isLoading}
            isError={documentsQuery.isError}
          />
        </TabsContent>
      </Tabs>

      {false ? (
      <Dialog open={editProcessOpen} onOpenChange={setEditProcessOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar processo</DialogTitle>
            <DialogDescription>
              Atualize dados centrais do processo para manter a carteira, a agenda e os relatórios sempre coerentes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Número CNJ</Label>
              <Input value={processForm.cnj} onChange={(event) => setProcessForm((current) => ({ ...current, cnj: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={processForm.client || '__none'} onValueChange={(value) => setProcessForm((current) => ({ ...current, client: value === '__none' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
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
              <Label>Área</Label>
              <Select value={processForm.area} onValueChange={(value) => setProcessForm((current) => ({ ...current, area: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={String(area.area || 'civel')}>
                      {String(area.name || humanizeValue(area.area))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Advogado responsável</Label>
              <Select value={processForm.responsibleId || '__none'} onValueChange={(value) => setProcessForm((current) => ({ ...current, responsibleId: value === '__none' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Definir depois" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Definir depois</SelectItem>
                  {employeeOptions.map((employee) => (
                    <SelectItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tribunal</Label>
              <Input value={processForm.court} onChange={(event) => setProcessForm((current) => ({ ...current, court: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Vara</Label>
              <Input value={processForm.court_division} onChange={(event) => setProcessForm((current) => ({ ...current, court_division: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Classe</Label>
              <Input value={processForm.class_name} onChange={(event) => setProcessForm((current) => ({ ...current, class_name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input value={processForm.subject} onChange={(event) => setProcessForm((current) => ({ ...current, subject: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Fase</Label>
              <Select value={processForm.phase} onValueChange={(value) => setProcessForm((current) => ({ ...current, phase: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conhecimento">Conhecimento</SelectItem>
                  <SelectItem value="recursal">Recursal</SelectItem>
                  <SelectItem value="execucao">Execução</SelectItem>
                  <SelectItem value="cumprimento">Cumprimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={processForm.status} onValueChange={(value) => setProcessForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <Select value={processForm.probability} onValueChange={(value) => setProcessForm((current) => ({ ...current, probability: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor da causa</Label>
              <Input type="number" step="0.01" value={processForm.cause_value} onChange={(event) => setProcessForm((current) => ({ ...current, cause_value: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Autor</Label>
              <Input value={processForm.plaintiff} onChange={(event) => setProcessForm((current) => ({ ...current, plaintiff: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Parte contrária</Label>
              <Input value={processForm.defendant} onChange={(event) => setProcessForm((current) => ({ ...current, defendant: event.target.value }))} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={4} value={processForm.notes} onChange={(event) => setProcessForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditProcessOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => updateProcessMutation.mutate(processForm)} disabled={updateProcessMutation.isPending}>
              {updateProcessMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      <ProcessEditModal
        open={editProcessOpen}
        mode="edit"
        processId={processId}
        process={process}
        defaultArea={String(areaMeta.code || 'civel')}
        clients={clients.map((client) => ({
          value: client.id,
          label: String(client.name || client.full_name || client.razao_social || 'Cliente'),
        }))}
        employees={employeeOptions}
        areas={areas.map((area) => ({
          value: String(area.area || 'civel'),
          label: String(area.name || humanizeValue(area.area)),
        }))}
        isSubmitting={richUpdateProcessMutation.isPending}
        onOpenChange={setEditProcessOpen}
        onSave={async (payload, values) => {
          await richUpdateProcessMutation.mutateAsync({ payload, values });
        }}
      />
    </div>
  );
}

function HeaderInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircle2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function AlertCard({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: 'danger' | 'warning' | 'info';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50/70 text-red-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50/70 text-amber-800'
        : 'border-sky-200 bg-sky-50/70 text-sky-800';

  return (
    <div className={cn('rounded-2xl border p-4', toneClass)}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="border-border/60 shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-semibold text-foreground">{value}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}


