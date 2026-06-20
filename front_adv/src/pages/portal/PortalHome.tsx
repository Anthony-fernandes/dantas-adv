import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Gavel,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function priorityColor(priority: string) {
  const p = priority?.toUpperCase();
  if (p === 'ALTA') return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400';
  if (p === 'MEDIA') return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-400';
  return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-400';
}

function priorityLabel(priority: string) {
  const map: Record<string, string> = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };
  return map[priority?.toUpperCase()] || priority;
}

export default function PortalHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: async () => api.get<PortalDashboard>('/portal/dashboard/'),
  });

  const displayName = user?.email?.split('@')[0] || 'Cliente';

  const kpis = [
    {
      label: 'Processos ativos',
      value: data?.active_processes ?? (isLoading ? '—' : '0'),
      icon: Scale,
      href: '/portal/processos',
    },
    {
      label: 'Prazos próximos',
      value: data?.upcoming_deadlines?.length ?? (isLoading ? '—' : '0'),
      icon: Clock,
      href: '/portal/processos',
      alert: (data?.upcoming_deadlines?.length ?? 0) > 0,
    },
    {
      label: 'Audiências',
      value: data?.upcoming_hearings?.length ?? (isLoading ? '—' : '0'),
      icon: Gavel,
      href: '/portal/processos',
    },
    {
      label: 'Documentos',
      value: data?.documents ?? (isLoading ? '—' : '0'),
      icon: FileText,
      href: '/portal/documentos',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="eyebrow">Portal do cliente</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          Olá, {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe seus processos, prazos e documentos em um só lugar.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => navigate(kpi.href)}
            className="group relative rounded-xl border border-border bg-card p-5 text-left shadow-card transition-shadow hover:shadow-elevated"
          >
            {kpi.alert && (
              <span className="absolute right-3 top-3 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            )}
            <kpi.icon className="mb-3 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Processos quick access */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Meus processos</h2>
            <button
              type="button"
              onClick={() => navigate('/portal/processos')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/portal/processos')}
            className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left shadow-card transition-all hover:shadow-elevated"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
              <Scale className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Abrir painel de processos</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Consulte detalhes, histórico e documentos de cada caso
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Upcoming hearings */}
          {(data?.upcoming_hearings?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Próximas audiências</h3>
              {data!.upcoming_hearings.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-card"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40">
                    <Gavel className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{h.type || 'Audiência'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {h.process?.cnj || h.process?.title || 'Processo'} · {formatDateTime(h.hearing_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prazos sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Prazos próximos</h2>
            {(data?.upcoming_deadlines?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {data!.upcoming_deadlines.length}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {(data?.upcoming_deadlines ?? []).slice(0, 5).map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground leading-snug">{d.description}</p>
                  <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', priorityColor(d.priority))}>
                    {priorityLabel(d.priority)}
                  </span>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(d.due_date)}
                  <span className="mx-1 text-border">·</span>
                  {d.process?.cnj || d.process?.title || 'Processo'}
                </p>
              </div>
            ))}

            {!isLoading && (data?.upcoming_deadlines?.length ?? 0) === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum prazo nos próximos 7 dias</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
