import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

type InvoiceItem = {
  id: string;
  description?: string | null;
  amount?: number | string | null;
  due_date?: string | null;
  status?: string | null;
};

function toArray(payload: any): any[] {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function currency(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return Number.isFinite(num)
    ? num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(status?: string | null, due_date?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s.includes('pag') || s.includes('liquid')) return false;
  if (!due_date) return false;
  return new Date(due_date) < new Date();
}

function statusLabel(status?: string | null) {
  if (!status) return 'N/A';
  const s = status.toLowerCase();
  if (s.includes('pag') || s.includes('liquid')) return 'Pago';
  if (s.includes('pend') || s.includes('abert')) return 'Pendente';
  if (s.includes('venc') || s.includes('atras')) return 'Vencido';
  return status;
}

function statusClass(status?: string | null, due_date?: string | null) {
  if (isOverdue(status, due_date)) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
  const s = (status ?? '').toLowerCase();
  if (s.includes('pag') || s.includes('liquid')) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
  return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400';
}

export default function PortalFinancial() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['portal-financial'],
    queryFn: () => api.get<{ invoices: InvoiceItem[]; receivables: InvoiceItem[] }>('/portal/financial/'),
  });

  const rows: InvoiceItem[] = useMemo(
    () => [...(data?.invoices ?? []), ...(data?.receivables ?? [])].slice(0, 30),
    [data],
  );

  const totalOpen = useMemo(
    () =>
      rows
        .filter((r) => !`${r.status ?? ''}`.toLowerCase().match(/pag|liquid/))
        .reduce((acc, r) => acc + Number(r.amount ?? 0), 0),
    [rows],
  );

  const totalPaid = useMemo(
    () =>
      rows
        .filter((r) => `${r.status ?? ''}`.toLowerCase().match(/pag|liquid/))
        .reduce((acc, r) => acc + Number(r.amount ?? 0), 0),
    [rows],
  );

  const overdue = useMemo(
    () => rows.filter((r) => isOverdue(r.status, r.due_date)),
    [rows],
  );

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <p className="eyebrow">Portal do cliente</p>
          <h1 className="page-title">Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulte cobranças, vencimentos e histórico de pagamentos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="kpi">
          <p className="kpi-label">Em aberto</p>
          <p className="kpi-value">{isLoading ? '—' : currency(totalOpen)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Pago</p>
          <p className="kpi-value">{isLoading ? '—' : currency(totalPaid)}</p>
        </div>
        <div className={cn('kpi', overdue.length > 0 && 'border-destructive/30 bg-destructive/5')}>
          <p className="kpi-label">Vencidos</p>
          <p className={cn('kpi-value', overdue.length > 0 && 'text-destructive')}>{isLoading ? '—' : overdue.length}</p>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <DollarSign className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum lançamento encontrado</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              O escritório ainda não registrou cobranças vinculadas à sua conta.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className={cn(
                'flex items-center gap-4 px-5 py-4',
                i !== 0 && 'border-t border-border',
                isOverdue(row.status, row.due_date) && 'bg-red-50/50 dark:bg-red-950/10',
              )}
            >
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
                isOverdue(row.status, row.due_date)
                  ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                  : 'border-border bg-muted/50',
              )}>
                {isOverdue(row.status, row.due_date) ? (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.description || 'Lançamento'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Vencimento: {formatDate(row.due_date)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">{currency(row.amount)}</p>
                <Badge variant="outline" className={cn('mt-0.5 text-[10px]', statusClass(row.status, row.due_date))}>
                  {statusLabel(row.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
