import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/integrations/api/client';

type PortalProcess = { id: string; title?: string | null; cnj?: string | null };
type Doc = {
  id: string;
  title?: string | null;
  filename?: string | null;
  category?: string | null;
  created_at?: string;
  download_url?: string | null;
  file_download_url?: string | null;
};
type Paginated<T> = { results: T[]; count: number; next: string | null; previous: string | null };

type DocWithProcess = Doc & { processId: string; processTitle: string };

async function loadDocuments(): Promise<DocWithProcess[]> {
  const processes = await api.get<Paginated<PortalProcess>>('/portal/processes/');
  const base = processes?.results ?? [];
  const docsByProcess = await Promise.all(
    base.slice(0, 12).map(async (p) => {
      try {
        const docs = await api.get<Paginated<Doc>>(`/portal/processes/${p.id}/documents/`);
        return (docs?.results ?? []).map((d) => ({
          ...d,
          processId: p.id,
          processTitle: p.title || p.cnj || 'Processo',
        }));
      } catch {
        return [];
      }
    }),
  );
  return docsByProcess.flat();
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PortalDocuments() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: loadDocuments,
  });

  const docs = useMemo(() => {
    const all = data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (d) =>
        (d.title || d.filename || '').toLowerCase().includes(q) ||
        d.processTitle.toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Portal do cliente</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Documentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arquivos disponibilizados pelo escritório para consulta e download.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum documento encontrado</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {search ? 'Tente buscar por outro termo.' : 'O escritório ainda não disponibilizou documentos.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {docs.map((d, i) => (
            <div
              key={d.id}
              className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-border' : ''}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {d.title || d.filename || 'Documento'}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/portal/processos/${d.processId}`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {d.processTitle}
                  </Link>
                  {d.category && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {d.category}
                    </Badge>
                  )}
                  {d.created_at && (
                    <span className="text-[10px] text-muted-foreground">{formatDate(d.created_at)}</span>
                  )}
                </div>
              </div>
              {d.download_url || d.file_download_url ? (
                <a
                  href={d.download_url || d.file_download_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" disabled className="shrink-0">
                  Indisponível
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
