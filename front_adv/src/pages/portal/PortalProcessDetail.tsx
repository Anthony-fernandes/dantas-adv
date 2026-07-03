import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/integrations/api/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Timeline } from '@/components/shared/Timeline';
import { ArrowLeft, Download, FileText, Gavel, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProcessDetail = {
  id: string;
  title?: string | null;
  cnj?: string | null;
  status?: string | null;
  phase?: string | null;
  area?: string | null;
  notes?: string | null;
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

type Movement = {
  id: string;
  date: string;
  description: string;
  source?: string | null;
};

type Paginated<T> = { results: T[]; count: number; next: string | null; previous: string | null };

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400',
  ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-500',
  SUSPENDED: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
};

function MovementCard({ m }: { m: Movement }) {
  const [expanded, setExpanded] = useState(false);
  const long = (m.description?.length ?? 0) > 200;
  const text = long && !expanded ? m.description.slice(0, 200) + '…' : m.description;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono-ui text-[11px] font-medium text-muted-foreground">
            {new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {m.source && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px]">{m.source}</span>}
          </p>
          <p className="mt-1 text-sm text-foreground leading-relaxed">{text}</p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? <><ChevronUp className="h-3 w-3" /> Menos</> : <><ChevronDown className="h-3 w-3" /> Mais</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const { data: movementsData, isLoading: loadingMovements } = useQuery({
    queryKey: ['portal-process-movements', processId],
    queryFn: async () => api.get<Paginated<Movement>>(`/portal/processes/${processId}/movements/`),
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
      <div className="page-container space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statusCls = STATUS_CLASS[process?.status ?? ''] ?? 'bg-muted text-muted-foreground border-border';

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-start gap-4">
          <Link to="/portal/processos">
            <Button variant="ghost" size="icon" aria-label="Voltar" className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="eyebrow">Portal do cliente</p>
            <h1 className="page-title">{process?.cnj || process?.title || 'Processo'}</h1>
            {process?.cnj && process.title && (
              <p className="mt-1 text-sm text-muted-foreground">{process.title}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn('text-xs font-medium', statusCls)}>
          {process?.status || '—'}
        </Badge>
      </div>

      {/* Meta */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {process?.area && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-0.5 text-xs font-medium text-foreground">
              <Gavel className="h-3 w-3 text-muted-foreground" />
              {process.area}
            </span>
          )}
          {process?.phase && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-0.5 text-xs font-medium text-foreground">
              {process.phase}
            </span>
          )}
        </div>
        {process?.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{process.notes}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
          <TabsTrigger value="movements">
            Movimentações
            {(movementsData?.count ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                {movementsData!.count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="docs">
            Documentos
            {(docsData?.count ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                {docsData!.count}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          {loadingTimeline ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : timelineItems.length ? (
            <Timeline items={timelineItems as any} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
              <Gavel className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum evento disponível ainda.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          {loadingMovements ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (movementsData?.results?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {movementsData!.results.map((m) => (
                <MovementCard key={m.id} m={m} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          {loadingDocs ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (docsData?.results?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              {docsData!.results.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.title || d.filename || 'Documento'}</p>
                      <p className="text-xs text-muted-foreground">{d.category || '—'}</p>
                    </div>
                  </div>
                  {d.download_url ? (
                    <a href={d.download_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="ghost" disabled className="text-muted-foreground">
                      Indisponível
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum documento disponível para este processo.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
