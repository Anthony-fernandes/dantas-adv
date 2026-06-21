import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  em_andamento: { label: 'Em andamento', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40' },
  ativo: { label: 'Ativo', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40' },
  finalizado: { label: 'Finalizado', cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40' },
  suspenso: { label: 'Suspenso', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40' },
  arquivado: { label: 'Arquivado', cls: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400' },
};

function statusInfo(status?: string | null) {
  const key = (status ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  return STATUS_MAP[key] ?? { label: status || '—', cls: 'bg-muted text-muted-foreground border-border' };
}

const AREA_MAP: Record<string, string> = {
  CIVEL: 'Cível',
  TRABALHISTA: 'Trabalhista',
  CRIMINAL: 'Criminal',
  TRIBUTARIO: 'Tributário',
  EMPRESARIAL: 'Empresarial',
  FAMILIA: 'Família',
  CONSUMIDOR: 'Consumidor',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
    staleTime: 30_000,
  });

  const processes = useMemo(() => data?.results ?? [], [data]);
  const total = data?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Portal do cliente</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Meus processos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o andamento e os documentos de cada caso.
        </p>
      </div>

      {/* Search + count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNJ ou assunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {!isLoading && total > 0 && (
          <p className="text-sm text-muted-foreground">
            {total} processo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      ) : processes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted/40">
            <Gavel className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum processo encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Tente buscar por outro termo.' : 'Não há processos vinculados à sua conta.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {processes.map((p) => {
            const { label: statusLabel, cls: statusCls } = statusInfo(p.status);
            const areaLabel = AREA_MAP[p.area?.toUpperCase() ?? ''] || p.area;

            return (
              <Link key={p.id} to={`/portal/processos/${p.id}`}>
                <div className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card transition-all hover:border-foreground/20 hover:shadow-elevated">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                    <Gavel className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.cnj && (
                        <span className="font-mono text-xs text-muted-foreground">{p.cnj}</span>
                      )}
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', statusCls)}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {p.title || 'Processo'}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[areaLabel, p.phase].filter(Boolean).join(' · ')}
                      {' · Atualizado em '}
                      {formatDate(p.updated_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
