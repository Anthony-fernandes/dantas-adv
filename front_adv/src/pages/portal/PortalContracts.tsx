import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSignature, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/integrations/api/client';

type ContractItem = {
  id: string;
  type?: string | null;
  percent?: number | string | null;
  fixed_value?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  clauses?: Array<{ title?: string; text?: string } | string> | null;
  created_at?: string | null;
};

function toArray(payload: any): ContractItem[] {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number.isFinite(amount) ? amount : 0);
}

const TYPE_LABEL: Record<string, string> = {
  fixo: 'Honorários fixos',
  exito: 'Honorários de êxito',
  misto: 'Honorários mistos',
  mensal: 'Assessoria mensal',
};

function statusBadge(status?: string | null) {
  const normalized = String(status || 'vigente').toLowerCase();
  if (normalized === 'encerrado' || normalized === 'cancelado') {
    return <Badge className="border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100">Encerrado</Badge>;
  }
  if (normalized === 'suspenso') {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">Suspenso</Badge>;
  }
  return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Vigente</Badge>;
}

function describeValue(contract: ContractItem) {
  const parts: string[] = [];
  if (contract.fixed_value && Number(contract.fixed_value) > 0) parts.push(formatCurrency(contract.fixed_value));
  if (contract.percent && Number(contract.percent) > 0) parts.push(`${Number(contract.percent)}% de êxito`);
  return parts.join(' + ') || 'A combinar';
}

export default function PortalContracts() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['portal-contracts'],
    queryFn: () => api.get('/portal/contracts/'),
  });

  const contracts = useMemo(() => toArray(data), [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Portal do cliente</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">Contratos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seus contratos de honorários com o escritório, condições e vigência.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileSignature className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum contrato disponível</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Quando o escritório registrar um contrato de honorários, ele aparecerá aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map((contract) => (
            <div key={contract.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileSignature className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{TYPE_LABEL[String(contract.type || '').toLowerCase()] || 'Contrato de honorários'}</p>
                    <p className="text-xs text-muted-foreground">Desde {formatDate(contract.start_date)}</p>
                  </div>
                </div>
                {statusBadge(contract.status)}
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Valor</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{describeValue(contract)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Vigência</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {contract.end_date ? `até ${formatDate(contract.end_date)}` : 'Indeterminada'}
                  </dd>
                </div>
              </dl>

              {Array.isArray(contract.clauses) && contract.clauses.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cláusulas</p>
                  <ul className="mt-1.5 space-y-1">
                    {contract.clauses.slice(0, 4).map((clause, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {typeof clause === 'string' ? clause : clause.title || clause.text || ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
