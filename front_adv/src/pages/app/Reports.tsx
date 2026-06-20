import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  Gavel,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGetAllPages } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

type PeriodOption = '30d' | '90d' | '6m' | '12m';

function formatCurrency(value?: number | string | null) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(n) ? n : 0,
  );
}

function formatCompact(value?: number | string | null) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 'R$ 0';
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}k`;
  return formatCurrency(n);
}

function toDate(v?: string | null) {
  if (!v) return null;
  const d = new Date(v.includes('T') ? v : `${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKey(v?: string | null) {
  const d = toDate(v);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'short',
    year: '2-digit',
  });
}

function periodToDays(p: PeriodOption) {
  return { '30d': 30, '90d': 90, '6m': 180, '12m': 365 }[p];
}

const PERIOD_LABELS: Record<PeriodOption, string> = {
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '6m': 'Últimos 6 meses',
  '12m': 'Últimos 12 meses',
};

const CHART_COLORS = {
  primary: 'hsl(var(--foreground))',
  gold: 'hsl(var(--gold))',
  success: 'hsl(var(--success))',
  destructive: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
  muted: 'hsl(var(--muted-foreground))',
};

const PIE_PALETTE = [
  '#111827',
  '#374151',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#d1d5db',
];

function HearingRate({ hearings }: { hearings: any[] }) {
  const total = hearings.length || 1;
  const done = hearings.filter((h) => h.status === 'realizada' || h.status === 'completed').length;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <span className="font-display text-5xl font-semibold text-foreground">{pct}%</span>
        <span className="mb-1 text-sm text-muted-foreground">de realização</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {done} de {hearings.length} audiências realizadas
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  loading,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ElementType;
  loading?: boolean;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneColor = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  }[tone];

  return (
    <div className="kpi">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="kpi-label">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-28" />
          ) : (
            <p className={cn('kpi-value mt-2', toneColor)}>{value}</p>
          )}
          {delta && !loading && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              {delta.startsWith('+') ? (
                <TrendingUp className="h-3 w-3 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive" />
              )}
              {delta} vs. período anterior
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState<PeriodOption>('30d');
  const days = periodToDays(period);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }, [days]);

  const { data: processesRaw, isLoading: loadingProcesses } = useQuery({
    queryKey: ['reports-processes'],
    queryFn: () => apiGetAllPages<any>('/processes/'),
    staleTime: 60_000,
  });

  const { data: receivablesRaw, isLoading: loadingReceivables } = useQuery({
    queryKey: ['reports-receivables'],
    queryFn: () => apiGetAllPages<any>('/accounts-receivable/'),
    staleTime: 60_000,
  });

  const { data: payablesRaw, isLoading: loadingPayables } = useQuery({
    queryKey: ['reports-payables'],
    queryFn: () => apiGetAllPages<any>('/accounts-payable/'),
    staleTime: 60_000,
  });

  const { data: clientsRaw, isLoading: loadingClients } = useQuery({
    queryKey: ['reports-clients'],
    queryFn: () => apiGetAllPages<any>('/clients/'),
    staleTime: 60_000,
  });

  const { data: hearingsRaw, isLoading: loadingHearings } = useQuery({
    queryKey: ['reports-hearings'],
    queryFn: () => apiGetAllPages<any>('/hearings/'),
    staleTime: 60_000,
  });

  const isLoading = loadingProcesses || loadingReceivables || loadingPayables || loadingClients;

  const processes = useMemo(() => (Array.isArray(processesRaw) ? processesRaw : []), [processesRaw]);
  const receivables = useMemo(() => (Array.isArray(receivablesRaw) ? receivablesRaw : []), [receivablesRaw]);
  const payables = useMemo(() => (Array.isArray(payablesRaw) ? payablesRaw : []), [payablesRaw]);
  const clients = useMemo(() => (Array.isArray(clientsRaw) ? clientsRaw : []), [clientsRaw]);
  const hearings = useMemo(() => (Array.isArray(hearingsRaw) ? hearingsRaw : []), [hearingsRaw]);

  const filteredReceivables = useMemo(
    () => receivables.filter((r) => toDate(r.created_at) && toDate(r.created_at)! >= cutoffDate),
    [receivables, cutoffDate],
  );

  const filteredPayables = useMemo(
    () => payables.filter((p) => toDate(p.created_at) && toDate(p.created_at)! >= cutoffDate),
    [payables, cutoffDate],
  );

  const totalReceivable = useMemo(
    () => filteredReceivables.reduce((acc, r) => acc + Number(r.amount || 0), 0),
    [filteredReceivables],
  );

  const totalPaid = useMemo(
    () =>
      filteredReceivables
        .filter((r) => r.status === 'pago' || r.status === 'paid')
        .reduce((acc, r) => acc + Number(r.amount || 0), 0),
    [filteredReceivables],
  );

  const totalPayable = useMemo(
    () => filteredPayables.reduce((acc, p) => acc + Number(p.amount || 0), 0),
    [filteredPayables],
  );

  const netResult = totalPaid - totalPayable;

  const activeProcesses = useMemo(
    () => processes.filter((p) => p.status === 'em_andamento' || p.status === 'ativo'),
    [processes],
  );

  const activeClients = useMemo(
    () => clients.filter((c) => c.status === 'ATIVO' || c.status === 'ativo'),
    [clients],
  );

  const processesByArea = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of processes) {
      const area = p.area || p.practice_area || 'Não informada';
      map[area] = (map[area] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [processes]);

  const processesByStatus = useMemo(() => {
    const statusLabels: Record<string, string> = {
      em_andamento: 'Em andamento',
      ativo: 'Ativo',
      suspenso: 'Suspenso',
      finalizado: 'Finalizado',
      arquivado: 'Arquivado',
      pre_processual: 'Pré-processual',
    };
    const map: Record<string, number> = {};
    for (const p of processes) {
      const s = statusLabels[p.status] || p.status || 'Não informado';
      map[s] = (map[s] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [processes]);

  const revenueByMonth = useMemo(() => {
    const map: Record<string, { received: number; expense: number }> = {};
    for (const r of receivables) {
      const k = monthKey(r.due_date || r.created_at);
      if (!k) continue;
      if (!map[k]) map[k] = { received: 0, expense: 0 };
      if (r.status === 'pago' || r.status === 'paid') map[k].received += Number(r.amount || 0);
    }
    for (const p of payables) {
      const k = monthKey(p.due_date || p.created_at);
      if (!k) continue;
      if (!map[k]) map[k] = { received: 0, expense: 0 };
      map[k].expense += Number(p.amount || 0);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => ({ month: monthLabel(key), ...val, result: val.received - val.expense }));
  }, [receivables, payables]);

  const receivableByStatus = useMemo(() => {
    const labels: Record<string, string> = {
      pago: 'Pago',
      paid: 'Pago',
      aberto: 'Em aberto',
      open: 'Em aberto',
      vencido: 'Vencido',
      overdue: 'Vencido',
      cancelado: 'Cancelado',
    };
    const map: Record<string, number> = {};
    for (const r of receivables) {
      const s = labels[r.status] || r.status || 'Outro';
      map[s] = (map[s] || 0) + Number(r.amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [receivables]);

  const hearingsByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of hearings) {
      const k = monthKey(h.hearing_date);
      if (!k) continue;
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, count]) => ({ month: monthLabel(key), count }));
  }, [hearings]);

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow mb-2">Análise gerencial</p>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle mt-1">
            Visão consolidada do desempenho financeiro, jurídico e operacional do escritório.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
            <SelectTrigger className="h-9 w-48 border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {PERIOD_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita no período"
          value={isLoading ? '—' : formatCompact(totalReceivable)}
          icon={Wallet}
          loading={isLoading}
          tone="default"
        />
        <KpiCard
          label="Recebido no período"
          value={isLoading ? '—' : formatCompact(totalPaid)}
          icon={TrendingUp}
          loading={isLoading}
          tone="success"
        />
        <KpiCard
          label="Despesas no período"
          value={isLoading ? '—' : formatCompact(totalPayable)}
          icon={TrendingDown}
          loading={isLoading}
          tone="danger"
        />
        <KpiCard
          label="Resultado líquido"
          value={isLoading ? '—' : formatCompact(netResult)}
          icon={BarChart3}
          loading={isLoading}
          tone={netResult >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Processos ativos"
          value={activeProcesses.length}
          icon={Gavel}
          loading={loadingProcesses}
        />
        <KpiCard
          label="Total de processos"
          value={processes.length}
          icon={Scale}
          loading={loadingProcesses}
        />
        <KpiCard
          label="Clientes ativos"
          value={activeClients.length}
          icon={Users}
          loading={loadingClients}
        />
        <KpiCard
          label="Audiências realizadas"
          value={hearings.length}
          icon={Calendar}
          loading={loadingHearings}
        />
      </div>

      {/* Tabs de relatórios */}
      <Tabs defaultValue="financeiro" className="space-y-5">
        <TabsList className="border-b-0 bg-muted/40">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="juridico">Jurídico</TabsTrigger>
          <TabsTrigger value="audiencias">Audiências</TabsTrigger>
        </TabsList>

        {/* FINANCEIRO */}
        <TabsContent value="financeiro" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Receita x Despesa por mês */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Receita x Despesa mensal</CardTitle>
                <CardDescription className="text-xs">Comparativo dos últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReceivables || loadingPayables ? (
                  <Skeleton className="h-56 w-full" />
                ) : revenueByMonth.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Sem dados no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--card))' }}
                        formatter={(v: number, name: string) => [formatCurrency(v), name === 'received' ? 'Recebido' : 'Despesa']}
                      />
                      <Legend formatter={(v) => (v === 'received' ? 'Recebido' : 'Despesa')} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="received" name="received" fill={CHART_COLORS.success} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expense" name="expense" fill={CHART_COLORS.destructive} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Contas a receber por status */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Contas a receber por status</CardTitle>
                <CardDescription className="text-xs">Distribuição financeira dos recebíveis</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReceivables ? (
                  <Skeleton className="h-56 w-full" />
                ) : receivableByStatus.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={receivableByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={88}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {receivableByStatus.map((_, i) => (
                            <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--card))' }}
                          formatter={(v: number) => formatCurrency(v)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {receivableByStatus.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                            <span className="text-xs text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="text-xs font-medium text-foreground">{formatCompact(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resultado líquido mensal */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Resultado líquido mensal</CardTitle>
                <CardDescription className="text-xs">Evolução do lucro operacional mês a mês</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReceivables || loadingPayables ? (
                  <Skeleton className="h-48 w-full" />
                ) : revenueByMonth.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Sem dados no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="resultGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.gold} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.gold} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--card))' }}
                        formatter={(v: number) => [formatCurrency(v), 'Resultado']}
                      />
                      <Area dataKey="result" stroke={CHART_COLORS.gold} strokeWidth={2} fill="url(#resultGradient)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* JURÍDICO */}
        <TabsContent value="juridico" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Processos por área */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Processos por área</CardTitle>
                <CardDescription className="text-xs">Distribuição por área de atuação</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProcesses ? (
                  <Skeleton className="h-56 w-full" />
                ) : processesByArea.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={processesByArea} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                      <RechartsTooltip
                        contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--card))' }}
                      />
                      <Bar dataKey="value" name="Processos" radius={[0, 4, 4, 0]} fill={CHART_COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Processos por status */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Processos por status</CardTitle>
                <CardDescription className="text-xs">Situação atual dos processos</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProcesses ? (
                  <Skeleton className="h-56 w-full" />
                ) : processesByStatus.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Sem dados
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie
                          data={processesByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={88}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {processesByStatus.map((_, i) => (
                            <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--card))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {processesByStatus.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                            <span className="text-xs text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="text-xs font-medium tabular-nums text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de processos */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Resumo por área de atuação</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProcesses ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="table-container overflow-auto">
                    <table className="table-editorial w-full">
                      <thead>
                        <tr>
                          <th>Área</th>
                          <th>Total</th>
                          <th>Ativos</th>
                          <th>Finalizados</th>
                          <th>% do total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processesByArea.map((area) => {
                          const total = processes.length || 1;
                          const areaProcesses = processes.filter((p) => (p.area || p.practice_area || 'Não informada') === area.name);
                          const active = areaProcesses.filter((p) => p.status === 'em_andamento' || p.status === 'ativo').length;
                          const finished = areaProcesses.filter((p) => p.status === 'finalizado').length;
                          return (
                            <tr key={area.name}>
                              <td className="font-medium text-foreground">{area.name}</td>
                              <td>{area.value}</td>
                              <td>
                                <Badge variant="outline" className="text-xs">{active}</Badge>
                              </td>
                              <td>{finished}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-foreground"
                                      style={{ width: `${Math.round((area.value / total) * 100)}%` }}
                                    />
                                  </div>
                                  <span className="tabular-nums text-muted-foreground">
                                    {Math.round((area.value / total) * 100)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AUDIÊNCIAS */}
        <TabsContent value="audiencias" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="shadow-card lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Audiências por mês</CardTitle>
                <CardDescription className="text-xs">Quantidade de audiências realizadas mensalmente</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHearings ? (
                  <Skeleton className="h-56 w-full" />
                ) : hearingsByMonth.length === 0 ? (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Sem dados de audiências
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={hearingsByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{ fontSize: 12, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--card))' }}
                        formatter={(v: number) => [v, 'Audiências']}
                      />
                      <Bar dataKey="count" name="Audiências" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Resumo de audiências</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingHearings ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <>
                    {[
                      { label: 'Total de audiências', value: hearings.length },
                      { label: 'Realizadas', value: hearings.filter((h: any) => h.status === 'realizada' || h.status === 'completed').length },
                      { label: 'Agendadas', value: hearings.filter((h: any) => h.status === 'agendada' || h.status === 'scheduled').length },
                      { label: 'Canceladas', value: hearings.filter((h: any) => h.status === 'cancelada' || h.status === 'canceled').length },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Taxa de realização</CardTitle>
                <CardDescription className="text-xs">Audiências realizadas sobre o total</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHearings ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <HearingRate hearings={hearings} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
