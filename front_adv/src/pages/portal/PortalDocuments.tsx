import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { api } from '@/integrations/api/client';

type PortalProcess = { id: string; title?: string | null; cnj?: string | null };
type Doc = { id: string; title?: string | null; filename?: string | null; download_url?: string | null; file_download_url?: string | null };
type Paginated<T> = { results: T[]; count: number; next: string | null; previous: string | null };

async function loadDocuments() {
  const processes = await api.get<Paginated<PortalProcess>>('/portal/processes/');
  const base = processes?.results ?? [];
  const first = base.slice(0, 12);
  const docsByProcess = await Promise.all(
    first.map(async (p) => {
      try {
        const docs = await api.get<Paginated<Doc>>(`/portal/processes/${p.id}/documents/`);
        return (docs?.results ?? []).map((d) => ({ ...d, processId: p.id, processTitle: p.title || p.cnj || 'Processo' }));
      } catch {
        return [];
      }
    }),
  );
  return docsByProcess.flat();
}

export default function PortalDocuments() {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: loadDocuments,
  });

  const docs = useMemo(() => data ?? [], [data]);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Documentos</h1>
      </div>
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Documentos disponiveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
          {!isLoading && docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento disponível no momento.</p>
          ) : null}
          {docs.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.title || d.filename || 'Documento'}</p>
                  <Link to={`/portal/processos/${d.processId}`} className="text-xs text-muted-foreground hover:underline">
                    {d.processTitle}
                  </Link>
                </div>
              </div>
              {(d.download_url || d.file_download_url) ? (
                <a href={d.download_url || d.file_download_url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">Baixar</Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" disabled>Indisponivel</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
