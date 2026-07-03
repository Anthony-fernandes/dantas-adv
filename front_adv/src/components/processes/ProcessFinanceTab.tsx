import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CircleDollarSign, Receipt, TrendingDown, TrendingUp } from 'lucide-react';

import { apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';

type FinanceRecord = {
  id: string;
  description?: string | null;
  category?: string | null;
  amount?: string | number | null;
  due_date?: string | null;
  paid_date?: string | null;
  status?: string | null;
  supplier?: string | null;
};

const OPEN_STATUSES = ['aberta', 'aberto', 'pendente', 'vencida', 'vencido', 'emitida'];

function toAmount(value?: string | number | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(record: FinanceRecord) {
  if (!record.due_date || record.paid_date) return false;
  const status = String(record.status || '').toLowerCase();
  if (!OPEN_STATUSES.includes(status)) return false;
  return new Date(`${record.due_date}T23:59:59`) < new Date();
}

function statusBadge(record: FinanceRecord) {
  const status = String(record.status || '').toLowerCase();
  if (record.paid_date || status === 'paga' || status === 'pago' || status === 'recebida' || status === 'recebido') {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Quitada</Badge>;
  }
  if (isOverdue(record)) {
    return <Badge className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50">Vencida</Badge>;
  }
  return <Badge className="border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50">Em aberto</Badge>;
}

function FinanceSummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: 'emerald' | 'sky' | 'amber' | 'rose' }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-600 shadow-emerald-100 ring-emerald-100',
    sky: 'bg-sky-500 shadow-sky-100 ring-sky-100',
    amber: 'bg-amber-500 shadow-amber-100 ring-amber-100',
    rose: 'bg-rose-600 shadow-rose-100 ring-rose-100',
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 dark:bg-card dark:ring-border">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-4', tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-none tracking-tight text-slate-800 dark:text-foreground">{value}</p>
      </div>
    </div>
  );
}

function FinanceTable({ title, records, emptyLabel }: { title: string; records: FinanceRecord[]; emptyLabel: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[120px]">Categoria</TableHead>
                  <TableHead className="w-[120px]">Vencimento</TableHead>
                  <TableHead className="w-[130px] text-right">Valor</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate text-sm font-medium">{record.description || record.supplier || '—'}</p>
                    </TableCell>
                    <TableCell className="text-xs capitalize text-muted-foreground">{record.category || 'geral'}</TableCell>
                    <TableCell className={cn('text-sm', isOverdue(record) && 'font-semibold text-rose-600')}>{formatDate(record.due_date)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(toAmount(record.amount))}</TableCell>
                    <TableCell>{statusBadge(record)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProcessFinanceTab({ processId }: { processId: string }) {
  const { activeTenantId } = useTenant();
  const navigate = useNavigate();

  const receivablesQuery = useQuery({
    queryKey: ['process-finance-receivables', activeTenantId, processId],
    queryFn: () => apiGetAllPages<FinanceRecord>(`/accounts-receivable/?process=${processId}`),
    enabled: !!activeTenantId && !!processId,
  });

  const payablesQuery = useQuery({
    queryKey: ['process-finance-payables', activeTenantId, processId],
    queryFn: () => apiGetAllPages<FinanceRecord>(`/accounts-payable/?process=${processId}`),
    enabled: !!activeTenantId && !!processId,
  });

  const receivables = useMemo(() => {
    const data = receivablesQuery.data as any;
    return !data ? [] : Array.isArray(data) ? data : data.results ?? [];
  }, [receivablesQuery.data]);

  const payables = useMemo(() => {
    const data = payablesQuery.data as any;
    return !data ? [] : Array.isArray(data) ? data : data.results ?? [];
  }, [payablesQuery.data]);

  const summary = useMemo(() => {
    const received = receivables
      .filter((r: FinanceRecord) => r.paid_date || ['paga', 'pago', 'recebida', 'recebido'].includes(String(r.status || '').toLowerCase()))
      .reduce((total: number, r: FinanceRecord) => total + toAmount(r.amount), 0);
    const toReceive = receivables
      .filter((r: FinanceRecord) => !r.paid_date && OPEN_STATUSES.includes(String(r.status || '').toLowerCase()))
      .reduce((total: number, r: FinanceRecord) => total + toAmount(r.amount), 0);
    const overdue = receivables
      .filter((r: FinanceRecord) => isOverdue(r))
      .reduce((total: number, r: FinanceRecord) => total + toAmount(r.amount), 0);
    const costs = payables.reduce((total: number, r: FinanceRecord) => total + toAmount(r.amount), 0);
    return { received, toReceive, overdue, costs };
  }, [receivables, payables]);

  const loading = receivablesQuery.isLoading || payablesQuery.isLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (receivables.length === 0 && payables.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <EmptyState
            icon={CircleDollarSign}
            title="Sem lançamentos financeiros neste processo"
            description="Crie honorários, cobranças ou custas vinculadas a este processo no módulo Financeiro."
            action={{ label: 'Abrir Financeiro', onClick: () => navigate('/app/financeiro') }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Honorários, cobranças e custas vinculados a este processo.</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/app/financeiro')}>
          Abrir Financeiro
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinanceSummaryCard label="Recebido" value={formatCurrency(summary.received)} icon={TrendingUp} tone="emerald" />
        <FinanceSummaryCard label="A receber" value={formatCurrency(summary.toReceive)} icon={CircleDollarSign} tone="sky" />
        <FinanceSummaryCard label="Vencido" value={formatCurrency(summary.overdue)} icon={TrendingDown} tone="rose" />
        <FinanceSummaryCard label="Custas e despesas" value={formatCurrency(summary.costs)} icon={Receipt} tone="amber" />
      </div>

      <FinanceTable title="Contas a receber do processo" records={receivables} emptyLabel="Nenhuma cobrança vinculada a este processo." />
      <FinanceTable title="Custas e contas a pagar do processo" records={payables} emptyLabel="Nenhuma custa ou despesa vinculada a este processo." />
    </div>
  );
}
