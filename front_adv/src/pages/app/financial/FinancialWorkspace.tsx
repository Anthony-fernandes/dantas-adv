import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTenant } from '@/contexts/TenantContext';
import { api, apiGetAllPages, getAccessToken, getActiveTenantId } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

type PeriodFilter = 'today' | '7d' | '30d' | 'month' | 'custom';
type TabKey = 'receivable' | 'payable' | 'payments';

type ClientItem = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  razao_social?: string | null;
};

type ProcessResponsible = {
  id?: string | null;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type ProcessItem = {
  id: string;
  cnj?: string | null;
  subject?: string | null;
  client?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  responsaveis?: ProcessResponsible[] | null;
};

type EmployeeItem = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type ReceivableRecord = {
  id: string;
  description?: string | null;
  amount?: string | number | null;
  status?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  paid_date?: string | null;
  client?: string | null;
  client_id?: string | null;
  process?: string | null;
  process_id?: string | null;
  category?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  installments_count?: number | null;
  installment_interval_days?: number | null;
};

type PayableRecord = {
  id: string;
  description?: string | null;
  amount?: string | number | null;
  status?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
  payment_date?: string | null;
  supplier?: string | null;
  process?: string | null;
  process_id?: string | null;
  category?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type PaymentRecord = {
  id: string;
  amount?: string | number | null;
  payment_date?: string | null;
  method?: string | null;
  receivable?: string | null;
  client?: string | null;
  process?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type ReceivableRow = ReceivableRecord & {
  amountValue: number;
  clientId: string;
  clientLabel: string;
  processId: string;
  processLabel: string;
  responsibleId: string;
  responsibleLabel: string;
  billingMethod: string;
  recurrence: string;
  overdue: boolean;
  dueToday: boolean;
  dueSoon: boolean;
  paid: boolean;
};

type PayableRow = PayableRecord & {
  amountValue: number;
  clientId: string;
  clientLabel: string;
  processId: string;
  processLabel: string;
  responsibleId: string;
  responsibleLabel: string;
  categoryLabel: string;
  overdue: boolean;
  dueToday: boolean;
  dueSoon: boolean;
  paid: boolean;
  resolvedStatus: string;
  statusText: string;
};

type PaymentHistoryRow = {
  id: string;
  kind: 'recebimento' | 'pagamento';
  title: string;
  amountValue: number;
  paymentDate: string | null;
  method: string;
  reference: string;
  clientId: string;
  clientLabel: string;
  processId: string;
  processLabel: string;
  notes: string;
  sourceId: string;
};

type FinanceFilters = {
  search: string;
  period: PeriodFilter;
  customFrom: string;
  customTo: string;
  clientId: string;
  processId: string;
  status: string;
  category: string;
  responsibleId: string;
  method: string;
  urgency: string;
};

type DateRange = {
  from: Date | null;
  to: Date | null;
};

type ComparisonTone = 'up' | 'down' | 'neutral';

type Comparison = {
  label: string;
  tone: ComparisonTone;
};

type KpiCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: typeof DollarSign;
  tone: 'emerald' | 'amber' | 'sky' | 'slate' | 'rose';
  comparison?: Comparison | null;
  onClick?: () => void;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  actionLabel: string;
  onClick: () => void;
};

type ReceivableDialogInitial = {
  id?: string;
  description?: string | null;
  amount?: string | number | null;
  due_date?: string | null;
  category?: string | null;
  client?: string | null;
  process?: string | null;
  notes?: string | null;
  status?: string | null;
  installments_count?: number | null;
  installment_interval_days?: number | null;
};

type PayableDialogInitial = {
  id?: string;
  description?: string | null;
  supplier?: string | null;
  amount?: string | number | null;
  due_date?: string | null;
  category?: string | null;
  process?: string | null;
  notes?: string | null;
  status?: string | null;
};

type PaymentDialogInitial = {
  mode?: 'receivable' | 'payable';
  receivable?: string;
  payable?: string;
  amount?: string | number | null;
  payment_date?: string | null;
  method?: string | null;
  notes?: string | null;
};

type ReceivableFormState = {
  description: string;
  client: string;
  process: string;
  amount: string;
  dueDate: string;
  category: string;
  status: string;
  installmentsCount: string;
  installmentIntervalDays: string;
  notes: string;
};

type PayableFormState = {
  description: string;
  supplier: string;
  process: string;
  amount: string;
  dueDate: string;
  category: string;
  status: string;
  notes: string;
};

type PaymentFormState = {
  mode: 'receivable' | 'payable';
  receivable: string;
  payable: string;
  amount: string;
  paymentDate: string;
  method: string;
  notes: string;
};

type OptionItem = {
  value: string;
  label: string;
};

const PAGE_SIZE = 10;
const PIE_COLORS = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#dc2626'];

const DEFAULT_FILTERS: FinanceFilters = {
  search: '',
  period: '30d',
  customFrom: '',
  customTo: '',
  clientId: 'all',
  processId: 'all',
  status: 'all',
  category: 'all',
  responsibleId: 'all',
  method: 'all',
  urgency: 'all',
};

const PERIOD_OPTIONS: OptionItem[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Próximos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Mês atual' },
  { value: 'custom', label: 'Personalizado' },
];

const STATUS_OPTIONS: OptionItem[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'pago', label: 'Pago' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'cancelado', label: 'Cancelado' },
];

const URGENCY_OPTIONS: OptionItem[] = [
  { value: 'all', label: 'Todos os prazos' },
  { value: 'today', label: 'Vence hoje' },
  { value: 'upcoming', label: 'Próximos 7 dias' },
  { value: 'overdue', label: 'Vencidos' },
];

const RECEIVABLE_CATEGORY_OPTIONS: OptionItem[] = [
  { value: 'honorarios', label: 'Honorários' },
  { value: 'mensalidade', label: 'Mensalidade' },
  { value: 'acordo', label: 'Acordo' },
  { value: 'custas_reembolso', label: 'Reembolso de custas' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'outros', label: 'Outros' },
];

const PAYABLE_CATEGORY_OPTIONS: OptionItem[] = [
  { value: 'custas', label: 'Custas' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'folha', label: 'Folha' },
  { value: 'tributos', label: 'Tributos' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'outros', label: 'Outros' },
];

const PAYMENT_METHOD_OPTIONS: OptionItem[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
];

function safeAllPages<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>) {
  return apiGetAllPages<T>(path, params).catch(() => [] as T[]);
}

function normalizeText(value?: string | number | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
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

function amountValue(value?: string | number | null) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatMonthLabel(value: Date) {
  return value.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function resolvePeriodRange(period: PeriodFilter, customFrom: string, customTo: string): DateRange {
  const today = new Date();
  if (period === 'today') {
    return { from: startOfDay(today), to: endOfDay(today) };
  }
  if (period === '7d') {
    return { from: startOfDay(addDays(today, -6)), to: endOfDay(today) };
  }
  if (period === '30d') {
    return { from: startOfDay(addDays(today, -29)), to: endOfDay(today) };
  }
  if (period === 'month') {
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: endOfDay(today) };
  }
  return {
    from: customFrom ? startOfDay(new Date(customFrom)) : null,
    to: customTo ? endOfDay(new Date(customTo)) : null,
  };
}

function buildPreviousRange(range: DateRange): DateRange | null {
  if (!range.from || !range.to) return null;
  const duration = range.to.getTime() - range.from.getTime();
  const previousTo = new Date(range.from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - duration);
  return { from: previousFrom, to: previousTo };
}

function dateInRange(value: string | null | undefined, range: DateRange) {
  const parsed = safeDate(value);
  if (!parsed) return false;
  if (range.from && parsed < range.from) return false;
  if (range.to && parsed > range.to) return false;
  return true;
}

function daysUntil(value?: string | null) {
  const parsed = safeDate(value);
  if (!parsed) return null;
  const diff = startOfDay(parsed).getTime() - startOfDay(new Date()).getTime();
  return Math.round(diff / 86400000);
}

function statusTone(status?: string | null) {
  const normalized = normalizeText(status);
  if (['paga', 'pago', 'recebida', 'recebido'].includes(normalized)) return 'success';
  if (['vencida', 'vencido', 'atrasado'].includes(normalized)) return 'danger';
  if (['cancelada', 'cancelado'].includes(normalized)) return 'muted';
  if (['parcial'].includes(normalized)) return 'warning';
  if (['emitida'].includes(normalized)) return 'info';
  return 'open';
}

function statusLabel(status?: string | null, kind: 'receivable' | 'payable' | 'payment' = 'receivable') {
  const normalized = normalizeText(status);
  if (kind === 'payment') return normalized ? String(status) : 'Registrado';
  if (!normalized) return 'Pendente';
  if (['aberta', 'aberto', 'pendente', 'emitida'].includes(normalized)) return 'Pendente';
  if (['paga', 'pago'].includes(normalized)) return kind === 'receivable' ? 'Recebido' : 'Pago';
  if (normalized === 'parcial') return 'Parcial';
  if (['vencida', 'vencido', 'atrasado'].includes(normalized)) return 'Vencido';
  if (['cancelada', 'cancelado'].includes(normalized)) return 'Cancelado';
  return String(status);
}

function statusBadgeClass(status?: string | null) {
  const tone = statusTone(status);
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (tone === 'danger') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (tone === 'info') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (tone === 'muted') return 'border-border bg-muted text-muted-foreground';
  return 'border-border bg-card text-muted-foreground';
}

function urgencyMatches(filters: FinanceFilters, dueDate?: string | null, paid?: boolean) {
  if (filters.urgency === 'all') return true;
  if (paid) return false;
  const diff = daysUntil(dueDate);
  if (diff == null) return false;
  if (filters.urgency === 'overdue') return diff < 0;
  if (filters.urgency === 'today') return diff === 0;
  if (filters.urgency === 'upcoming') return diff > 0 && diff <= 7;
  return true;
}

function buildComparison(current: number, previous: number, formatter: (value: number) => string = (value) => String(value)): Comparison | null {
  if (!Number.isFinite(previous)) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.001) return { label: `Sem variação vs. período anterior`, tone: 'neutral' };
  const tone: ComparisonTone = diff > 0 ? 'up' : 'down';
  const prefix = diff > 0 ? '+' : '-';
  return { label: `${prefix}${formatter(Math.abs(diff))} vs. período anterior`, tone };
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function labelFromOptions(options: OptionItem[], value?: string | null, fallback = 'Não informado') {
  const found = options.find((item) => item.value === value);
  return found?.label || (value ? value : fallback);
}

function optionValue(value?: string | null) {
  return value ? String(value) : 'none';
}

function compareDateAsc(a?: string | null, b?: string | null) {
  return (safeDate(a)?.getTime() || 0) - (safeDate(b)?.getTime() || 0);
}

function compareDateDesc(a?: string | null, b?: string | null) {
  return (safeDate(b)?.getTime() || 0) - (safeDate(a)?.getTime() || 0);
}

function defaultReceivableForm(initial?: ReceivableDialogInitial | null): ReceivableFormState {
  return {
    description: String(initial?.description || ''),
    client: String(initial?.client || ''),
    process: String(initial?.process || ''),
    amount: initial?.amount != null ? String(initial.amount) : '',
    dueDate: initial?.due_date ? String(initial.due_date).slice(0, 10) : '',
    category: String(initial?.category || 'honorarios'),
    status: String(initial?.status || 'aberta'),
    installmentsCount: String(initial?.installments_count || 1),
    installmentIntervalDays: String(initial?.installment_interval_days || 30),
    notes: String(initial?.notes || ''),
  };
}

function defaultPayableForm(initial?: PayableDialogInitial | null): PayableFormState {
  return {
    description: String(initial?.description || ''),
    supplier: String(initial?.supplier || ''),
    process: String(initial?.process || ''),
    amount: initial?.amount != null ? String(initial.amount) : '',
    dueDate: initial?.due_date ? String(initial.due_date).slice(0, 10) : '',
    category: String(initial?.category || 'custas'),
    status: String(initial?.status || 'aberta'),
    notes: String(initial?.notes || ''),
  };
}

function defaultPaymentForm(initial?: PaymentDialogInitial | null): PaymentFormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    mode: initial?.mode || 'receivable',
    receivable: String(initial?.receivable || ''),
    payable: String(initial?.payable || ''),
    amount: initial?.amount != null ? String(initial.amount) : '',
    paymentDate: initial?.payment_date ? String(initial.payment_date).slice(0, 10) : today,
    method: String(initial?.method || 'pix'),
    notes: String(initial?.notes || ''),
  };
}

function KpiCard({ title, value, helper, icon: Icon, tone, comparison, onClick }: KpiCardProps) {
  const toneClasses = {
    emerald: 'from-emerald-500/10 via-emerald-500/0 to-transparent',
    amber: 'from-amber-500/10 via-amber-500/0 to-transparent',
    sky: 'from-sky-500/10 via-sky-500/0 to-transparent',
    slate: 'from-slate-500/10 via-slate-500/0 to-transparent',
    rose: 'from-rose-500/10 via-rose-500/0 to-transparent',
  } as const;

  return (
    <Card
      className={cn('overflow-hidden border shadow-card transition-transform', onClick ? 'cursor-pointer hover:-translate-y-0.5' : '')}
      onClick={onClick}
    >
      <CardContent className={cn('relative p-5', `bg-gradient-to-br ${toneClasses[tone]}`)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{helper}</p>
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-4', {
            emerald: 'bg-emerald-600 shadow-emerald-100 ring-emerald-100',
            amber:   'bg-amber-500 shadow-amber-100 ring-amber-100',
            sky:     'bg-sky-500 shadow-sky-100 ring-sky-100',
            slate:   'bg-slate-500 shadow-slate-100 ring-slate-100',
            rose:    'bg-rose-600 shadow-rose-100 ring-rose-100',
          }[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {comparison ? (
          <p className={cn('mt-4 text-xs font-medium', comparison.tone === 'up' && 'text-emerald-700', comparison.tone === 'down' && 'text-rose-700', comparison.tone === 'neutral' && 'text-muted-foreground')}>
            {comparison.label}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

async function downloadReport(kind: TabKey) {
  try {
    const rawBase = String((import.meta as any).env?.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
    const reportKind = kind === 'receivable' ? 'receivable' : kind === 'payable' ? 'payable' : 'payments';
    const url = rawBase ? `${rawBase}/api/finance/report/?kind=${reportKind}` : `/api/finance/report/?kind=${reportKind}`;
    const headers: Record<string, string> = {};
    const access = getAccessToken();
    const tenantId = getActiveTenantId();
    if (access) headers.Authorization = `Bearer ${access}`;
    if (tenantId) headers['X-Tenant-ID'] = tenantId;
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`Falha ao exportar relatorio (${response.status})`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `financeiro-${reportKind}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error: any) {
    toast.error(error?.message || 'Falha ao exportar o relatorio.');
  }
}

async function copyChargeMessage(row: ReceivableRow, mode: 'generate' | 'resend') {
  const lines = [
    `Cobrança: ${row.description || 'Lançamento financeiro'}`,
    `Cliente: ${row.clientLabel}`,
    `Processo: ${row.processLabel}`,
    `Valor: ${formatCurrency(row.amountValue)}`,
    `Vencimento: ${formatDate(row.due_date)}`,
    `Forma de cobrança: ${row.billingMethod || 'não definida'}`,
  ];
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    toast.success(mode === 'generate' ? 'Resumo da cobrança copiado para envio.' : 'Cobrança pronta para reenvio via clipboard.');
  } catch {
    toast.error('Não foi possível copiar a cobrança automaticamente.');
  }
}

export default function FinancialWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeTenantId } = useTenant();

  const [tab, setTab] = useState<TabKey>('receivable');
  const [filters, setFilters] = useState<FinanceFilters>(DEFAULT_FILTERS);
  const [pageReceivable, setPageReceivable] = useState(1);
  const [pagePayable, setPagePayable] = useState(1);
  const [pagePayments, setPagePayments] = useState(1);
  const [receivableDialogOpen, setReceivableDialogOpen] = useState(false);
  const [payableDialogOpen, setPayableDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<ReceivableDialogInitial | null>(null);
  const [editingPayable, setEditingPayable] = useState<PayableDialogInitial | null>(null);
  const [paymentInitial, setPaymentInitial] = useState<PaymentDialogInitial | null>(null);
  const [submittingKind, setSubmittingKind] = useState<'receivable' | 'payable' | 'payment' | null>(null);

  useEffect(() => {
    setPageReceivable(1);
    setPagePayable(1);
    setPagePayments(1);
  }, [filters, tab]);

  const workspaceQuery = useQuery({
    queryKey: ['financial-workspace', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const [clients, processes, employees, receivables, payables, payments] = await Promise.all([
        safeAllPages<ClientItem>('/clients/', { ordering: 'name' }),
        safeAllPages<ProcessItem>('/processes/', { ordering: '-updated_at' }),
        safeAllPages<EmployeeItem>('/employees/', { ordering: 'full_name' }),
        safeAllPages<ReceivableRecord>('/accounts-receivable/', { ordering: '-due_date' }),
        safeAllPages<PayableRecord>('/accounts-payable/', { ordering: '-due_date' }),
        safeAllPages<PaymentRecord>('/payments/', { ordering: '-payment_date' }),
      ]);

      return { clients, processes, employees, receivables, payables, payments };
    },
  });

  const clients = workspaceQuery.data?.clients ?? [];
  const processes = workspaceQuery.data?.processes ?? [];
  const employees = workspaceQuery.data?.employees ?? [];
  const receivables = workspaceQuery.data?.receivables ?? [];
  const payables = workspaceQuery.data?.payables ?? [];
  const payments = workspaceQuery.data?.payments ?? [];

  const processLookup = useMemo(() => new Map(processes.map((item) => [item.id, item])), [processes]);
  const clientMap = useMemo(
    () => new Map(clients.map((item) => [item.id, String(item.name || item.full_name || item.razao_social || 'Cliente').trim()])),
    [clients],
  );
  const processMap = useMemo(
    () => new Map(processes.map((item) => [item.id, String(item.cnj || item.subject || item.id).trim()])),
    [processes],
  );
  const processResponsibleMap = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    processes.forEach((process) => {
      const responsible = Array.isArray(process.responsaveis) ? process.responsaveis[0] : null;
      const label = String(responsible?.name || responsible?.full_name || responsible?.email || '').trim();
      const id = responsible?.id ? String(responsible.id) : label ? `label:${label}` : '';
      if (process.id && label) map.set(process.id, { id, label });
    });
    return map;
  }, [processes]);

  const range = useMemo(() => resolvePeriodRange(filters.period, filters.customFrom, filters.customTo), [filters.period, filters.customFrom, filters.customTo]);
  const previousRange = useMemo(() => buildPreviousRange(range), [range]);

  const clientOptions = useMemo<OptionItem[]>(
    () =>
      clients
        .map((item) => ({ value: item.id, label: String(item.name || item.full_name || item.razao_social || 'Cliente').trim() }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [clients],
  );
  const processOptions = useMemo<OptionItem[]>(
    () =>
      processes
        .map((item) => ({ value: item.id, label: String(item.cnj || item.subject || item.id).trim() }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [processes],
  );
  const responsibleOptions = useMemo<OptionItem[]>(
    () =>
      Array.from(
        new Map(
          [
            ...employees.map((item) => [item.id, { value: item.id, label: String(item.full_name || item.email || 'Responsável').trim() }] as const),
            ...Array.from(processResponsibleMap.values()).map((item) => [item.id, { value: item.id, label: item.label }] as const),
          ].filter(([value]) => Boolean(value)),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [employees, processResponsibleMap],
  );
  const categoryOptions = useMemo<OptionItem[]>(
    () => [{ value: 'all', label: 'Todas as categorias' }, ...RECEIVABLE_CATEGORY_OPTIONS, ...PAYABLE_CATEGORY_OPTIONS.filter((item) => !RECEIVABLE_CATEGORY_OPTIONS.some((base) => base.value === item.value))],
    [],
  );
  const methodOptions = useMemo<OptionItem[]>(
    () => [{ value: 'all', label: 'Todas as formas' }, ...PAYMENT_METHOD_OPTIONS],
    [],
  );
  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== ''
      || filters.period !== DEFAULT_FILTERS.period
      || filters.customFrom !== DEFAULT_FILTERS.customFrom
      || filters.customTo !== DEFAULT_FILTERS.customTo
      || filters.clientId !== DEFAULT_FILTERS.clientId
      || filters.processId !== DEFAULT_FILTERS.processId
      || filters.status !== DEFAULT_FILTERS.status
      || filters.category !== DEFAULT_FILTERS.category
      || filters.responsibleId !== DEFAULT_FILTERS.responsibleId
      || filters.method !== DEFAULT_FILTERS.method
      || filters.urgency !== DEFAULT_FILTERS.urgency,
    [filters],
  );

  const receivableRows = useMemo<ReceivableRow[]>(
    () =>
      receivables
        .map((item) => {
          const clientId = String(item.client || item.client_id || '');
          const processId = String(item.process || item.process_id || '');
          const processRecord = processLookup.get(processId);
          const resolvedClientId = clientId || String(processRecord?.client || processRecord?.client_id || '');
          const diff = daysUntil(item.due_date);
          const paid = statusTone(item.status) === 'success' || Boolean(item.payment_date) || Boolean(item.paid_date);
          const overdue = !paid && diff != null && diff < 0;
          const inheritedResponsible = processResponsibleMap.get(processId);
          return {
            ...item,
            amountValue: amountValue(item.amount),
            clientId: resolvedClientId,
            clientLabel: clientMap.get(resolvedClientId) || String(processRecord?.client_name || 'Sem cliente').trim() || 'Sem cliente',
            processId,
            processLabel: processMap.get(processId) || 'Sem processo',
            responsibleId: inheritedResponsible?.id || '',
            responsibleLabel: inheritedResponsible?.label || 'Não definido',
            billingMethod: 'manual',
            recurrence: Number(item.installments_count || 1) > 1 ? 'parcelada' : 'unica',
            overdue,
            dueToday: !paid && diff === 0,
            dueSoon: !paid && diff != null && diff > 0 && diff <= 7,
            paid,
          };
        })
        .sort((a, b) => compareDateAsc(a.due_date, b.due_date)),
    [receivables, processLookup, processResponsibleMap, clientMap, processMap],
  );

  const payableRows = useMemo<PayableRow[]>(
    () =>
      payables
        .map((item) => {
          const processId = String(item.process || item.process_id || '');
          const processRecord = processLookup.get(processId);
          const clientId = String(processRecord?.client || processRecord?.client_id || '');
          const diff = daysUntil(item.due_date);
          const paid = statusTone(item.status) === 'success' || Boolean(item.paid_date) || Boolean(item.payment_date);
          const overdue = !paid && diff != null && diff < 0;
          const resolvedStatus = paid ? 'paga' : overdue ? 'vencida' : item.status || 'aberta';
          const inheritedResponsible = processResponsibleMap.get(processId);
          return {
            ...item,
            amountValue: amountValue(item.amount),
            clientId,
            clientLabel: clientMap.get(clientId) || String(processRecord?.client_name || 'Sem cliente').trim() || 'Sem cliente',
            processId,
            processLabel: processMap.get(processId) || 'Sem processo',
            responsibleId: inheritedResponsible?.id || '',
            responsibleLabel: inheritedResponsible?.label || 'Não definido',
            categoryLabel: labelFromOptions(PAYABLE_CATEGORY_OPTIONS, item.category, 'Outros'),
            overdue,
            dueToday: !paid && diff === 0,
            dueSoon: !paid && diff != null && diff > 0 && diff <= 7,
            paid,
            resolvedStatus,
            statusText: statusLabel(resolvedStatus, 'payable'),
          };
        })
        .sort((a, b) => compareDateAsc(a.due_date, b.due_date)),
    [payables, processLookup, processResponsibleMap, clientMap, processMap],
  );

  const receivableLookup = useMemo(() => new Map(receivableRows.map((item) => [item.id, item])), [receivableRows]);
  const paymentHistory = useMemo<PaymentHistoryRow[]>(
    () => {
      const incoming = payments.map((item) => {
        const linkedReceivable = receivableLookup.get(String(item.receivable || ''));
        const clientId = String(item.client || linkedReceivable?.clientId || '');
        const processId = String(item.process || linkedReceivable?.processId || '');
        return {
          id: `payment:${item.id}`,
          kind: 'recebimento' as const,
          title: linkedReceivable?.description || 'Recebimento registrado',
          amountValue: amountValue(item.amount),
          paymentDate: item.payment_date || item.created_at || null,
          method: String(item.method || 'pix'),
          reference: linkedReceivable?.description || linkedReceivable?.processLabel || 'Conta a receber',
          clientId,
          clientLabel: clientMap.get(clientId) || linkedReceivable?.clientLabel || 'Sem cliente',
          processId,
          processLabel: processMap.get(processId) || linkedReceivable?.processLabel || 'Sem processo',
          notes: String(item.notes || ''),
          sourceId: item.id,
        };
      });

      const outgoing = payableRows
        .filter((item) => item.paid)
        .map((item) => ({
          id: `payable:${item.id}`,
          kind: 'pagamento' as const,
          title: item.description || 'Pagamento registrado',
          amountValue: item.amountValue,
          paymentDate: item.paid_date || item.payment_date || item.updated_at || null,
          method: 'baixa_manual',
          reference: item.supplier || item.categoryLabel || 'Conta a pagar',
          clientId: item.clientId,
          clientLabel: item.clientLabel,
          processId: item.processId,
          processLabel: item.processLabel,
          notes: String(item.notes || ''),
          sourceId: item.id,
        }));

      return [...incoming, ...outgoing].sort((a, b) => compareDateDesc(a.paymentDate, b.paymentDate));
    },
    [payments, receivableLookup, payableRows, clientMap, processMap],
  );

  const matchesSearch = (values: Array<string | null | undefined>) => {
    const search = normalizeText(filters.search);
    if (!search) return true;
    return normalizeText(values.join(' ')).includes(search);
  };

  const matchesReceivable = (row: ReceivableRow, targetRange: DateRange) => {
    const statusText = row.paid ? 'recebido' : row.overdue ? 'vencido' : row.status ? statusLabel(row.status, 'receivable') : 'pendente';
    return (
      matchesSearch([row.description, row.clientLabel, row.processLabel, row.responsibleLabel, row.notes]) &&
      dateInRange(row.due_date, targetRange) &&
      (filters.clientId === 'all' || row.clientId === filters.clientId) &&
      (filters.processId === 'all' || row.processId === filters.processId) &&
      (filters.status === 'all' || normalizeText(statusText) === normalizeText(filters.status)) &&
      (filters.category === 'all' || row.category === filters.category) &&
      (filters.responsibleId === 'all' || row.responsibleId === filters.responsibleId) &&
      urgencyMatches(filters, row.due_date, row.paid)
    );
  };

  const matchesPayable = (row: PayableRow, targetRange: DateRange) => {
    return (
      matchesSearch([row.description, row.clientLabel, row.processLabel, row.responsibleLabel, row.notes, row.supplier]) &&
      dateInRange(row.due_date, targetRange) &&
      (filters.clientId === 'all' || row.clientId === filters.clientId) &&
      (filters.processId === 'all' || row.processId === filters.processId) &&
      (filters.status === 'all' || normalizeText(row.statusText) === normalizeText(filters.status)) &&
      (filters.category === 'all' || row.category === filters.category) &&
      (filters.responsibleId === 'all' || row.responsibleId === filters.responsibleId) &&
      urgencyMatches(filters, row.due_date, row.paid)
    );
  };

  const matchesPayment = (row: PaymentHistoryRow, targetRange: DateRange) => {
    return (
      matchesSearch([row.title, row.clientLabel, row.processLabel, row.reference, row.notes]) &&
      dateInRange(row.paymentDate, targetRange) &&
      (filters.clientId === 'all' || row.clientId === filters.clientId) &&
      (filters.processId === 'all' || row.processId === filters.processId) &&
      (filters.method === 'all' || row.method === filters.method)
    );
  };

  const filteredReceivables = useMemo(() => receivableRows.filter((row) => matchesReceivable(row, range)), [receivableRows, range, filters]);
  const filteredPayables = useMemo(() => payableRows.filter((row) => matchesPayable(row, range)), [payableRows, range, filters]);
  const filteredPayments = useMemo(() => paymentHistory.filter((row) => matchesPayment(row, range)), [paymentHistory, range, filters]);

  const previousReceivables = useMemo(() => (previousRange ? receivableRows.filter((row) => matchesReceivable(row, previousRange)) : []), [receivableRows, previousRange, filters]);
  const previousPayables = useMemo(() => (previousRange ? payableRows.filter((row) => matchesPayable(row, previousRange)) : []), [payableRows, previousRange, filters]);
  const previousPayments = useMemo(() => (previousRange ? paymentHistory.filter((row) => matchesPayment(row, previousRange)) : []), [paymentHistory, previousRange, filters]);

  const kpis = useMemo(() => {
    const totalReceber = filteredReceivables.filter((item) => !item.paid).reduce((total, item) => total + item.amountValue, 0);
    const totalVencido = filteredReceivables.filter((item) => item.overdue).reduce((total, item) => total + item.amountValue, 0);
    const totalPagar = filteredPayables.filter((item) => !item.paid).reduce((total, item) => total + item.amountValue, 0);
    const totalRecebido = filteredPayments.filter((item) => item.kind === 'recebimento').reduce((total, item) => total + item.amountValue, 0);
    const totalPago = filteredPayments.filter((item) => item.kind === 'pagamento').reduce((total, item) => total + item.amountValue, 0);
    const previsao = receivableRows
      .filter((item) => !item.paid)
      .filter((item) => {
        const diff = daysUntil(item.due_date);
        return diff != null && diff >= 0 && diff <= 7;
      })
      .reduce((total, item) => total + item.amountValue, 0);
    const saldo = totalRecebido - totalPago;
    const inadimplencia = totalReceber > 0 ? (totalVencido / totalReceber) * 100 : 0;

    const previousReceber = previousReceivables.filter((item) => !item.paid).reduce((total, item) => total + item.amountValue, 0);
    const previousVencido = previousReceivables.filter((item) => item.overdue).reduce((total, item) => total + item.amountValue, 0);
    const previousPagar = previousPayables.filter((item) => !item.paid).reduce((total, item) => total + item.amountValue, 0);
    const previousRecebido = previousPayments.filter((item) => item.kind === 'recebimento').reduce((total, item) => total + item.amountValue, 0);
    const previousPago = previousPayments.filter((item) => item.kind === 'pagamento').reduce((total, item) => total + item.amountValue, 0);
    const previousSaldo = previousRecebido - previousPago;
    const previousPrevisao = previousReceivables
      .filter((item) => !item.paid)
      .filter((item) => {
        const diff = daysUntil(item.due_date);
        return diff != null && diff >= 0 && diff <= 7;
      })
      .reduce((total, item) => total + item.amountValue, 0);
    const previousInadimplencia = previousReceber > 0 ? (previousVencido / previousReceber) * 100 : 0;

    return {
      totalReceber,
      totalVencido,
      totalPagar,
      totalRecebido,
      totalPago,
      saldo,
      previsao,
      inadimplencia,
      comparisons: {
        totalReceber: buildComparison(totalReceber, previousReceber, formatCurrency),
        totalVencido: buildComparison(totalVencido, previousVencido, formatCurrency),
        totalPagar: buildComparison(totalPagar, previousPagar, formatCurrency),
        totalRecebido: buildComparison(totalRecebido, previousRecebido, formatCurrency),
        totalPago: buildComparison(totalPago, previousPago, formatCurrency),
        saldo: buildComparison(saldo, previousSaldo, formatCurrency),
        previsao: buildComparison(previsao, previousPrevisao, formatCurrency),
        inadimplencia: buildComparison(inadimplencia, previousInadimplencia, (value) => `${value.toFixed(1)} p.p.`),
      },
    };
  }, [filteredReceivables, filteredPayables, filteredPayments, previousReceivables, previousPayables, previousPayments, receivableRows]);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];
    const overdueReceivables = receivableRows.filter((item) => item.overdue);
    const overduePayables = payableRows.filter((item) => item.overdue);
    const dueTodayReceivables = receivableRows.filter((item) => item.dueToday);
    const upcomingReceipts = receivableRows.filter((item) => item.dueSoon && !item.paid);

    if (overdueReceivables.length) {
      items.push({
        id: 'receivable-overdue',
        title: `${formatCount(overdueReceivables.length)} cobrança(s) vencida(s)`,
        description: `${formatCurrency(overdueReceivables.reduce((total, item) => total + item.amountValue, 0))} exigem acao imediata.`,
        tone: 'danger',
        actionLabel: 'Abrir cobranças',
        onClick: () => {
          setTab('receivable');
          setFilters((current) => ({ ...current, urgency: 'overdue' }));
        },
      });
    }
    if (overduePayables.length) {
      items.push({
        id: 'payable-overdue',
        title: `${formatCount(overduePayables.length)} despesa(s) vencida(s)`,
        description: 'Regularize o contas a pagar para preservar o fluxo do escritório.',
        tone: 'warning',
        actionLabel: 'Abrir despesas',
        onClick: () => {
          setTab('payable');
          setFilters((current) => ({ ...current, urgency: 'overdue' }));
        },
      });
    }
    if (dueTodayReceivables.length) {
      items.push({
        id: 'due-today',
        title: `${formatCount(dueTodayReceivables.length)} cobrança(s) vencem hoje`,
        description: 'Momento ideal para reforcar follow-up e evitar atraso.',
        tone: 'info',
        actionLabel: 'Ver hoje',
        onClick: () => {
          setTab('receivable');
          setFilters((current) => ({ ...current, urgency: 'today' }));
        },
      });
    }
    if (upcomingReceipts.length) {
      items.push({
        id: 'forecast-week',
        title: 'Recebimentos previstos na semana',
        description: `${formatCurrency(upcomingReceipts.reduce((total, item) => total + item.amountValue, 0))} previstos para os próximos 7 dias.`,
        tone: 'success',
        actionLabel: 'Ver previsão',
        onClick: () => {
          setTab('receivable');
          setFilters((current) => ({ ...current, urgency: 'upcoming' }));
        },
      });
    }

    return items;
  }, [receivableRows, payableRows]);

  const monthlyProjectionData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: formatMonthLabel(date),
        receber: 0,
        pagar: 0,
      };
    });
    const bucket = new Map(months.map((item) => [item.key, item]));
    receivableRows.forEach((item) => {
      const parsed = safeDate(item.due_date);
      if (!parsed) return;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      if (bucket.has(key)) bucket.get(key)!.receber += item.amountValue;
    });
    payableRows.forEach((item) => {
      const parsed = safeDate(item.due_date);
      if (!parsed) return;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      if (bucket.has(key)) bucket.get(key)!.pagar += item.amountValue;
    });
    return months;
  }, [receivableRows, payableRows]);

  const cashFlowData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: formatMonthLabel(date),
        recebido: 0,
        pago: 0,
      };
    });
    const bucket = new Map(months.map((item) => [item.key, item]));
    paymentHistory.forEach((item) => {
      const parsed = safeDate(item.paymentDate);
      if (!parsed) return;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
      const current = bucket.get(key);
      if (!current) return;
      if (item.kind === 'recebimento') current.recebido += item.amountValue;
      else current.pago += item.amountValue;
    });
    return months;
  }, [paymentHistory]);

  const receivableStatusData = useMemo(
    () =>
      Array.from(
        receivableRows.reduce((map, item) => {
          const label = item.paid ? 'Recebido' : item.overdue ? 'Vencido' : 'Pendente';
          map.set(label, (map.get(label) || 0) + item.amountValue);
          return map;
        }, new Map<string, number>()),
      ).map(([name, value]) => ({ name, value })),
    [receivableRows],
  );

  const topClientsData = useMemo(
    () =>
      Array.from(
        receivableRows.reduce((map, item) => {
          const key = item.clientId || item.clientLabel;
          const current = map.get(key) || { name: item.clientLabel, value: 0 };
          current.value += item.amountValue;
          map.set(key, current);
          return map;
        }, new Map<string, { name: string; value: number }>()),
      )
        .map(([, value]) => value)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    [receivableRows],
  );

  const upcomingAgenda = useMemo(
    () =>
      [...receivableRows, ...payableRows]
        .filter((item) => !item.paid)
        .filter((item) => {
          const diff = daysUntil(item.due_date);
          return diff != null && diff >= 0 && diff <= 7;
        })
        .sort((a, b) => compareDateAsc(a.due_date, b.due_date))
        .slice(0, 6),
    [receivableRows, payableRows],
  );

  const receivablePageCount = Math.max(1, Math.ceil(filteredReceivables.length / PAGE_SIZE));
  const payablePageCount = Math.max(1, Math.ceil(filteredPayables.length / PAGE_SIZE));
  const paymentPageCount = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));

  const receivablePageRows = filteredReceivables.slice((pageReceivable - 1) * PAGE_SIZE, pageReceivable * PAGE_SIZE);
  const payablePageRows = filteredPayables.slice((pagePayable - 1) * PAGE_SIZE, pagePayable * PAGE_SIZE);
  const paymentPageRows = filteredPayments.slice((pagePayments - 1) * PAGE_SIZE, pagePayments * PAGE_SIZE);

  async function invalidateFinanceQueries() {
    await Promise.all([
      workspaceQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['clients-crm'] }),
      queryClient.invalidateQueries({ queryKey: ['clients-crm-receivables'] }),
      queryClient.invalidateQueries({ queryKey: ['client-detail-financial'] }),
    ]);
  }

  async function handleReceivableSubmit(payload: any, options: { id?: string }) {
    setSubmittingKind('receivable');
    try {
      if (options.id) {
        await api.patch(`/accounts-receivable/${options.id}/`, payload);
        toast.success('Cobrança atualizada.');
      } else {
        await api.post('/accounts-receivable/', payload);
        toast.success('Cobrança criada.');
      }
      await invalidateFinanceQueries();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar a cobrança.');
      throw error;
    } finally {
      setSubmittingKind(null);
    }
  }

  async function handlePayableSubmit(payload: any, options: { id?: string }) {
    setSubmittingKind('payable');
    try {
      if (options.id) {
        await api.patch(`/accounts-payable/${options.id}/`, payload);
        toast.success('Despesa atualizada.');
      } else {
        await api.post('/accounts-payable/', payload);
        toast.success('Despesa criada.');
      }
      await invalidateFinanceQueries();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar a despesa.');
      throw error;
    } finally {
      setSubmittingKind(null);
    }
  }

  async function handlePaymentSubmit(form: PaymentFormState) {
    setSubmittingKind('payment');
    try {
      if (form.mode === 'receivable') {
        const receivable = receivableLookup.get(form.receivable);
        if (!receivable) throw new Error('Selecione uma cobrança válida.');
        const paidAmount = amountValue(form.amount);
        await api.post('/payments/', {
          receivable: receivable.id,
          client: receivable.clientId || undefined,
          process: receivable.processId || undefined,
          amount: paidAmount,
          payment_date: form.paymentDate,
          method: form.method,
          notes: form.notes.trim() || undefined,
        });
        await api.patch(`/accounts-receivable/${receivable.id}/`, {
          status: paidAmount < receivable.amountValue ? 'parcial' : 'paga',
          payment_date: form.paymentDate,
          paid_date: paidAmount >= receivable.amountValue ? form.paymentDate : undefined,
        });
        toast.success(paidAmount < receivable.amountValue ? 'Recebimento parcial registrado.' : 'Recebimento registrado.');
      } else {
        const payable = payableRows.find((item) => item.id === form.payable);
        if (!payable) throw new Error('Selecione uma despesa valida.');
        await api.patch(`/accounts-payable/${payable.id}/`, {
          status: 'paga',
          payment_date: form.paymentDate,
          paid_date: form.paymentDate,
          notes: form.notes.trim()
            ? `${payable.notes ? `${payable.notes}\n\n` : ''}Baixa financeira: ${form.notes.trim()}`
            : payable.notes || undefined,
        });
        toast.success('Pagamento registrado na despesa.');
      }
      await invalidateFinanceQueries();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível registrar o pagamento.');
      throw error;
    } finally {
      setSubmittingKind(null);
    }
  }

  async function handleDeleteReceivable(row: ReceivableRow) {
    if (!window.confirm(`Excluir a cobrança "${row.description || 'sem descrição'}"?`)) return;
    try {
      await api.delete(`/accounts-receivable/${row.id}/`);
      toast.success('Cobrança excluída.');
      await invalidateFinanceQueries();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível excluir a cobrança.');
    }
  }

  async function handleDeletePayable(row: PayableRow) {
    if (!window.confirm(`Excluir a despesa "${row.description || 'sem descrição'}"?`)) return;
    try {
      await api.delete(`/accounts-payable/${row.id}/`);
      toast.success('Despesa excluida.');
      await invalidateFinanceQueries();
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível excluir a despesa.');
    }
  }

  if (workspaceQuery.isLoading) {
    return (
      <div className="page-container space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-[32rem]" />
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="shadow-card">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <div className="page-container animate-fade-in">
        <Card className="shadow-card">
          <CardContent className="p-8">
            <EmptyState
              icon={AlertTriangle}
              title="Não foi possível carregar o financeiro"
              description="Revise a conexão com a API e tente novamente. O módulo depende de cobranças, despesas e pagamentos reais."
              action={{ label: 'Tentar novamente', onClick: () => workspaceQuery.refetch() }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <Card className="border-border/60 shadow-card">
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Financeiro jurídico</Badge>
                <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                  {formatCount(receivableRows.length + payableRows.length)} lançamentos monitorados
                </Badge>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Controle cobranças, despesas, recebimentos e inadimplência com vínculo a clientes e processos do escritório.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 2xl:justify-end">
              <Select value={filters.period} onValueChange={(value) => setFilters((current) => ({ ...current, period: value as PeriodFilter }))}>
                <SelectTrigger className="h-10 w-[170px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => { setEditingReceivable(null); setReceivableDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova cobrança
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setEditingPayable(null); setPayableDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova despesa
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreHorizontal className="mr-2 h-4 w-4" />
                    Mais ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setPaymentDialogOpen(true)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Registrar pagamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadReport(tab)}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </DropdownMenuItem>
                  {hasActiveFilters ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setFilters(DEFAULT_FILTERS)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Limpar filtros
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-12">
            <div className="xl:col-span-4">
              <Label htmlFor="finance-search" className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Busca global</Label>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="finance-search"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  className="h-11 pl-9"
                  placeholder="Buscar por descrição, cliente, processo ou responsável"
                />
              </div>
            </div>

            <div className="xl:col-span-2">
              <FinancialFilterSelect label="Cliente" value={filters.clientId} onChange={(value) => setFilters((current) => ({ ...current, clientId: value }))} options={[{ value: 'all', label: 'Todos os clientes' }, ...clientOptions]} />
            </div>
            <div className="xl:col-span-2">
              <FinancialFilterSelect label="Processo" value={filters.processId} onChange={(value) => setFilters((current) => ({ ...current, processId: value }))} options={[{ value: 'all', label: 'Todos os processos' }, ...processOptions]} />
            </div>
            <div className="xl:col-span-2">
              <FinancialFilterSelect label="Responsável" value={filters.responsibleId} onChange={(value) => setFilters((current) => ({ ...current, responsibleId: value }))} options={[{ value: 'all', label: 'Toda a equipe' }, ...responsibleOptions]} />
            </div>
            <div className="xl:col-span-2">
              <FinancialFilterSelect label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={STATUS_OPTIONS} />
            </div>

            <div className="xl:col-span-3">
              <FinancialFilterSelect label="Categoria" value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} options={categoryOptions} />
            </div>
            <div className="xl:col-span-3">
              <FinancialFilterSelect label="Forma" value={filters.method} onChange={(value) => setFilters((current) => ({ ...current, method: value }))} options={methodOptions} />
            </div>
            <div className="xl:col-span-2">
              <FinancialFilterSelect label="Urgência" value={filters.urgency} onChange={(value) => setFilters((current) => ({ ...current, urgency: value }))} options={URGENCY_OPTIONS} />
            </div>

            {filters.period === 'custom' ? (
              <div className="grid gap-3 md:grid-cols-2 xl:col-span-4">
                <div>
                  <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">De</Label>
                  <Input className="mt-2 h-11" type="date" value={filters.customFrom} onChange={(event) => setFilters((current) => ({ ...current, customFrom: event.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Até</Label>
                  <Input className="mt-2 h-11" type="date" value={filters.customTo} onChange={(event) => setFilters((current) => ({ ...current, customTo: event.target.value }))} />
                </div>
              </div>
            ) : hasActiveFilters ? (
              <div className="flex items-end justify-end xl:col-span-4">
                <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            ) : null}

            {filters.period === 'custom' && hasActiveFilters ? (
              <div className="flex items-end justify-end xl:col-span-12">
                <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total a receber" value={formatCurrency(kpis.totalReceber)} helper="Cobranças abertas no recorte atual." icon={Wallet} tone="sky" comparison={kpis.comparisons.totalReceber} onClick={() => { setTab('receivable'); setFilters((current) => ({ ...current, status: 'pendente', urgency: 'all' })); }} />
        <KpiCard title="Total vencido" value={formatCurrency(kpis.totalVencido)} helper="Cobranças vencidas pressionando o caixa." icon={AlertTriangle} tone="rose" comparison={kpis.comparisons.totalVencido} onClick={() => { setTab('receivable'); setFilters((current) => ({ ...current, urgency: 'overdue' })); }} />
        <KpiCard title="Total a pagar" value={formatCurrency(kpis.totalPagar)} helper="Compromissos ainda não baixados." icon={ReceiptText} tone="amber" comparison={kpis.comparisons.totalPagar} onClick={() => { setTab('payable'); setFilters((current) => ({ ...current, status: 'pendente', urgency: 'all' })); }} />
        <KpiCard title="Recebido no período" value={formatCurrency(kpis.totalRecebido)} helper="Entradas efetivamente registradas." icon={TrendingUp} tone="emerald" comparison={kpis.comparisons.totalRecebido} onClick={() => setTab('payments')} />
        <KpiCard title="Pago no período" value={formatCurrency(kpis.totalPago)} helper="Saídas efetivadas no contas a pagar." icon={TrendingDown} tone="amber" comparison={kpis.comparisons.totalPago} onClick={() => setTab('payments')} />
        <KpiCard title="Inadimplência" value={`${kpis.inadimplencia.toFixed(1)}%`} helper="Peso do vencido sobre o contas a receber." icon={BellRing} tone="rose" comparison={kpis.comparisons.inadimplencia} onClick={() => { setTab('receivable'); setFilters((current) => ({ ...current, urgency: 'overdue' })); }} />
        <KpiCard title="Saldo do período" value={formatCurrency(kpis.saldo)} helper="Entradas menos saídas efetivadas." icon={Landmark} tone={kpis.saldo >= 0 ? 'emerald' : 'rose'} comparison={kpis.comparisons.saldo} onClick={() => setTab('payments')} />
        <KpiCard title="Previsão de recebimento" value={formatCurrency(kpis.previsao)} helper="Janela dos próximos 7 dias." icon={PiggyBank} tone="slate" comparison={kpis.comparisons.previsao} onClick={() => { setTab('receivable'); setFilters((current) => ({ ...current, urgency: 'upcoming' })); }} />
      </div>

      <FinancialChartsSection
        monthlyProjectionData={monthlyProjectionData}
        cashFlowData={cashFlowData}
        receivableStatusData={receivableStatusData}
        topClientsData={topClientsData}
        alerts={alerts}
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Painel operacional</CardTitle>
            <CardDescription>Controle rápido de contas a receber, contas a pagar e pagamentos registrados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="receivable">Receber ({formatCount(filteredReceivables.length)})</TabsTrigger>
                <TabsTrigger value="payable">Pagar ({formatCount(filteredPayables.length)})</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos ({formatCount(filteredPayments.length)})</TabsTrigger>
              </TabsList>

              <TabsContent value="receivable">
                <ReceivablesTable rows={receivablePageRows} totalRows={filteredReceivables.length} page={pageReceivable} totalPages={receivablePageCount} onPageChange={setPageReceivable} onEdit={(row) => { setEditingReceivable(row); setReceivableDialogOpen(true); }} onRegisterPayment={(row) => { setPaymentInitial({ mode: 'receivable', receivable: row.id, amount: row.amountValue, method: 'pix' }); setPaymentDialogOpen(true); }} onDelete={handleDeleteReceivable} onOpenClient={(id) => navigate(`/app/clientes/${id}?tab=financeiro`)} onOpenProcess={(id) => navigate(`/app/processos/${id}`)} />
              </TabsContent>

              <TabsContent value="payable">
                <PayablesTable rows={payablePageRows} totalRows={filteredPayables.length} page={pagePayable} totalPages={payablePageCount} onPageChange={setPagePayable} onEdit={(row) => { setEditingPayable(row); setPayableDialogOpen(true); }} onRegisterPayment={(row) => { setPaymentInitial({ mode: 'payable', payable: row.id, amount: row.amountValue, method: 'transferencia' }); setPaymentDialogOpen(true); }} onDelete={handleDeletePayable} onOpenClient={(id) => navigate(`/app/clientes/${id}?tab=financeiro`)} onOpenProcess={(id) => navigate(`/app/processos/${id}`)} />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentsTable rows={paymentPageRows} totalRows={filteredPayments.length} page={pagePayments} totalPages={paymentPageCount} onPageChange={setPagePayments} onOpenClient={(id) => navigate(`/app/clientes/${id}?tab=financeiro`)} onOpenProcess={(id) => navigate(`/app/processos/${id}`)} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <UpcomingFinanceAgenda items={upcomingAgenda} onOpenClient={(id) => navigate(`/app/clientes/${id}?tab=financeiro`)} onOpenProcess={(id) => navigate(`/app/processos/${id}`)} />
      </div>

      <ReceivableDialog open={receivableDialogOpen} onOpenChange={setReceivableDialogOpen} clients={clientOptions} processes={processOptions} initialData={editingReceivable} isSaving={submittingKind === 'receivable'} onSubmit={async (payload) => { await handleReceivableSubmit(payload, { id: editingReceivable?.id }); if (!editingReceivable?.id) setEditingReceivable(null); }} />
      <PayableDialog open={payableDialogOpen} onOpenChange={setPayableDialogOpen} processes={processOptions} initialData={editingPayable} isSaving={submittingKind === 'payable'} onSubmit={async (payload) => { await handlePayableSubmit(payload, { id: editingPayable?.id }); if (!editingPayable?.id) setEditingPayable(null); }} />
      <PaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} receivables={receivableRows.filter((item) => !item.paid)} payables={payableRows.filter((item) => !item.paid)} initialData={paymentInitial} isSaving={submittingKind === 'payment'} onSubmit={handlePaymentSubmit} />
    </div>
  );
}

function FinancialFilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionItem[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={`${label}-${item.value}`} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FinancePagination({
  page,
  totalPages,
  totalRows,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalRows: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (!totalRows) return null;
  return (
    <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        {formatCount(totalRows)} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}

function FinancialChartsSection({
  monthlyProjectionData,
  cashFlowData,
  receivableStatusData,
  topClientsData,
  alerts,
}: {
  monthlyProjectionData: Array<{ key: string; label: string; receber: number; pagar: number }>;
  cashFlowData: Array<{ key: string; label: string; recebido: number; pago: number }>;
  receivableStatusData: Array<{ name: string; value: number }>;
  topClientsData: Array<{ name: string; value: number }>;
  alerts: AlertItem[];
}) {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Recebimentos e despesas por mês</CardTitle>
            <CardDescription>Volume previsto nos últimos seis meses para contas a receber e contas a pagar.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProjectionData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${(Number(value) / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="receber" fill="#2563eb" radius={[8, 8, 0, 0]} name="A receber" />
                <Bar dataKey="pagar" fill="#f59e0b" radius={[8, 8, 0, 0]} name="A pagar" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Alertas financeiros</CardTitle>
            <CardDescription>Prioridades operacionais que exigem resposta rápida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length ? alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={alert.onClick}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5',
                  alert.tone === 'danger' && 'border-rose-200 bg-rose-50/60',
                  alert.tone === 'warning' && 'border-amber-200 bg-amber-50/60',
                  alert.tone === 'info' && 'border-sky-200 bg-sky-50/60',
                  alert.tone === 'success' && 'border-emerald-200 bg-emerald-50/60',
                )}
              >
                <p className="font-medium">{alert.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-primary">{alert.actionLabel}</p>
              </button>
            )) : (
              <EmptyState icon={CheckCircle2} title="Sem alertas críticos" description="O recorte atual não traz vencimentos ou inadimplência relevante." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Fluxo de caixa simplificado</CardTitle>
            <CardDescription>Entradas e saídas efetivadas nos últimos seis meses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${(Number(value) / 1000).toFixed(0)}k`} />
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="recebido" stroke="#10b981" strokeWidth={3} dot={false} name="Recebido" />
                <Line type="monotone" dataKey="pago" stroke="#f97316" strokeWidth={3} dot={false} name="Pago" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Distribuição do contas a receber</CardTitle>
            <CardDescription>Status financeiro das cobranças monitoradas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={receivableStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={3}>
                    {receivableStatusData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {receivableStatusData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle>Top clientes por faturamento</CardTitle>
            <CardDescription>Clientes que concentram maior volume de cobrança.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {topClientsData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsData} layout="vertical" margin={{ left: 20, right: 12 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#0f766e" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Wallet} title="Sem faturamento vinculado" description="Assim que as cobranças forem registradas, o ranking de clientes aparece aqui." />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function UpcomingFinanceAgenda({
  items,
  onOpenClient,
  onOpenProcess,
}: {
  items: Array<ReceivableRow | PayableRow>;
  onOpenClient: (id: string) => void;
  onOpenProcess: (id: string) => void;
}) {
  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <CardTitle>Agenda financeira da semana</CardTitle>
        <CardDescription>Compromissos mais próximos para organização do caixa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={`${item.id}-${item.due_date}`} className="rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Badge className={cn('border', 'billingMethod' in item ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                  {'billingMethod' in item ? 'Recebimento previsto' : 'Pagamento previsto'}
                </Badge>
                <p className="font-medium">{item.description || 'Lancamento financeiro'}</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {'clientId' in item && item.clientId ? (
                    <button type="button" className="text-left hover:underline" onClick={() => onOpenClient(item.clientId)}>{item.clientLabel}</button>
                  ) : <p>{'clientLabel' in item ? item.clientLabel : 'Sem cliente'}</p>}
                  {item.processId ? (
                    <button type="button" className="text-left hover:underline" onClick={() => onOpenProcess(item.processId)}>{item.processLabel}</button>
                  ) : <p>{item.processLabel}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(item.amountValue)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item.due_date)}</p>
              </div>
            </div>
          </div>
        )) : (
          <EmptyState icon={CalendarClock} title="Semana sem compromissos próximos" description="Não há vencimentos ou previsões nos próximos 7 dias com os filtros atuais." />
        )}
      </CardContent>
    </Card>
  );
}

function ReceivablesTable({
  rows,
  totalRows,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onRegisterPayment,
  onDelete,
  onOpenClient,
  onOpenProcess,
}: {
  rows: ReceivableRow[];
  totalRows: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (row: ReceivableRow) => void;
  onRegisterPayment: (row: ReceivableRow) => void;
  onDelete: (row: ReceivableRow) => void;
  onOpenClient: (id: string) => void;
  onOpenProcess: (id: string) => void;
}) {
  if (!totalRows) {
    return <EmptyState icon={Wallet} title="Nenhuma cobrança encontrada" description="Cadastre uma nova cobrança para começar a controlar recebimentos e inadimplência." />;
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border">
        <Table className="min-w-[1180px]">
          <TableHeader>
            <TableRow>
              <TableHead>Cobrança</TableHead>
              <TableHead>Cliente / processo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={cn(row.overdue && 'bg-rose-50/50', !row.overdue && row.dueSoon && 'bg-amber-50/30')}>
                <TableCell><div className="space-y-1"><p className="font-medium">{row.description || 'Cobrança sem descrição'}</p><p className="text-sm text-muted-foreground">{labelFromOptions(RECEIVABLE_CATEGORY_OPTIONS, row.category, 'Outros')}</p></div></TableCell>
                <TableCell><div className="space-y-1 text-sm">{row.clientId ? <button type="button" className="text-left text-primary hover:underline" onClick={() => onOpenClient(row.clientId)}>{row.clientLabel}</button> : <p>{row.clientLabel}</p>}{row.processId ? <button type="button" className="text-left text-muted-foreground hover:underline" onClick={() => onOpenProcess(row.processId)}>{row.processLabel}</button> : <p className="text-muted-foreground">{row.processLabel}</p>}</div></TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amountValue)}</TableCell>
                <TableCell><div className="space-y-1 text-sm"><p>{formatDate(row.due_date)}</p>{row.overdue ? <Badge className="border-rose-200 bg-rose-50 text-rose-700">Vencida</Badge> : null}{row.dueToday ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Vence hoje</Badge> : null}{row.dueSoon && !row.dueToday ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Próxima</Badge> : null}</div></TableCell>
                <TableCell>{row.recurrence === 'parcelada' ? 'Parcelada' : 'Única'}</TableCell>
                <TableCell>{row.responsibleLabel}</TableCell>
                <TableCell><Badge className={cn('border', statusBadgeClass(row.paid ? 'paga' : row.overdue ? 'vencida' : row.status || 'aberta'))}>{row.paid ? 'Recebido' : row.overdue ? 'Vencido' : statusLabel(row.status, 'receivable')}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" aria-label="Abrir menu de ações" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(row)}>Editar cobrança</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRegisterPayment(row)}>Marcar como recebida</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyChargeMessage(row, 'generate')}>Gerar boleto / link</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyChargeMessage(row, 'resend')}>Reenviar cobrança</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => onDelete(row)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <FinancePagination page={page} totalPages={totalPages} totalRows={totalRows} label="cobranças" onPageChange={onPageChange} />
    </div>
  );
}

function PayablesTable({
  rows,
  totalRows,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onRegisterPayment,
  onDelete,
  onOpenClient,
  onOpenProcess,
}: {
  rows: PayableRow[];
  totalRows: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (row: PayableRow) => void;
  onRegisterPayment: (row: PayableRow) => void;
  onDelete: (row: PayableRow) => void;
  onOpenClient: (id: string) => void;
  onOpenProcess: (id: string) => void;
}) {
  if (!totalRows) {
    return <EmptyState icon={ReceiptText} title="Nenhuma despesa encontrada" description="Cadastre despesas operacionais, custas e fornecedores para acompanhar o contas a pagar." />;
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border">
        <Table className="min-w-[1120px]">
          <TableHeader>
            <TableRow>
              <TableHead>Despesa</TableHead>
              <TableHead>Fornecedor / processo</TableHead>
              <TableHead>Cliente relacionado</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={cn(row.overdue && 'bg-rose-50/50', !row.overdue && row.dueSoon && 'bg-amber-50/30')}>
                <TableCell><div className="space-y-1"><p className="font-medium">{row.description || 'Despesa sem descrição'}</p><p className="text-sm text-muted-foreground">{row.categoryLabel}</p></div></TableCell>
                <TableCell><div className="space-y-1 text-sm"><p className="font-medium">{row.supplier || 'Sem fornecedor'}</p>{row.processId ? <button type="button" className="text-left text-muted-foreground hover:underline" onClick={() => onOpenProcess(row.processId)}>{row.processLabel}</button> : <p className="text-muted-foreground">{row.processLabel}</p>}</div></TableCell>
                <TableCell>{row.clientId ? <button type="button" className="text-left text-primary hover:underline" onClick={() => onOpenClient(row.clientId)}>{row.clientLabel}</button> : <span className="text-muted-foreground">Sem cliente</span>}</TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amountValue)}</TableCell>
                <TableCell><div className="space-y-1 text-sm"><p>{formatDate(row.due_date)}</p>{row.overdue ? <Badge className="border-rose-200 bg-rose-50 text-rose-700">Vencida</Badge> : null}{row.dueToday ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Vence hoje</Badge> : null}{row.dueSoon && !row.dueToday ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">Próxima</Badge> : null}</div></TableCell>
                <TableCell>{row.responsibleLabel}</TableCell>
                <TableCell><Badge className={cn('border', statusBadgeClass(row.resolvedStatus))}>{row.statusText}</Badge></TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" aria-label="Abrir menu de ações" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(row)}>Editar despesa</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRegisterPayment(row)}>Marcar como paga</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => onDelete(row)}>Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <FinancePagination page={page} totalPages={totalPages} totalRows={totalRows} label="despesas" onPageChange={onPageChange} />
    </div>
  );
}

function PaymentsTable({
  rows,
  totalRows,
  page,
  totalPages,
  onPageChange,
  onOpenClient,
  onOpenProcess,
}: {
  rows: PaymentHistoryRow[];
  totalRows: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenClient: (id: string) => void;
  onOpenProcess: (id: string) => void;
}) {
  if (!totalRows) {
    return <EmptyState icon={CreditCard} title="Nenhum pagamento encontrado" description="Registre recebimentos ou baixas para montar o histórico financeiro do escritório." />;
  }
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border">
        <Table className="min-w-[1080px]">
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Cliente / processo</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDateTime(row.paymentDate)}</TableCell>
                <TableCell><Badge className={cn('border', row.kind === 'recebimento' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>{row.kind === 'recebimento' ? 'Recebimento' : 'Pagamento'}</Badge></TableCell>
                <TableCell><div className="space-y-1"><p className="font-medium">{row.title}</p><p className="text-sm text-muted-foreground">{row.reference}</p></div></TableCell>
                <TableCell><div className="space-y-1 text-sm">{row.clientId ? <button type="button" className="text-left text-primary hover:underline" onClick={() => onOpenClient(row.clientId)}>{row.clientLabel}</button> : <p>{row.clientLabel}</p>}{row.processId ? <button type="button" className="text-left text-muted-foreground hover:underline" onClick={() => onOpenProcess(row.processId)}>{row.processLabel}</button> : <p className="text-muted-foreground">{row.processLabel}</p>}</div></TableCell>
                <TableCell>{labelFromOptions(PAYMENT_METHOD_OPTIONS, row.method, row.method === 'baixa_manual' ? 'Baixa manual' : row.method)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(row.amountValue)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.notes || 'Sem observações'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <FinancePagination page={page} totalPages={totalPages} totalRows={totalRows} label="movimentos" onPageChange={onPageChange} />
    </div>
  );
}

function ReceivableDialog({
  open,
  onOpenChange,
  clients,
  processes,
  initialData,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: OptionItem[];
  processes: OptionItem[];
  initialData?: ReceivableDialogInitial | null;
  isSaving: boolean;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState<ReceivableFormState>(() => defaultReceivableForm(initialData));

  useEffect(() => {
    if (open) setForm(defaultReceivableForm(initialData));
  }, [open, initialData]);

  async function submit(mode: 'close' | 'continue') {
    if (!form.description.trim() || !form.amount || !form.dueDate) {
      toast.error('Preencha descrição, valor e vencimento.');
      return;
    }

    try {
      await onSubmit({
        description: form.description.trim(),
        client: form.client || undefined,
        process: form.process || undefined,
        amount: Number(form.amount),
        due_date: form.dueDate,
        category: form.category,
        status: form.status,
        installments_count: Math.max(1, Number(form.installmentsCount || 1)),
        installment_interval_days: Math.max(1, Number(form.installmentIntervalDays || 30)),
        notes: form.notes.trim() || undefined,
      });

      if (mode === 'continue' && !initialData?.id) {
        setForm(defaultReceivableForm(null));
      } else {
        onOpenChange(false);
      }
    } catch {
      // handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Editar cobrança' : 'Nova cobrança'}</DialogTitle>
          <DialogDescription>Registre honorários, mensalidades, acordos e outras receitas com vínculo ao cliente e ao processo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Honorários iniciais, mensalidade, acordo..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Select value={optionValue(form.client)} onValueChange={(value) => setForm((current) => ({ ...current, client: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {clients.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Processo vinculado</Label>
                <Select value={optionValue(form.process)} onValueChange={(value) => setForm((current) => ({ ...current, process: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue placeholder="Sem processo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem processo</SelectItem>
                    {processes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Pendente</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="paga">Recebida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECEIVABLE_CATEGORY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Parcelas</Label>
                <Input type="number" min="1" value={form.installmentsCount} onChange={(event) => setForm((current) => ({ ...current, installmentsCount: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Intervalo entre parcelas (dias)</Label>
              <Input type="number" min="1" value={form.installmentIntervalDays} onChange={(event) => setForm((current) => ({ ...current, installmentIntervalDays: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea rows={8} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Observações comerciais, combinados, texto para o financeiro..." />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex flex-wrap gap-2">
            {!initialData?.id ? <Button variant="outline" onClick={() => submit('continue')} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar e criar outra'}</Button> : null}
            <Button onClick={() => submit('close')} disabled={isSaving}>{isSaving ? 'Salvando...' : initialData?.id ? 'Salvar alterações' : 'Salvar cobrança'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayableDialog({
  open,
  onOpenChange,
  processes,
  initialData,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processes: OptionItem[];
  initialData?: PayableDialogInitial | null;
  isSaving: boolean;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState<PayableFormState>(() => defaultPayableForm(initialData));

  useEffect(() => {
    if (open) setForm(defaultPayableForm(initialData));
  }, [open, initialData]);

  async function submit(mode: 'close' | 'continue') {
    if (!form.description.trim() || !form.amount || !form.dueDate) {
      toast.error('Preencha descrição, valor e vencimento.');
      return;
    }
    try {
      await onSubmit({
        description: form.description.trim(),
        supplier: form.supplier.trim() || undefined,
        process: form.process || undefined,
        amount: Number(form.amount),
        due_date: form.dueDate,
        category: form.category,
        status: form.status,
        notes: form.notes.trim() || undefined,
      });
      if (mode === 'continue' && !initialData?.id) {
        setForm(defaultPayableForm(null));
      } else {
        onOpenChange(false);
      }
    } catch {
      // handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Editar despesa' : 'Nova despesa'}</DialogTitle>
          <DialogDescription>Registre custas, fornecedores, tributos e demais compromissos financeiros do escritório.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Custas, folha, fornecedor, serviço..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Fornecedor / destino</Label>
                <Input value={form.supplier} onChange={(event) => setForm((current) => ({ ...current, supplier: event.target.value }))} placeholder="Nome do fornecedor" />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYABLE_CATEGORY_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberta">Pendente</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Processo vinculado</Label>
              <Select value={optionValue(form.process)} onValueChange={(value) => setForm((current) => ({ ...current, process: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder="Sem processo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem processo</SelectItem>
                  {processes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea rows={8} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Centro de custo, observações operacionais, comprovantes..." />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex flex-wrap gap-2">
            {!initialData?.id ? <Button variant="outline" onClick={() => submit('continue')} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar e criar outra'}</Button> : null}
            <Button onClick={() => submit('close')} disabled={isSaving}>{isSaving ? 'Salvando...' : initialData?.id ? 'Salvar alterações' : 'Salvar despesa'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  receivables,
  payables,
  initialData,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivables: ReceivableRow[];
  payables: PayableRow[];
  initialData?: PaymentDialogInitial | null;
  isSaving: boolean;
  onSubmit: (payload: PaymentFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<PaymentFormState>(() => defaultPaymentForm(initialData));

  useEffect(() => {
    if (open) setForm(defaultPaymentForm(initialData));
  }, [open, initialData]);

  const selectedReceivable = useMemo(() => receivables.find((item) => item.id === form.receivable) || null, [receivables, form.receivable]);
  const selectedPayable = useMemo(() => payables.find((item) => item.id === form.payable) || null, [payables, form.payable]);

  useEffect(() => {
    if (form.mode === 'payable' && selectedPayable) {
      setForm((current) => ({ ...current, amount: String(selectedPayable.amountValue) }));
    }
  }, [form.mode, selectedPayable]);

  async function submit() {
    if (form.mode === 'receivable' && (!form.receivable || !form.amount || !form.paymentDate)) {
      toast.error('Selecione a cobrança, informe valor e data.');
      return;
    }
    if (form.mode === 'payable' && (!form.payable || !form.paymentDate)) {
      toast.error('Selecione a despesa e informe a data.');
      return;
    }
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch {
      // handled by parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>Lance um recebimento de cobrança ou faça a baixa de uma despesa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Tipo do movimento</Label>
              <Select value={form.mode} onValueChange={(value) => setForm((current) => ({ ...current, mode: value as 'receivable' | 'payable' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receivable">Recebimento</SelectItem>
                  <SelectItem value="payable">Pagamento de despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={form.paymentDate} onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))} />
            </div>
          </div>

          {form.mode === 'receivable' ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Cobrança</Label>
                <Select value={optionValue(form.receivable)} onValueChange={(value) => setForm((current) => ({ ...current, receivable: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a cobrança" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {receivables.map((item) => <SelectItem key={item.id} value={item.id}>{item.description || 'Cobrança'} - {item.clientLabel} - {formatCurrency(item.amountValue)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
                <div>Cliente: {selectedReceivable?.clientLabel || 'Sem cliente'}</div>
                <div>Processo: {selectedReceivable?.processLabel || 'Sem processo'}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Valor recebido</Label>
                  <Input type="number" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={form.method} onValueChange={(value) => setForm((current) => ({ ...current, method: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Despesa</Label>
                <Select value={optionValue(form.payable)} onValueChange={(value) => setForm((current) => ({ ...current, payable: value === 'none' ? '' : value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione a despesa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {payables.map((item) => <SelectItem key={item.id} value={item.id}>{item.description || 'Despesa'} - {item.categoryLabel} - {formatCurrency(item.amountValue)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
                <div>Fornecedor: {selectedPayable?.supplier || 'Não informado'}</div>
                <div>Valor da baixa: {formatCurrency(selectedPayable?.amountValue || 0)}</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Valor</Label>
                  <Input value={form.amount} disabled />
                </div>
                <div className="grid gap-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={form.method} onValueChange={(value) => setForm((current) => ({ ...current, method: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Comprovante, referência bancária, observações da baixa..." />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
