import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge, processStatusVariant } from '@/components/shared/StatusBadge';
import { Search } from 'lucide-react';
import { api } from '@/integrations/api/client';

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
        <h1 className="page-title">Meus Processos</h1>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por CNJ ou palavra-chave..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : null}

        {processes.map((p) => (
          <Link key={p.id} to={`/portal/processos/${p.id}`}>
            <Card className="shadow-card cursor-pointer transition-all hover:shadow-elevated">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-medium">{p.cnj || '—'}</span>
                  <StatusBadge variant={processStatusVariant[(p.status || 'ACTIVE') as any]}>{p.status || '—'}</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{p.title || 'Processo'}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.area || '—'} • {p.phase || '—'}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {processes.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum processo encontrado.</p>
        ) : null}
      </div>
    </div>
  );
}
