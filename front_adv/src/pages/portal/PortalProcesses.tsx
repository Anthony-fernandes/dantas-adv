import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

type PortalProcess = {
  id: string;
  title?: string | null;
  cnj?: string | null;
  status?: string | null;
  phase?: string | null;
  area?: string | null;
  updated_at: string;
};

type Paginated<T> = { results: T[]; count: number; next: string | null; previous: string | null };

const STATUS_VARIANTS: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  em_andamento: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  encerrado: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
  finalizado: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  arquivado: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusStyle(status?: string | null) {
  const key = (status ?? '').toLowerCase().replace(/\s+/g, '_');
  return STATUS_VARIANTS[key] ?? 'bg-muted text-muted-foreground border-border';
}

export default function PortalProcesses() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-processes', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return api.get<Paginated<PortalProcess>>(`/portal/processes/?${params.toString()}`);
    },
  });

  const processes = useMemo(() => data?.results ?? [], [data]);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <p className="eyebrow">Portal do cliente</p>
          <h1 className="page-title">Meus processos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o andamento e os documentos de cada caso.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por CNJ ou palavra-chave..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : processes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Gavel className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum processo encontrado</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {search ? 'Tente buscar por outro termo.' : 'Não há processos vinculados à sua conta.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {processes.map((p) => (
            <Link key={p.id} to={`/portal/processos/${p.id}`}>
              <div className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card transition-all hover:border-primary/20 hover:shadow-elevated">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-medium text-muted-foreground">
                      {p.cnj || 'Sem número CNJ'}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-medium capitalize', statusStyle(p.status))}
                    >
                      {p.status || '—'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                    {p.title || 'Processo'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[p.area, p.phase].filter(Boolean).join(' • ') || '—'}
                    {' '}· Atualizado em {formatDate(p.updated_at)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
