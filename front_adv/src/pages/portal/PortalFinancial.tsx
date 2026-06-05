import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/integrations/api/client';
import { RefreshCw } from 'lucide-react';

type InvoiceItem = {
  id: string;
  description?: string | null;
  amount?: number | string | null;
  due_date?: string | null;
  status?: string | null;
};

type Paginated<T> = { results?: T[] };

function toArray(payload: any): any[] {
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function currency(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
}

export default function PortalFinancial() {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['portal-financial'],
    queryFn: async () => {
      const [invoicesRes, receivablesRes] = await Promise.allSettled([
        api.get<Paginated<InvoiceItem>>('/invoices/'),
        api.get<Paginated<InvoiceItem>>('/accounts-receivable/'),
      ]);

      const invoices =
        invoicesRes.status === 'fulfilled' ? toArray(invoicesRes.value) : [];
      const receivables =
        receivablesRes.status === 'fulfilled' ? toArray(receivablesRes.value) : [];

      return { invoices, receivables };
    },
  });

  const rows = useMemo(() => {
    const base = [...(data?.invoices ?? []), ...(data?.receivables ?? [])];
    return base.slice(0, 20);
  }, [data]);

  const totalOpen = useMemo(() => {
    return rows
      .filter((r: any) => `${r.status ?? ''}`.toLowerCase().includes('pend') || `${r.status ?? ''}`.toLowerCase().includes('abert'))
      .reduce((acc: number, r: any) => acc + Number(r.amount ?? 0), 0);
  }, [rows]);

  return (
    <div className="page-container animate-fade-in space-y-4">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Títulos e cobranças do seu escritório.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Registros</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{rows.length}</p></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Em aberto</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{currency(totalOpen)}</p></CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Fontes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {data?.invoices?.length ? 'Faturas ' : ''}
              {data?.receivables?.length ? 'Recebiveis' : ''}
              {!data?.invoices?.length && !data?.receivables?.length ? 'Sem fonte disponivel' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base">Lancamentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
          {!isLoading && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum dado financeiro encontrado para seu usuário no portal.
            </p>
          ) : null}
          {rows.map((row: any) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{row.description || row.title || 'Lancamento'}</p>
                <p className="text-xs text-muted-foreground">
                  Vencimento: {row.due_date ? new Date(row.due_date).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{currency(row.amount)}</p>
                <Badge variant="outline">{row.status || 'N/A'}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
