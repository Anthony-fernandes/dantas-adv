import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarClock,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { api, apiGetAllPages } from '@/integrations/api/client';
import { maskPhoneBR } from '@/lib/masks';
import { cn } from '@/lib/utils';
import { clientService } from '@/services/api';
import type { DocumentFile, FinanceEntry } from '@/types/models';
import { formatDocumentDate, formatFileSize, getDocumentUrl } from '@/components/process-documents/utils';
import {
  CLIENT_LINK_FIELDS,
  normalizeClientText,
  parseClientNotes,
  resolveClientAddress,
  resolveClientPortalEnabled,
  resolveLinkedClientUserId,
  serializeClientNotes,
  type ClientInteractionEntry,
  type ClientMetaNotes,
} from './client-meta';

type ClientRecord = {
  id: string;
  type?: string | null;
  name?: string | null;
  doc?: string | null;
  email?: string | null;
  phones?: string[] | null;
  phone?: string | null;
  whatsapp?: string | null;
  notes?: string | null;
  address?: Record<string, any> | null;
  tags?: string[] | null;
  responsavel?: string | null;
  responsible_user?: string | null;
  user?: string | { id?: string } | null;
  portal_user?: string | { id?: string } | null;
  user_id?: string | null;
  portal_user_id?: string | null;
  client_user?: string | { id?: string } | null;
  client_user_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProcessRecord = {
  id: string;
  cnj?: string | null;
  area?: string | null;
  phase?: string | null;
  status?: string | null;
  court?: string | null;
  court_division?: string | null;
  plaintiff?: string | null;
  defendant?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type HearingRecord = {
  id: string;
  process?: string | null;
  process_id?: string | null;
  hearing_date?: string | null;
  type?: string | null;
  status?: string | null;
  location?: string | null;
};

type PortalUserRecord = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  is_active?: boolean | null;
  roles?: string[] | null;
  permissions?: string[] | null;
  tenant?: string | { id?: string } | null;
  tenant_id?: string | null;
};

type EmployeeRecord = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type EditFormState = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  status: string;
  responsibleId: string;
  publicNotes: string;
  internalNotes: string;
};

type TimelineRow = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  tone: 'default' | 'warning' | 'success' | 'info';
};

function asList<T>(data: { results?: T[] } | T[] | undefined | null) {
  if (!data) return [] as T[];
  return Array.isArray(data) ? data : (data.results ?? []);
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value?: string | null) {
  const parsed = safeDate(value);
  if (!parsed) return '-';
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value?: string | null) {
  const parsed = safeDate(value);
  if (!parsed) return '-';
  return parsed.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(amount) ? amount : 0);
}

function normalizeStatus(value?: string | null) {
  const normalized = normalizeClientText(value);
  if (!normalized) return 'ativo';
  return normalized;
}

function isOpenFinanceStatus(value?: string | null) {
  return ['aberta', 'aberto', 'emitida', 'vencida', 'vencido', 'pendente'].includes(normalizeClientText(value));
}

function clientStatusBadgeClass(value?: string | null) {
  const status = normalizeStatus(value);
  if (status === 'inativo') return 'border-border bg-muted text-muted-foreground';
  if (status === 'prospecto') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function formatClientStatus(value?: string | null) {
  const status = normalizeStatus(value);
  if (status === 'inativo') return 'Inativo';
  if (status === 'prospecto') return 'Prospecto';
  return 'Ativo';
}

function typeBadgeClass(type?: string | null) {
  return String(type || 'PF').toUpperCase() === 'PJ'
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-violet-200 bg-violet-50 text-violet-700';
}

async function safeAllPages<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>) {
  try {
    return await apiGetAllPages<T>(path, params);
  } catch {
    return [] as T[];
  }
}

function buildEditForm(client: ClientRecord) {
  const parsed = parseClientNotes(client.notes);
  const phones = Array.isArray(client.phones) ? client.phones : [];
  return {
    name: String(client.name || '').trim(),
    email: String(client.email || '').trim(),
    phone: String(parsed.meta.phone || phones[0] || client.phone || '').trim(),
    whatsapp: String(parsed.meta.whatsapp || client.whatsapp || '').trim(),
    status: normalizeStatus(client.status),
    responsibleId: String(parsed.meta.responsible_internal_id || '').trim(),
    publicNotes: parsed.publicNotes,
    internalNotes: String(parsed.meta.internal_notes || '').trim(),
  } satisfies EditFormState;
}

function buildTimeline(interactions: ClientInteractionEntry[], processes: ProcessRecord[], hearings: HearingRecord[], documents: DocumentFile[], finances: FinanceEntry[]) {
  const interactionRows: TimelineRow[] = interactions.map((item) => ({
    id: item.id,
    title: item.note,
    subtitle: item.type === 'nota' ? 'Anotacao interna' : `Interacao por ${item.type}`,
    date: item.date,
    tone: 'info',
  }));

  const processRows: TimelineRow[] = processes.map((process) => ({
    id: `process-${process.id}`,
    title: process.cnj || 'Processo vinculado',
    subtitle: `Atualizacao do processo${process.status ? ` - ${process.status}` : ''}`,
    date: process.updated_at || process.created_at || '',
    tone: 'default',
  }));

  const hearingRows: TimelineRow[] = hearings.map((hearing) => ({
    id: `hearing-${hearing.id}`,
    title: hearing.type || 'Audiência',
    subtitle: hearing.location || 'Agenda vinculada ao cliente',
    date: hearing.hearing_date || '',
    tone: 'warning',
  }));

  const documentRows: TimelineRow[] = documents.map((document) => ({
    id: `document-${document.id}`,
    title: String(document.title || document.filename || 'Documento'),
    subtitle: `Documento ${document.category || 'geral'} adicionado`,
    date: document.created_at || '',
    tone: 'success',
  }));

  const financeRows: TimelineRow[] = finances.map((item) => ({
    id: `finance-${item.id}`,
    title: item.description || 'Lancamento financeiro',
    subtitle: `${formatCurrency(item.amount)} - ${item.status || 'status não informado'}`,
    date: item.due_date || item.created_at || '',
    tone: isOpenFinanceStatus(item.status) ? 'warning' : 'default',
  }));

  return [...interactionRows, ...processRows, ...hearingRows, ...documentRows, ...financeRows]
    .filter((item) => safeDate(item.date))
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export default function ClientDetailWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTenantId } = useTenant();
  const { hasRole, isSuperuser } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    status: 'ativo',
    responsibleId: '',
    publicNotes: '',
    internalNotes: '',
  });
  const [interactionType, setInteractionType] = useState<ClientInteractionEntry['type']>('nota');
  const [interactionNote, setInteractionNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [portalSaving, setPortalSaving] = useState(false);

  const canManagePortal = isSuperuser || hasRole('OWNER', 'ADMIN');
  const currentTab = useMemo(() => {
    const value = searchParams.get('tab') || 'resumo';
    return ['resumo', 'processos', 'audiencias', 'documentos', 'financeiro', 'portal', 'historico'].includes(value) ? value : 'resumo';
  }, [searchParams]);

  const clientQuery = useQuery({
    queryKey: ['client-detail', activeTenantId, id],
    enabled: !!activeTenantId && !!id,
    queryFn: () => clientService.get(id),
  });

  const processesQuery = useQuery({
    queryKey: ['client-detail-processes', activeTenantId, id],
    enabled: !!activeTenantId && !!id,
    queryFn: () => clientService.processes(id),
  });

  const financialQuery = useQuery({
    queryKey: ['client-detail-financial', activeTenantId, id],
    enabled: !!activeTenantId && !!id,
    queryFn: () => clientService.financial(id),
  });

  const hearingsQuery = useQuery({
    queryKey: ['client-detail-hearings', activeTenantId],
    enabled: !!activeTenantId && !!id,
    queryFn: () => safeAllPages<HearingRecord>('/hearings/', { ordering: 'hearing_date' }),
  });

  const documentsQuery = useQuery({
    queryKey: ['client-detail-documents', activeTenantId],
    enabled: !!activeTenantId && !!id,
    queryFn: () => safeAllPages<DocumentFile>('/documents/', { ordering: '-created_at' }),
  });

  const employeesQuery = useQuery({
    queryKey: ['client-detail-employees', activeTenantId],
    enabled: !!activeTenantId && !!id,
    queryFn: () => safeAllPages<EmployeeRecord>('/employees/', { ordering: 'full_name' }),
  });

  const portalUsersQuery = useQuery({
    queryKey: ['client-detail-portal-users', activeTenantId],
    enabled: !!activeTenantId && !!id && canManagePortal,
    queryFn: () => api.get<any>('/admin/users/', activeTenantId ? { tenant_id: activeTenantId } : undefined),
    retry: false,
  });

  const client = clientQuery.data as ClientRecord | undefined;
  const processes = useMemo(() => asList<ProcessRecord>(processesQuery.data as any), [processesQuery.data]);
  const finances = useMemo(() => asList<FinanceEntry>(financialQuery.data as any), [financialQuery.data]);
  const employees = employeesQuery.data ?? [];

  const parsed = useMemo(() => parseClientNotes(client?.notes), [client?.notes]);
  const address = useMemo(() => resolveClientAddress(client?.address, parsed.meta), [client?.address, parsed.meta]);
  const linkedProcessIds = useMemo(() => new Set(processes.map((process) => process.id)), [processes]);
  const hearings = useMemo(
    () => (hearingsQuery.data ?? []).filter((hearing) => linkedProcessIds.has(String(hearing.process || hearing.process_id || '').trim())),
    [hearingsQuery.data, linkedProcessIds],
  );
  const documents = useMemo(
    () => (documentsQuery.data ?? []).filter((document) => String(document.client || '').trim() === id || linkedProcessIds.has(String(document.process || '').trim())),
    [documentsQuery.data, id, linkedProcessIds],
  );
  const portalUsers = useMemo(() => asList<PortalUserRecord>(portalUsersQuery.data as any), [portalUsersQuery.data]);
  const portalUser = useMemo(() => {
    const linkedUserId = resolveLinkedClientUserId(client);
    if (!linkedUserId) return null;
    return portalUsers.find((user) => user.id === linkedUserId) || null;
  }, [client, portalUsers]);

  const portalEnabled = Boolean(portalUser ? portalUser.is_active !== false : resolveClientPortalEnabled(client, parsed.meta));
  const displayName = String(parsed.meta.fantasy_name || client?.name || 'Cliente').trim();
  const responsibleName =
    employees.find((employee) => employee.id === parsed.meta.responsible_internal_id)?.full_name ||
    parsed.meta.responsible_internal_name ||
    client?.responsavel ||
    client?.responsible_user ||
    'Não definido';
  const phoneValue = String(parsed.meta.phone || (Array.isArray(client?.phones) ? client?.phones?.[0] : '') || client?.phone || '').trim();
  const whatsappValue = String(parsed.meta.whatsapp || client?.whatsapp || '').trim();
  const inadimplencia = useMemo(
    () => finances.filter((item) => isOpenFinanceStatus(item.status)).reduce((total, item) => total + Number(item.amount || 0), 0),
    [finances],
  );
  const nextHearing = useMemo(
    () => [...hearings].sort((left, right) => new Date(left.hearing_date || 0).getTime() - new Date(right.hearing_date || 0).getTime()).find((item) => (safeDate(item.hearing_date)?.getTime() || 0) >= Date.now()) || null,
    [hearings],
  );
  const timeline = useMemo(() => buildTimeline(parsed.meta.interaction_history || [], processes, hearings, documents, finances), [parsed.meta.interaction_history, processes, hearings, documents, finances]);
  const loading = [clientQuery.isLoading, processesQuery.isLoading, financialQuery.isLoading].some(Boolean);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['client-detail', activeTenantId, id] }),
      queryClient.invalidateQueries({ queryKey: ['client-detail-processes', activeTenantId, id] }),
      queryClient.invalidateQueries({ queryKey: ['client-detail-financial', activeTenantId, id] }),
      queryClient.invalidateQueries({ queryKey: ['client-detail-hearings', activeTenantId] }),
      queryClient.invalidateQueries({ queryKey: ['client-detail-documents', activeTenantId] }),
      queryClient.invalidateQueries({ queryKey: ['client-detail-portal-users', activeTenantId] }),
      queryClient.invalidateQueries({ queryKey: ['clients-crm', activeTenantId] }),
    ]);
  };

  const patchClientLink = async (clientId: string, userId: string | null) => {
    const orderedFields = [...CLIENT_LINK_FIELDS];
    let lastError: any = null;
    for (const field of orderedFields) {
      try {
        await api.patch(`/clients/${clientId}/`, { [field]: userId });
        return;
      } catch (error: any) {
        lastError = error;
        if (error?.status && ![400, 422].includes(Number(error.status))) throw error;
      }
    }
    if (lastError) throw lastError;
  };

  const persistClientMeta = async (updater: (current: ClientMetaNotes) => ClientMetaNotes) => {
    if (!client) return;
    const nextMeta = updater(parsed.meta || {});
    await api.patch(`/clients/${client.id}/`, { notes: serializeClientNotes(parsed.publicNotes, nextMeta) });
    await refreshAll();
  };

  const openEdit = () => {
    if (!client) return;
    setEditForm(buildEditForm(client));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!client || !editForm.name.trim()) {
      toast.error('Informe o nome do cliente.');
      return;
    }
    setSavingEdit(true);
    try {
      const nextMeta: ClientMetaNotes = {
        ...parsed.meta,
        phone: editForm.phone.trim() || undefined,
        whatsapp: editForm.whatsapp.trim() || undefined,
        responsible_internal_id: editForm.responsibleId || undefined,
        responsible_internal_name: employees.find((employee) => employee.id === editForm.responsibleId)?.full_name || parsed.meta.responsible_internal_name || undefined,
        internal_notes: editForm.internalNotes.trim() || undefined,
      };

      await api.patch(`/clients/${client.id}/`, {
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phones: editForm.phone.trim() ? [editForm.phone.trim()] : [],
        whatsapp: editForm.whatsapp.trim() || null,
        status: editForm.status,
        notes: serializeClientNotes(editForm.publicNotes, nextMeta),
      });

      toast.success('Cliente atualizado com sucesso.');
      setEditOpen(false);
      await refreshAll();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar o cliente.');
    } finally {
      setSavingEdit(false);
    }
  };

  const addInteraction = async () => {
    if (!client || !interactionNote.trim()) {
      toast.error('Escreva a anotacao antes de salvar.');
      return;
    }

    setSavingInteraction(true);
    try {
      const entry: ClientInteractionEntry = {
        id: `interaction-${Date.now()}`,
        date: new Date().toISOString(),
        type: interactionType,
        note: interactionNote.trim(),
      };

      await persistClientMeta((current) => ({
        ...current,
        interaction_history: [entry, ...(current.interaction_history || [])].slice(0, 50),
      }));

      setInteractionNote('');
      setInteractionType('nota');
      toast.success('Interação registrada no histórico.');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar a interação.');
    } finally {
      setSavingInteraction(false);
    }
  };

  const togglePortal = async () => {
    if (!client) return;
    if (!canManagePortal) {
      toast.error('Você não tem permissão para gerir o portal do cliente.');
      return;
    }
    setPortalSaving(true);

    try {
      if (portalUser) {
        await api.put(`/admin/users/${portalUser.id}/`, {
          email: portalUser.email,
          full_name: portalUser.full_name,
          tenant_id: activeTenantId || undefined,
          is_active: !(portalUser.is_active !== false),
          roles: portalUser.roles || ['CLIENT'],
          permissions: portalUser.permissions || [],
        });
        await persistClientMeta((current) => ({
          ...current,
          portal_enabled: !(portalUser.is_active !== false),
          portal_invited_at: current.portal_invited_at || new Date().toISOString(),
        }));
        toast.success(portalUser.is_active !== false ? 'Acesso ao portal desativado.' : 'Acesso ao portal reativado.');
      } else if (!client.email) {
        toast.error('Cadastre um e-mail no cliente antes de ativar o portal.');
      } else {
        const created = await api.post<any>('/admin/users/', {
          email: client.email,
          full_name: displayName,
          tenant_id: activeTenantId || undefined,
          is_active: true,
          roles: ['CLIENT'],
          permissions: [],
        });
        await patchClientLink(client.id, String(created?.id || ''));
        await persistClientMeta((current) => ({
          ...current,
          portal_enabled: true,
          portal_invited_at: new Date().toISOString(),
        }));
        toast.success('Acesso ao portal criado para o cliente.');
      }
      await refreshAll();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar o portal do cliente.');
    } finally {
      setPortalSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page-container">
        <EmptyState icon={UserRound} title="Cliente não encontrado" description="Este cadastro pode ter sido removido ou não está disponível para o tenant atual." />
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="gap-2 pl-0" onClick={() => navigate('/app/clientes')}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para clientes
          </Button>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
              <Badge className={typeBadgeClass(client.type)}>{String(client.type || 'PF').toUpperCase()}</Badge>
              <Badge className={clientStatusBadgeClass(client.status)}>{formatClientStatus(client.status)}</Badge>
              <Badge className={portalEnabled ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}>
                {portalEnabled ? 'Portal ativo' : 'Portal não ativo'}
              </Badge>
              <Badge className={inadimplencia > 0 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>
                {inadimplencia > 0 ? 'Financeiro em atenção' : 'Financeiro regular'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>Documento: {client.doc || 'Não informado'}</span>
              <span>Responsável: {responsibleName}</span>
              <span>Cidade: {[address.city, address.state].filter(Boolean).join(' / ') || 'Não informada'}</span>
              <span>Próxima audiência: {nextHearing ? formatDateTime(nextHearing.hearing_date) : 'Não há agenda futura'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Processos</CardDescription>
            <CardTitle className="text-3xl">{processes.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{processes.filter((item) => !['encerrado', 'finalizado', 'arquivado'].includes(normalizeClientText(item.status))).length} ativos</CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Audiências próximas</CardDescription>
            <CardTitle className="text-3xl">{hearings.filter((item) => (safeDate(item.hearing_date)?.getTime() || 0) >= Date.now()).length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{nextHearing ? formatDate(nextHearing.hearing_date) : 'Sem audiência futura'}</CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Documentos vinculados</CardDescription>
            <CardTitle className="text-3xl">{documents.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Arquivos ligados ao cliente e aos seus processos.</CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Financeiro em aberto</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(inadimplencia)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{finances.filter((item) => isOpenFinanceStatus(item.status)).length} lançamentos exigem atenção.</CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription>Portal do cliente</CardDescription>
            <CardTitle className="text-3xl">{portalEnabled ? 'Ativo' : 'Pendente'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{portalUser ? `Usuário vinculado: ${portalUser.email || portalUser.full_name || portalUser.id}` : 'Sem usuário vinculado ao portal.'}</CardContent>
        </Card>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl bg-muted/50 p-2">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="processos">Processos</TabsTrigger>
          <TabsTrigger value="audiencias">Audiências</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="portal">Portal</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Dados principais</CardTitle>
                  <CardDescription>Base cadastral usada pelo escritório no relacionamento e na operação.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nome legal</p>
                    <p className="mt-2 text-sm font-medium">{client.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tipo</p>
                    <p className="mt-2 text-sm font-medium">{String(client.type || 'PF').toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documento</p>
                    <p className="mt-2 text-sm font-medium">{client.doc || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                    <p className="mt-2 text-sm font-medium">{formatClientStatus(client.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Responsável interno</p>
                    <p className="mt-2 text-sm font-medium">{responsibleName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Origem</p>
                    <p className="mt-2 text-sm font-medium">{parsed.meta.origin || 'Não informada'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                  <CardDescription>Notas do cadastro e contexto interno do relacionamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cadastro</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{parsed.publicNotes || 'Sem observações de cadastro.'}</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Interno</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{parsed.meta.internal_notes || 'Sem anotações internas.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Contato e endereço</CardTitle>
                  <CardDescription>Informações usadas para comunicação, convites e expedição de documentos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{client.email || 'Sem e-mail cadastrado'}</p>
                      <p className="text-xs text-muted-foreground">E-mail principal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{phoneValue || 'Sem telefone principal'}</p>
                      <p className="text-xs text-muted-foreground">{whatsappValue ? `WhatsApp: ${whatsappValue}` : 'Sem WhatsApp informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {[address.street, address.number, address.neighborhood, address.city, address.state].filter(Boolean).join(', ') || 'Endereço não informado'}
                      </p>
                      <p className="text-xs text-muted-foreground">{[address.cep, address.complement].filter(Boolean).join(' - ') || 'Sem complemento cadastrado'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Relacionamento jurídico</CardTitle>
                  <CardDescription>Leitura rápida dos vínculos do cliente no sistema.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Processos</p>
                    <p className="mt-2 text-2xl font-semibold">{processes.length}</p>
                    <p className="text-xs text-muted-foreground">Controle geral da carteira jurídica</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Audiências</p>
                    <p className="mt-2 text-2xl font-semibold">{hearings.length}</p>
                    <p className="text-xs text-muted-foreground">{nextHearing ? `Próxima em ${formatDate(nextHearing.hearing_date)}` : 'Sem agenda futura'}</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documentos</p>
                    <p className="mt-2 text-2xl font-semibold">{documents.length}</p>
                    <p className="text-xs text-muted-foreground">{documents[0] ? String(documents[0].title || documents[0].filename || 'Documento recente') : 'Nenhum documento vinculado'}</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Financeiro</p>
                    <p className="mt-2 text-2xl font-semibold">{formatCurrency(inadimplencia)}</p>
                    <p className="text-xs text-muted-foreground">{inadimplencia > 0 ? 'Pendências financeiras em aberto' : 'Sem pendências relevantes'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="processos" className="space-y-4">
          {processes.length === 0 ? (
            <EmptyState icon={FolderOpen} title="Sem processos vinculados" description="Quando o cliente tiver demandas cadastradas, elas aparecerão aqui para acesso rápido." />
          ) : (
            <div className="grid gap-4">
              {processes.map((process) => (
                <Card key={process.id} className="shadow-card">
                  <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{process.cnj || 'Processo sem CNJ'}</p>
                        <Badge className="border-sky-200 bg-sky-50 text-sky-700">{process.area || 'Área não definida'}</Badge>
                        <Badge className="border-border bg-muted text-muted-foreground">{process.phase || 'Fase não definida'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{[process.court, process.court_division].filter(Boolean).join(' - ') || 'Tribunal e vara não informados'}</p>
                      <p className="text-xs text-muted-foreground">Última atualização: {formatDateTime(process.updated_at || process.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => navigate(`/app/processos/${process.id}`)}>Abrir processo</Button>
                      <Button variant="outline" onClick={() => navigate(`/app/processos/${process.id}?tab=documents`)}>Documentos</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audiencias" className="space-y-4">
          {hearings.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Sem audiências vinculadas" description="As audiências ligadas aos processos deste cliente aparecerão aqui." />
          ) : (
            <div className="grid gap-4">
              {hearings.map((hearing) => (
                <Card key={hearing.id} className="shadow-card">
                  <CardContent className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{hearing.type || 'Audiência'}</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(hearing.hearing_date)}</p>
                      <p className="text-xs text-muted-foreground">{hearing.location || 'Local não informado'} - {hearing.status || 'status não informado'}</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/app/audiencias')}>Abrir módulo de audiências</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          {documents.length === 0 ? (
            <EmptyState icon={FileText} title="Sem documentos vinculados" description="Os arquivos ligados ao cliente e aos processos relacionados ficarão visíveis aqui." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {documents.map((document) => {
                const url = getDocumentUrl(document);
                return (
                  <Card key={document.id} className="shadow-card">
                    <CardContent className="space-y-4 p-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{document.title || document.filename || 'Documento'}</p>
                          <Badge className="border-border bg-muted text-muted-foreground">{document.category || 'geral'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{document.filename || 'Arquivo sem nome exibivel'}</p>
                        <p className="text-xs text-muted-foreground">{formatDocumentDate(document.created_at)} - {formatFileSize(document.file_size)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" disabled={!url} onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visualizar
                        </Button>
                        <Button variant="outline" disabled={!url} onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar
                        </Button>
                        <Button onClick={() => navigate('/app/documentos')}>Central de documentos</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription>Em aberto</CardDescription>
                <CardTitle className="text-3xl">{formatCurrency(inadimplencia)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Recebíveis com acompanhamento pendente.</CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription>Recebimentos</CardDescription>
                <CardTitle className="text-3xl">{finances.filter((item) => !isOpenFinanceStatus(item.status)).length}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Lançamentos com ciclo concluído.</CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardDescription>Total de registros</CardDescription>
                <CardTitle className="text-3xl">{finances.length}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Histórico financeiro vinculado ao cliente.</CardContent>
            </Card>
          </div>

          {finances.length === 0 ? (
            <EmptyState icon={Wallet} title="Sem financeiro vinculado" description="Lançamentos financeiros do cliente aparecerão aqui quando houver cobranças ou recebimentos relacionados." />
          ) : (
            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[840px]">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finances.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.description || 'Lançamento financeiro'}</p>
                            <p className="text-xs text-muted-foreground">{item.type || 'Tipo não informado'}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{formatDate(item.due_date)}</TableCell>
                        <TableCell>
                          <Badge className={isOpenFinanceStatus(item.status) ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}>
                            {item.status || 'Não informado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portal" className="space-y-4">
          <div className="grid gap-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Portal do cliente</CardTitle>
                <CardDescription>Controle o acesso externo e acompanhe o estado do usuário vinculado ao portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={portalEnabled ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground'}>
                    {portalEnabled ? 'Portal ativo' : 'Portal pendente'}
                  </Badge>
                  <Badge className={client.email ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                    {client.email ? 'E-mail pronto para acesso' : 'Cliente sem e-mail'}
                  </Badge>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Usuário vinculado</p>
                  <p className="mt-2 text-sm font-medium">{portalUser ? portalUser.full_name || portalUser.email || portalUser.id : 'Nenhum usuário vinculado ainda'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {portalUser ? `${portalUser.email || 'Sem e-mail'} - ${portalUser.is_active !== false ? 'ativo' : 'inativo'}` : 'Quando existir um usuário CLIENT vinculado, ele aparecerá aqui.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={togglePortal} disabled={portalSaving || !canManagePortal}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {portalUser ? (portalUser.is_active !== false ? 'Desativar portal' : 'Reativar portal') : 'Ativar portal'}
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/app/usuarios')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Gerir usuários
                  </Button>
                </div>

                <div className="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                  Convites, redefinição de senha e ajustes finos de acesso continuam disponíveis no módulo de usuários para manter o RBAC do escritório consistente.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Registrar interação</CardTitle>
                <CardDescription>Guarde ligações, e-mails, reuniões e observações do relacionamento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={interactionType} onValueChange={(value) => setInteractionType(value as ClientInteractionEntry['type'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nota">Nota</SelectItem>
                      <SelectItem value="ligacao">Ligação</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Registro</Label>
                  <Textarea rows={8} value={interactionNote} onChange={(event) => setInteractionNote(event.target.value)} placeholder="Ex.: Cliente validou documentos e autorizou protocolo ainda hoje." />
                </div>
                <Button className="w-full" onClick={addInteraction} disabled={savingInteraction}>
                  <Plus className="mr-2 h-4 w-4" />
                  {savingInteraction ? 'Salvando...' : 'Adicionar ao histórico'}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Histórico consolidado</CardTitle>
                <CardDescription>Interações internas, documentos, audiências, processos e financeiro numa única linha do tempo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="Sem histórico registrado" description="Interações e eventos do cliente aparecerão aqui assim que forem cadastrados." />
                ) : (
                  timeline.map((item) => (
                    <div key={item.id} className={cn('rounded-2xl border p-4', item.tone === 'warning' && 'border-amber-200 bg-amber-50/60', item.tone === 'success' && 'border-emerald-200 bg-emerald-50/60', item.tone === 'info' && 'border-sky-200 bg-sky-50/60')}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{formatDateTime(item.date)}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Ajuste rapidamente os dados principais sem sair da visão 360 do cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editForm.name} onChange={(event) => setEditForm((previous) => ({ ...previous, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={editForm.email} onChange={(event) => setEditForm((previous) => ({ ...previous, email: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={editForm.phone} onChange={(event) => setEditForm((previous) => ({ ...previous, phone: maskPhoneBR(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={editForm.whatsapp} onChange={(event) => setEditForm((previous) => ({ ...previous, whatsapp: maskPhoneBR(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm((previous) => ({ ...previous, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsável interno</Label>
              <Select value={editForm.responsibleId || 'none'} onValueChange={(value) => setEditForm((previous) => ({ ...previous, responsibleId: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {employees.filter((employee) => employee.is_active !== false).map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>{employee.full_name || employee.email || employee.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações do cadastro</Label>
              <Textarea rows={4} value={editForm.publicNotes} onChange={(event) => setEditForm((previous) => ({ ...previous, publicNotes: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações internas</Label>
              <Textarea rows={6} value={editForm.internalNotes} onChange={(event) => setEditForm((previous) => ({ ...previous, internalNotes: event.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? 'Salvando...' : 'Salvar alterações'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
