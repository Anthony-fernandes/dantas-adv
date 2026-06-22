import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Download,
  Eye,
  FileText,
  FolderOpen,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  TableProperties,
  UserCheck,
  UserX,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/EmptyState';
import { StatCard } from '@/components/shared/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTenant } from '@/contexts/TenantContext';
import { type DbClient } from '@/hooks/useApiData';
import { api, apiGetAllPages } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { maskCEP, maskCpfCnpj, maskPhoneBR, maskUF } from '@/lib/masks';
import { useCepLookup } from '@/hooks/useCepLookup';
import {
  normalizeClientText,
  parseClientNotes,
  resolveClientAddress,
  resolveClientPortalEnabled,
  serializeClientNotes,
  type ClientMetaNotes,
} from './client-meta';

type ClientRecord = DbClient & {
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
  created_at?: string | null;
  updated_at?: string | null;
};

type ProcessRecord = {
  id: string;
  client?: string | { id?: string } | null;
  client_id?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  cnj?: string | null;
  area?: string | null;
  court?: string | null;
  court_division?: string | null;
  status?: string | null;
  phase?: string | null;
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

type DocumentRecord = {
  id: string;
  title?: string | null;
  filename?: string | null;
  process?: string | null;
  client?: string | null;
  category?: string | null;
  created_at?: string | null;
};

type ReceivableRecord = {
  id: string;
  client?: string | null;
  client_id?: string | null;
  amount?: string | number | null;
  due_date?: string | null;
  status?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type EmployeeRecord = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type EnrichedClient = ClientRecord & {
  meta: ClientMetaNotes;
  displayName: string;
  fantasyName: string;
  emailValue: string;
  phoneValue: string;
  whatsappValue: string;
  cityLabel: string;
  stateLabel: string;
  cityUfLabel: string;
  responsibleName: string;
  processesCount: number;
  activeProcessesCount: number;
  inadimplencia: number;
  hasInadimplencia: boolean;
  hasActiveProcess: boolean;
  portalEnabled: boolean;
  nextHearing: HearingRecord | null;
  lastMovementAt: string | null;
  latestDocumentTitle: string;
};

type ClientFormState = {
  type: 'PF' | 'PJ';
  name: string;
  fantasyName: string;
  doc: string;
  rgIe: string;
  birthOrOpenDate: string;
  maritalStatus: string;
  email: string;
  phone: string;
  whatsapp: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  publicNotes: string;
  internalNotes: string;
  responsibleId: string;
  origin: string;
  status: string;
  portalEnabled: boolean;
};

const PAGE_SIZE = 10;

const DEFAULT_FORM: ClientFormState = {
  type: 'PF',
  name: '',
  fantasyName: '',
  doc: '',
  rgIe: '',
  birthOrOpenDate: '',
  maritalStatus: '',
  email: '',
  phone: '',
  whatsapp: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  complement: '',
  publicNotes: '',
  internalNotes: '',
  responsibleId: '',
  origin: '',
  status: 'ativo',
  portalEnabled: false,
};

function resolveId(value: any) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object' && value.id != null) return String(value.id);
  return '';
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(amount) ? amount : 0);
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

function normalizeStatus(value?: string | null) {
  const normalized = normalizeClientText(value);
  if (!normalized) return 'ativo';
  return normalized;
}

function isClosedProcess(status?: string | null) {
  return ['encerrado', 'finalizado', 'arquivado'].includes(normalizeClientText(status));
}

function isReceivableOpen(status?: string | null) {
  return ['aberta', 'aberto', 'vencida', 'emitida', 'vencido', 'pendente'].includes(normalizeClientText(status));
}

function formatClientStatusLabel(value?: string | null) {
  const status = normalizeStatus(value);
  if (status === 'inativo') return 'Inativo';
  if (status === 'prospecto') return 'Prospecto';
  return 'Ativo';
}

function clientStatusBadgeClass(value?: string | null) {
  const status = normalizeStatus(value);
  if (status === 'inativo') return 'border-slate-200 bg-slate-100 text-slate-700';
  if (status === 'prospecto') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function typeBadgeClass(type?: string | null) {
  return String(type || 'PF').toUpperCase() === 'PJ'
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-violet-200 bg-violet-50 text-violet-700';
}

function portalBadgeClass(enabled: boolean) {
  return enabled ? 'border-primary/20 bg-primary/10 text-primary' : 'border-slate-200 bg-slate-100 text-slate-700';
}

async function safeAllPages<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>) {
  try {
    return await apiGetAllPages<T>(path, params);
  } catch {
    return [] as T[];
  }
}

function buildClientCsv(rows: EnrichedClient[]) {
  const header = ['Nome', 'Tipo', 'CPF_CNPJ', 'Email', 'Telefone', 'Cidade', 'UF', 'Processos', 'Responsável', 'Inadimplência', 'Portal', 'Status'];
  const lines = rows.map((row) => [
    row.displayName,
    row.type || 'PF',
    row.doc || '',
    row.emailValue,
    row.phoneValue,
    row.cityLabel,
    row.stateLabel,
    String(row.processesCount),
    row.responsibleName,
    String(row.inadimplencia),
    row.portalEnabled ? 'Sim' : 'Não',
    formatClientStatusLabel(row.status),
  ]);

  return [header, ...lines]
    .map((line) => line.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(';'))
    .join('\n');
}

function buildFormState(client?: ClientRecord | null) {
  if (!client) return { ...DEFAULT_FORM };
  const parsed = parseClientNotes(client.notes);
  const address = resolveClientAddress(client.address, parsed.meta);
  const phones = Array.isArray(client.phones) ? client.phones : [];
  return {
    type: String(client.type || 'PF').toUpperCase() === 'PJ' ? 'PJ' : 'PF',
    name: String(client.name || '').trim(),
    fantasyName: String(parsed.meta.fantasy_name || '').trim(),
    doc: String(client.doc || '').trim(),
    rgIe: String(parsed.meta.rg_ie || '').trim(),
    birthOrOpenDate: String(parsed.meta.birth_or_open_date || '').trim(),
    maritalStatus: String(parsed.meta.marital_status || '').trim(),
    email: String(client.email || '').trim(),
    phone: String(parsed.meta.phone || phones[0] || client.phone || '').trim(),
    whatsapp: String(parsed.meta.whatsapp || client.whatsapp || '').trim(),
    cep: address.cep,
    street: address.street,
    number: address.number,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    complement: address.complement,
    publicNotes: parsed.publicNotes,
    internalNotes: String(parsed.meta.internal_notes || '').trim(),
    responsibleId: String(parsed.meta.responsible_internal_id || '').trim(),
    origin: String(parsed.meta.origin || '').trim(),
    status: normalizeStatus((client as any).status),
    portalEnabled: resolveClientPortalEnabled(client, parsed.meta),
  };
}

function getClientPhone(client: ClientRecord, meta: ClientMetaNotes) {
  const phones = Array.isArray(client.phones) ? client.phones : [];
  return String(meta.phone || phones[0] || client.phone || '').trim();
}

function getClientWhatsapp(client: ClientRecord, meta: ClientMetaNotes) {
  return String(meta.whatsapp || client.whatsapp || '').trim();
}

function getClientDisplayName(client: ClientRecord, meta: ClientMetaNotes) {
  return String(meta.fantasy_name || client.name || 'Cliente').trim();
}

function getLegalName(client: ClientRecord) {
  return String(client.name || 'Cliente').trim();
}

function getLatestIso(values: Array<string | null | undefined>) {
  const sorted = values
    .filter(Boolean)
    .map((value) => safeDate(value || '')?.toISOString() || '')
    .filter(Boolean)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  return sorted[0] || null;
}

export default function ClientsWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeTenantId } = useTenant();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [portalFilter, setPortalFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  const [inadimplenciaOnly, setInadimplenciaOnly] = useState(false);
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormState>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const cepLookup = useCepLookup();

  const clientsQuery = useQuery({
    queryKey: ['clients-crm', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<ClientRecord>('/clients/', { ordering: '-updated_at' }),
  });

  const processesQuery = useQuery({
    queryKey: ['clients-crm-processes', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => safeAllPages<ProcessRecord>('/processes/', { ordering: '-updated_at' }),
  });

  const hearingsQuery = useQuery({
    queryKey: ['clients-crm-hearings', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => safeAllPages<HearingRecord>('/hearings/', { ordering: 'hearing_date' }),
  });

  const documentsQuery = useQuery({
    queryKey: ['clients-crm-documents', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => safeAllPages<DocumentRecord>('/documents/', { ordering: '-created_at' }),
  });

  const receivablesQuery = useQuery({
    queryKey: ['clients-crm-receivables', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => safeAllPages<ReceivableRecord>('/accounts-receivable/', { ordering: '-due_date' }),
  });

  const employeesQuery = useQuery({
    queryKey: ['clients-crm-employees', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => safeAllPages<EmployeeRecord>('/employees/', { ordering: 'full_name' }),
  });

  const clients = clientsQuery.data ?? [];
  const processes = processesQuery.data ?? [];
  const hearings = hearingsQuery.data ?? [];
  const documents = documentsQuery.data ?? [];
  const receivables = receivablesQuery.data ?? [];
  const employees = employeesQuery.data ?? [];

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((employee) => [employee.id, String(employee.full_name || employee.email || 'Responsável').trim()] as const),
      ),
    [employees],
  );

  const rows = useMemo<EnrichedClient[]>(() => {
    return clients.map((client) => {
      const parsed = parseClientNotes(client.notes);
      const address = resolveClientAddress(client.address, parsed.meta);
      const linkedProcesses = processes.filter((process) => resolveId(process.client) === client.id || resolveId(process.client_id) === client.id);
      const linkedProcessIds = new Set(linkedProcesses.map((process) => process.id));
      const linkedHearings = hearings
        .filter((hearing) => linkedProcessIds.has(resolveId(hearing.process) || resolveId(hearing.process_id)))
        .sort((left, right) => new Date(left.hearing_date || 0).getTime() - new Date(right.hearing_date || 0).getTime());
      const linkedDocuments = documents.filter((document) => String(document.client || '').trim() === client.id || linkedProcessIds.has(String(document.process || '').trim()));
      const linkedReceivables = receivables.filter((item) => String(item.client || item.client_id || '').trim() === client.id);
      const inadimplencia = linkedReceivables
        .filter((item) => isReceivableOpen(item.status))
        .reduce((total, item) => total + Number(item.amount || 0), 0);

      const lastMovementAt = getLatestIso([
        client.updated_at,
        client.created_at,
        ...linkedProcesses.map((process) => process.updated_at || process.created_at),
        ...linkedDocuments.map((document) => document.created_at),
        ...linkedReceivables.map((item) => item.created_at || item.due_date),
      ]);

      const responsibleName =
        employeeMap[String(parsed.meta.responsible_internal_id || '').trim()] ||
        String(parsed.meta.responsible_internal_name || client.responsavel || client.responsible_user || '').trim() ||
        'Não definido';

      return {
        ...client,
        meta: parsed.meta,
        displayName: getClientDisplayName(client, parsed.meta),
        fantasyName: String(parsed.meta.fantasy_name || '').trim(),
        emailValue: String(client.email || '').trim(),
        phoneValue: getClientPhone(client, parsed.meta),
        whatsappValue: getClientWhatsapp(client, parsed.meta),
        cityLabel: address.city,
        stateLabel: address.state,
        cityUfLabel: [address.city, address.state].filter(Boolean).join(' / ') || 'Não informado',
        responsibleName,
        processesCount: linkedProcesses.length,
        activeProcessesCount: linkedProcesses.filter((process) => !isClosedProcess(process.status)).length,
        inadimplencia,
        hasInadimplencia: inadimplencia > 0,
        hasActiveProcess: linkedProcesses.some((process) => !isClosedProcess(process.status)),
        portalEnabled: resolveClientPortalEnabled(client, parsed.meta),
        nextHearing: linkedHearings.find((hearing) => (safeDate(hearing.hearing_date)?.getTime() || 0) >= Date.now()) || null,
        lastMovementAt,
        latestDocumentTitle: String(linkedDocuments[0]?.title || linkedDocuments[0]?.filename || '').trim(),
      };
    });
  }, [clients, processes, hearings, documents, receivables, employeeMap]);

  const filteredRows = useMemo(() => {
    const query = normalizeClientText(search);
    return rows.filter((row) => {
      if (typeFilter !== 'all' && String(row.type || '').toUpperCase() !== typeFilter) return false;
      if (statusFilter !== 'all' && normalizeStatus((row as any).status) !== statusFilter) return false;
      if (relationshipFilter === 'with-process' && !row.hasActiveProcess) return false;
      if (relationshipFilter === 'without-process' && row.processesCount > 0) return false;
      if (portalFilter === 'enabled' && !row.portalEnabled) return false;
      if (portalFilter === 'disabled' && row.portalEnabled) return false;
      if (responsibleFilter !== 'all' && String(row.meta.responsible_internal_id || '') !== responsibleFilter) return false;
      if (inadimplenciaOnly && !row.hasInadimplencia) return false;
      if (!query) return true;

      return [
        row.displayName,
        getLegalName(row),
        row.doc,
        row.emailValue,
        row.phoneValue,
        row.whatsappValue,
        row.responsibleName,
        row.cityLabel,
        row.stateLabel,
        row.fantasyName,
      ].some((value) => normalizeClientText(String(value || '')).includes(query));
    });
  }, [inadimplenciaOnly, portalFilter, relationshipFilter, responsibleFilter, rows, search, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, relationshipFilter, portalFilter, responsibleFilter, inadimplenciaOnly, view]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const editingRow = useMemo(() => rows.find((row) => row.id === editingClientId) || null, [editingClientId, rows]);

  const stats = useMemo(() => {
    const active = rows.filter((row) => normalizeStatus((row as any).status) === 'ativo').length;
    const withPortal = rows.filter((row) => row.portalEnabled).length;
    const withActiveProcess = rows.filter((row) => row.hasActiveProcess).length;
    const inadimplentes = rows.filter((row) => row.hasInadimplencia).length;
    return { total: rows.length, active, withPortal, withActiveProcess, inadimplentes };
  }, [rows]);

  const responsibleOptions = useMemo(
    () =>
      employees
        .filter((employee) => employee.is_active !== false)
        .map((employee) => ({ value: employee.id, label: String(employee.full_name || employee.email || 'Responsável').trim() }))
        .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')),
    [employees],
  );

  const loading = [clientsQuery.isLoading, processesQuery.isLoading].some(Boolean);

  const resetForm = () => {
    setEditingClientId(null);
    setForm({ ...DEFAULT_FORM });
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (client: ClientRecord) => {
    setEditingClientId(client.id);
    setForm(buildFormState(client));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const saveClient = async () => {
    if (!form.name.trim()) {
      toast.error('Informe o nome do cliente.');
      return;
    }

    setIsSaving(true);

    try {
      const addressFilled = [form.cep, form.street, form.number, form.neighborhood, form.city, form.state, form.complement].some(Boolean);
      const phone = form.phone.trim();
      const responsibleName = employeeMap[form.responsibleId] || editingRow?.meta.responsible_internal_name || '';
      const nextMeta: ClientMetaNotes = {
        ...(editingRow?.meta || {}),
        fantasy_name: form.fantasyName.trim() || undefined,
        rg_ie: form.rgIe.trim() || undefined,
        birth_or_open_date: form.birthOrOpenDate || undefined,
        marital_status: form.maritalStatus.trim() || undefined,
        phone: phone || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        cep: form.cep.trim() || undefined,
        state: form.state.trim() || undefined,
        city: form.city.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        street: form.street.trim() || undefined,
        number: form.number.trim() || undefined,
        complement: form.complement.trim() || undefined,
        responsible_internal_id: form.responsibleId || undefined,
        responsible_internal_name: responsibleName || undefined,
        origin: form.origin.trim() || undefined,
        internal_notes: form.internalNotes.trim() || undefined,
        portal_enabled: form.portalEnabled || undefined,
      };

      const payload = {
        name: form.name.trim(),
        type: form.type,
        doc: form.doc.trim() || null,
        email: form.email.trim() || null,
        phones: phone ? [phone] : [],
        whatsapp: form.whatsapp.trim() || null,
        address: addressFilled
          ? {
              cep: form.cep.trim() || '',
              state: form.state.trim() || '',
              city: form.city.trim() || '',
              neighborhood: form.neighborhood.trim() || '',
              line1: form.street.trim() || '',
              number: form.number.trim() || '',
              line2: form.complement.trim() || '',
            }
          : null,
        notes: serializeClientNotes(form.publicNotes, nextMeta),
        status: form.status,
      };

      if (editingClientId) {
        await api.patch(`/clients/${editingClientId}/`, payload);
        toast.success('Cliente atualizado com sucesso.');
      } else {
        await api.post('/clients/', payload);
        toast.success('Cliente cadastrado com sucesso.');
      }

      closeDialog();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients-crm', activeTenantId] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client-detail'] }),
      ]);
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar o cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportRows = () => {
    if (!filteredRows.length) {
      toast.error('Não há clientes para exportar com os filtros atuais.');
      return;
    }
    const csv = buildClientCsv(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatus = async (client: EnrichedClient) => {
    const nextStatus = normalizeStatus((client as any).status) === 'inativo' ? 'ativo' : 'inativo';
    try {
      await api.patch(`/clients/${client.id}/`, { status: nextStatus });
      toast.success(nextStatus === 'ativo' ? 'Cliente reativado.' : 'Cliente desativado.');
      await queryClient.invalidateQueries({ queryKey: ['clients-crm', activeTenantId] });
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível atualizar o status.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setRelationshipFilter('all');
    setPortalFilter('all');
    setResponsibleFilter('all');
    setInadimplenciaOnly(false);
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div className="page-header items-start gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Users className="h-3.5 w-3.5" />
            CRM jurídico
          </div>
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatCount(rows.length)} clientes com leitura operacional de processos, documentos, financeiro e portal.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportRows}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Novo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden p-0">
              <div className="max-h-[92vh] overflow-y-auto">
                <DialogHeader className="border-b px-6 py-5">
                  <DialogTitle>{editingClientId ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
                  <DialogDescription>
                    Organize dados cadastrais, relacionamento interno e acesso ao portal num único fluxo.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <section className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-semibold">Dados básicos</p>
                        <p className="text-xs text-muted-foreground">
                          PF e PJ no mesmo cadastro, com base pronta para relacionamento jurídico.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={form.type} onValueChange={(value) => setForm((previous) => ({ ...previous, type: value as 'PF' | 'PJ' }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PF">Pessoa física</SelectItem>
                              <SelectItem value="PJ">Pessoa jurídica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>{form.type === 'PF' ? 'Nome completo' : 'Razão social'}</Label>
                          <Input value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>{form.type === 'PF' ? 'CPF' : 'CNPJ'}</Label>
                          <Input
                            value={form.doc}
                            onChange={(event) => setForm((previous) => ({ ...previous, doc: maskCpfCnpj(event.target.value) }))}
                            placeholder={form.type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{form.type === 'PF' ? 'RG' : 'Inscricao estadual'}</Label>
                          <Input value={form.rgIe} onChange={(event) => setForm((previous) => ({ ...previous, rgIe: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>{form.type === 'PF' ? 'Nascimento' : 'Abertura'}</Label>
                          <Input type="date" value={form.birthOrOpenDate} onChange={(event) => setForm((previous) => ({ ...previous, birthOrOpenDate: event.target.value }))} />
                        </div>
                        {form.type === 'PJ' ? (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Nome fantasia</Label>
                            <Input value={form.fantasyName} onChange={(event) => setForm((previous) => ({ ...previous, fantasyName: event.target.value }))} />
                          </div>
                        ) : (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Estado civil</Label>
                            <Input value={form.maritalStatus} onChange={(event) => setForm((previous) => ({ ...previous, maritalStatus: event.target.value }))} />
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-semibold">Contato</p>
                        <p className="text-xs text-muted-foreground">Canais usados no relacionamento com o cliente.</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={form.email} onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Telefone</Label>
                          <Input value={form.phone} onChange={(event) => setForm((previous) => ({ ...previous, phone: maskPhoneBR(event.target.value) }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>WhatsApp</Label>
                          <Input value={form.whatsapp} onChange={(event) => setForm((previous) => ({ ...previous, whatsapp: maskPhoneBR(event.target.value) }))} />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-semibold">Endereço</p>
                        <p className="text-xs text-muted-foreground">Base para atendimento, documentos e contato institucional.</p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label>CEP</Label>
                          <div className="relative">
                            <Input
                              value={form.cep}
                              maxLength={9}
                              onChange={async (event) => {
                                const masked = maskCEP(event.target.value);
                                setForm((previous) => ({ ...previous, cep: masked }));
                                const filled = await cepLookup.lookup(masked);
                                if (filled) {
                                  setForm((previous) => ({
                                    ...previous,
                                    street: filled.street || previous.street,
                                    neighborhood: filled.neighborhood || previous.neighborhood,
                                    city: filled.city || previous.city,
                                    state: filled.state || previous.state,
                                  }));
                                }
                              }}
                            />
                            {cepLookup.loading && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <Label>Rua</Label>
                          <Input value={form.street} onChange={(event) => setForm((previous) => ({ ...previous, street: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <Input value={form.number} onChange={(event) => setForm((previous) => ({ ...previous, number: event.target.value }))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Bairro</Label>
                          <Input value={form.neighborhood} onChange={(event) => setForm((previous) => ({ ...previous, neighborhood: event.target.value }))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Cidade</Label>
                          <Input value={form.city} onChange={(event) => setForm((previous) => ({ ...previous, city: event.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>UF</Label>
                          <Input value={form.state} maxLength={2} onChange={(event) => setForm((previous) => ({ ...previous, state: maskUF(event.target.value) }))} />
                        </div>
                        <div className="space-y-2 md:col-span-3">
                          <Label>Complemento</Label>
                          <Input value={form.complement} onChange={(event) => setForm((previous) => ({ ...previous, complement: event.target.value }))} />
                        </div>
                      </div>
                    </section>
                  </div>

                  <div className="space-y-6">
                    <section className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-semibold">Relacionamento</p>
                        <p className="text-xs text-muted-foreground">Contexto interno para operacao e acompanhamento.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Responsável interno</Label>
                          <Select value={form.responsibleId || 'none'} onValueChange={(value) => setForm((previous) => ({ ...previous, responsibleId: value === 'none' ? '' : value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não definido</SelectItem>
                              {responsibleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Origem do cliente</Label>
                          <Input value={form.origin} onChange={(event) => setForm((previous) => ({ ...previous, origin: event.target.value }))} placeholder="Indicacao, site, parceria..." />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={form.status} onValueChange={(value) => setForm((previous) => ({ ...previous, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                              <SelectItem value="prospecto">Prospecto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-3">
                          <div>
                            <p className="text-sm font-medium">Portal do cliente</p>
                            <p className="text-xs text-muted-foreground">Marca o cliente como preparado para acesso externo.</p>
                          </div>
                          <Switch checked={form.portalEnabled} onCheckedChange={(checked) => setForm((previous) => ({ ...previous, portalEnabled: checked }))} />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-semibold">Observações</p>
                        <p className="text-xs text-muted-foreground">Separe o que faz parte do cadastro do que fica só na gestão interna.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Observações do cadastro</Label>
                        <Textarea rows={4} value={form.publicNotes} onChange={(event) => setForm((previous) => ({ ...previous, publicNotes: event.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Observações internas</Label>
                        <Textarea rows={6} value={form.internalNotes} onChange={(event) => setForm((previous) => ({ ...previous, internalNotes: event.target.value }))} />
                      </div>
                    </section>
                  </div>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                  <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                  <Button onClick={saveClient} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : editingClientId ? 'Salvar alteracoes' : 'Cadastrar cliente'}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total da carteira" value={formatCount(stats.total)} description="Clientes PF e PJ consolidados." icon={Users} color="indigo" />
        <StatCard label="Clientes ativos" value={formatCount(stats.active)} description="Em acompanhamento ativo." icon={UserCheck} color="emerald" />
        <StatCard label="Com processo ativo" value={formatCount(stats.withActiveProcess)} description="Com demanda jurídica em andamento." icon={FolderOpen} color="sky" />
        <StatCard label="Portal e inadimplência" value={formatCount(stats.withPortal)} description={`${formatCount(stats.inadimplentes)} inadimplentes`} icon={AlertTriangle} color="amber" />
      </div>

      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Carteira de clientes</h2>
              <p className="text-sm text-muted-foreground">Busque, filtre e acione rapidamente processos, documentos, financeiro e portal.</p>
            </div>
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')}>
                <TableProperties className="mr-2 h-4 w-4" />
                Tabela
              </Button>
              <Button variant={view === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setView('cards')}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Cards
              </Button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, razão social, CPF/CNPJ, e-mail, telefone, responsável ou cidade"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">PF e PJ</SelectItem>
                <SelectItem value="PF">Pessoa física</SelectItem>
                <SelectItem value="PJ">Pessoa jurídica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
                <SelectItem value="prospecto">Prospectos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
              <SelectTrigger><SelectValue placeholder="Processos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with-process">Com processo ativo</SelectItem>
                <SelectItem value="without-process">Sem processo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={portalFilter} onValueChange={setPortalFilter}>
              <SelectTrigger><SelectValue placeholder="Portal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Portal: todos</SelectItem>
                <SelectItem value="enabled">Portal ativo</SelectItem>
                <SelectItem value="disabled">Sem portal</SelectItem>
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
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={typeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('all')}>Todos</Button>
            <Button variant={typeFilter === 'PF' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('PF')}>PF</Button>
            <Button variant={typeFilter === 'PJ' ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter('PJ')}>PJ</Button>
            <Button variant={relationshipFilter === 'with-process' ? 'default' : 'outline'} size="sm" onClick={() => setRelationshipFilter((current) => current === 'with-process' ? 'all' : 'with-process')}>Com processo</Button>
            <Button variant={portalFilter === 'enabled' ? 'default' : 'outline'} size="sm" onClick={() => setPortalFilter((current) => current === 'enabled' ? 'all' : 'enabled')}>Portal ativo</Button>
            <Button variant={inadimplenciaOnly ? 'default' : 'outline'} size="sm" onClick={() => setInadimplenciaOnly((current) => !current)}>Inadimplentes</Button>
            <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
          </div>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description="Crie clientes PF ou PJ, relacione processos e use este painel como sua carteira jurídica do dia a dia."
              action={{ label: 'Cadastrar cliente', onClick: openCreate }}
            />
          ) : view === 'cards' ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {pagedRows.map((row) => (
                <Card key={row.id} className="overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-card">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{row.displayName}</h3>
                          <Badge className={typeBadgeClass(row.type)}>{String(row.type || 'PF').toUpperCase()}</Badge>
                          <Badge className={clientStatusBadgeClass((row as any).status)}>{formatClientStatusLabel((row as any).status)}</Badge>
                          <Badge className={portalBadgeClass(row.portalEnabled)}>{row.portalEnabled ? 'Portal ativo' : 'Sem portal'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getLegalName(row)} {row.fantasyName && row.fantasyName !== getLegalName(row) ? `- ${row.fantasyName}` : ''}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}`)}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=processos`)}><FolderOpen className="mr-2 h-4 w-4" />Abrir processos</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=financeiro`)}><Wallet className="mr-2 h-4 w-4" />Abrir financeiro</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=documentos`)}><FileText className="mr-2 h-4 w-4" />Abrir documentos</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=portal`)}><ShieldCheck className="mr-2 h-4 w-4" />Portal do cliente</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleStatus(row)}>
                            {normalizeStatus((row as any).status) === 'inativo' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                            {normalizeStatus((row as any).status) === 'inativo' ? 'Reativar' : 'Desativar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contato</p>
                        <p className="mt-2 text-sm font-medium">{row.emailValue || 'Sem e-mail principal'}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{row.phoneValue || row.whatsappValue || 'Sem telefone informado'}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contexto</p>
                        <p className="mt-2 text-sm font-medium">{row.cityUfLabel}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{row.responsibleName}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-xl border p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Processos</p>
                        <p className="mt-2 text-2xl font-semibold">{row.processesCount}</p>
                        <p className="text-xs text-muted-foreground">{row.activeProcessesCount} ativos</p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Financeiro</p>
                        <p className="mt-2 text-lg font-semibold">{formatCurrency(row.inadimplencia)}</p>
                        <p className="text-xs text-muted-foreground">{row.hasInadimplencia ? 'Em aberto' : 'Carteira regular'}</p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Próxima audiência</p>
                        <p className="mt-2 text-sm font-semibold">{row.nextHearing ? formatDateTime(row.nextHearing.hearing_date) : 'Sem audiência'}</p>
                        <p className="text-xs text-muted-foreground">{row.nextHearing?.type || 'Sem agenda vinculada'}</p>
                      </div>
                      <div className="rounded-xl border p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Última movimentação</p>
                        <p className="mt-2 text-sm font-semibold">{formatDateTime(row.lastMovementAt)}</p>
                        <p className="text-xs text-muted-foreground">{row.latestDocumentTitle || 'Sem documento recente'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => navigate(`/app/clientes/${row.id}`)}>Abrir perfil</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/app/clientes/${row.id}?tab=processos`)}>Processos</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/app/clientes/${row.id}?tab=financeiro`)}>Financeiro</Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/app/clientes/${row.id}?tab=documentos`)}>Documentos</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="overflow-x-auto pb-2">
                <Table className="min-w-[1840px] table-fixed">
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="w-[300px] whitespace-nowrap">Nome / razão social</TableHead>
                      <TableHead className="w-[92px] whitespace-nowrap">Tipo</TableHead>
                      <TableHead className="w-[170px] whitespace-nowrap">CPF / CNPJ</TableHead>
                      <TableHead className="w-[290px] whitespace-nowrap">Contato</TableHead>
                      <TableHead className="w-[170px] whitespace-nowrap">Cidade / UF</TableHead>
                      <TableHead className="w-[120px] whitespace-nowrap">Processos</TableHead>
                      <TableHead className="w-[220px] whitespace-nowrap">Última movimentação</TableHead>
                      <TableHead className="w-[180px] whitespace-nowrap">Responsável</TableHead>
                      <TableHead className="w-[150px] whitespace-nowrap">Financeiro</TableHead>
                      <TableHead className="w-[140px] whitespace-nowrap">Portal</TableHead>
                      <TableHead className="w-[120px] whitespace-nowrap">Status</TableHead>
                      <TableHead className="sticky right-0 z-20 w-[88px] bg-background text-right whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((row) => (
                      <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/app/clientes/${row.id}`)}>
                        <TableCell className="align-top">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-medium">{row.displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {getLegalName(row)}{row.fantasyName && row.fantasyName !== getLegalName(row) ? ` - ${row.fantasyName}` : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap"><Badge className={typeBadgeClass(row.type)}>{String(row.type || 'PF').toUpperCase()}</Badge></TableCell>
                        <TableCell className="align-top font-mono text-xs whitespace-nowrap">{row.doc || '-'}</TableCell>
                        <TableCell className="align-top">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm">{row.emailValue || '-'}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.phoneValue || row.whatsappValue || 'Sem telefone'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">{row.cityUfLabel}</TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1 whitespace-nowrap">
                            <p className="font-medium">{row.processesCount}</p>
                            <p className="text-xs text-muted-foreground">{row.activeProcessesCount} ativos</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="min-w-0 space-y-1">
                            <p className="whitespace-nowrap text-sm">{formatDate(row.lastMovementAt)}</p>
                            <p className="line-clamp-2 text-xs text-muted-foreground">{row.latestDocumentTitle || 'Sem registro recente'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm">{row.responsibleName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1 whitespace-nowrap">
                            <p className={cn('text-sm font-medium', row.hasInadimplencia ? 'text-amber-700' : 'text-emerald-700')}>
                              {formatCurrency(row.inadimplencia)}
                            </p>
                            <p className="text-xs text-muted-foreground">{row.hasInadimplencia ? 'Em aberto' : 'Sem atraso'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap"><Badge className={portalBadgeClass(row.portalEnabled)}>{row.portalEnabled ? 'Ativado' : 'Não ativo'}</Badge></TableCell>
                        <TableCell className="align-top whitespace-nowrap"><Badge className={clientStatusBadgeClass((row as any).status)}>{formatClientStatusLabel((row as any).status)}</Badge></TableCell>
                        <TableCell className="sticky right-0 z-10 bg-background text-right shadow-[-10px_0_18px_-16px_rgba(15,23,42,0.45)]">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                              <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}`)}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=processos`)}><FolderOpen className="mr-2 h-4 w-4" />Processos</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=financeiro`)}><Wallet className="mr-2 h-4 w-4" />Financeiro</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=documentos`)}><FileText className="mr-2 h-4 w-4" />Documentos</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/app/clientes/${row.id}?tab=portal`)}><ShieldCheck className="mr-2 h-4 w-4" />Portal</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleStatus(row)}>
                                {normalizeStatus((row as any).status) === 'inativo' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                                {normalizeStatus((row as any).status) === 'inativo' ? 'Reativar' : 'Desativar'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {filteredRows.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima</Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
