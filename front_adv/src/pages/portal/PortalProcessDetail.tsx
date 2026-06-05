import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timeline } from '@/components/shared/Timeline';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ProcessDetail = {
  id: string;
  title?: string | null;
  cnj?: string | null;
  status?: string | null;
  phase?: string | null;
  area?: string | null;
  description?: string | null;
  client?: { id: string; name: string } | null;
};

type TimelineItem = {
  id: string;
  type: 'movement' | 'deadline' | 'hearing';
  date: string;
  title: string;
  description?: string | null;
  status?: string | null;
};

type Doc = {
  id: string;
  title?: string | null;
  filename?: string | null;
  category?: string | null;
  created_at: string;
  download_url?: string | null;
};

type Paginated<T> = { results: T[]; count: number; next: string | null; previous: string | null };

export default function PortalProcessDetail() {
  const { id } = useParams();
  const processId = id as string;

  const { data: process, isLoading: loadingProcess } = useQuery({
    queryKey: ['portal-process', processId],
    queryFn: async () => api.get<ProcessDetail>(`/portal/processes/${processId}/`),
    enabled: !!processId,
  });

  const { data: timelineData, isLoading: loadingTimeline } = useQuery({
    queryKey: ['portal-process-timeline', processId],
    queryFn: async () => api.get<TimelineItem[]>(`/portal/processes/${processId}/timeline/`),
    enabled: !!processId,
  });

  const { data: docsData, isLoading: loadingDocs } = useQuery({
    queryKey: ['portal-process-docs', processId],
    queryFn: async () => api.get<Paginated<Doc>>(`/portal/processes/${processId}/documents/`),
    enabled: !!processId,
  });

  const timelineItems = (timelineData ?? []).map((it) => ({
    id: it.id,
    date: it.date,
    title: it.title,
    description: it.description || '',
    type: it.type,
  }));

  if (loadingProcess) {
    return (
      <div className="page-container animate-fade-in space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/portal/processos">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="page-title">{process?.title || 'Processo'}</h1>
            <p className="text-sm text-muted-foreground font-mono">{process?.cnj || '—'}</p>
          </div>
        </div>
        <Badge variant="outline">{process?.status || '—'}</Badge>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Área: {process?.area || '—'}</Badge>
            <Badge variant="secondary">Fase: {process?.phase || '—'}</Badge>
            {process?.client?.name ? <Badge variant="secondary">Cliente: {process.client.name}</Badge> : null}
          </div>
          {process?.description ? <p>{process.description}</p> : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTimeline ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : timelineItems.length ? (
                <Timeline items={timelineItems as any} />
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum evento disponível.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingDocs ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (docsData?.results?.length ?? 0) ? (
                <div className="space-y-2">
                  {docsData!.results.map((d) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{d.title || d.filename || 'Documento'}</div>
                          <div className="text-xs text-muted-foreground">{d.category || '—'}</div>
                        </div>
                      </div>
                      {d.download_url ? (
                        <a href={d.download_url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">Baixar</Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Indisponível
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum documento disponível.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
