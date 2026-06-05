import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, FileText, Gavel, Scale } from 'lucide-react';

import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge, deadlinePriorityVariant } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/integrations/api/client';

type PortalDashboard = {
  active_processes: number;
  documents: number;
  upcoming_deadlines: Array<{
    id: string;
    due_date: string;
    description: string;
    priority: string;
    status: string;
    process: { id: string; cnj?: string | null; title?: string | null };
  }>;
  upcoming_hearings: Array<{
    id: string;
    hearing_date: string;
    type?: string | null;
    status: string;
    process: { id: string; cnj?: string | null; title?: string | null };
  }>;
};

export default function PortalHome() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: async () => api.get<PortalDashboard>('/portal/dashboard/'),
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div className="space-y-3">
          <div className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Portal do cliente
          </div>
          <div>
            <h1 className="page-title">Acompanhe seus processos e documentos</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Consulte prazos, audiências e arquivos disponibilizados pelo escritório em um ambiente mais organizado e fácil de acompanhar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Processos ativos"
          value={data?.active_processes ?? (isLoading ? '—' : 0)}
          icon={Scale}
          variant="primary"
          description="Em acompanhamento no portal"
        />
        <StatCard
          title="Prazos próximos"
          value={data?.upcoming_deadlines?.length ?? (isLoading ? '—' : 0)}
          icon={Calendar}
          variant="warning"
          description="Vencimentos nos próximos 7 dias"
        />
        <StatCard
          title="Audiências"
          value={data?.upcoming_hearings?.length ?? (isLoading ? '—' : 0)}
          icon={Gavel}
          variant="info"
          description="Compromissos previstos em até 14 dias"
        />
        <StatCard
          title="Documentos"
          value={data?.documents ?? (isLoading ? '—' : 0)}
          icon={FileText}
          variant="info"
          description="Arquivos disponíveis para consulta"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Meus processos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Acesse a listagem completa para consultar detalhes, histórico e documentos vinculados.
            </p>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-muted/35 px-4 py-4 text-left transition-colors hover:bg-muted/55"
              onClick={() => navigate('/portal/processos')}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Abrir painel de processos</p>
                <p className="mt-1 text-xs text-muted-foreground">Veja a lista completa e acompanhe a linha do tempo do seu caso.</p>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                <span>Abrir</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Próximos prazos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visualize os vencimentos mais próximos compartilhados pelo escritório.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.upcoming_deadlines ?? []).slice(0, 3).map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{deadline.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(deadline.due_date).toLocaleDateString('pt-BR')} • {deadline.process?.cnj || deadline.process?.title || 'Processo'}
                  </p>
                </div>
                <StatusBadge variant={deadlinePriorityVariant[deadline.priority as keyof typeof deadlinePriorityVariant]}>
                  {deadline.priority}
                </StatusBadge>
              </div>
            ))}

            {!isLoading && (data?.upcoming_deadlines?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                Nenhum prazo previsto nos próximos 7 dias.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
