import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gavel, Users, Timer, DollarSign, TrendingUp,
  ArrowUpRight, AlertTriangle, CheckSquare,
} from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { stats, prazos, audiencias, tarefas, processos, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-8">
      <PageHeader
        eyebrow="Painel — sexta, 3 de julho de 2026"
        title="Bom dia, Marina."
        description="Você tem 3 prazos fatais nesta semana e 2 audiências amanhã. Aqui está o resumo do escritório."
        actions={
          <>
            <Link to="/app/processos" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
              Ver processos
            </Link>
            <Link to="/app/processos" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              Novo processo <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos ativos" value={String(stats.processosAtivos)} icon={Gavel} trend="+12" hint="vs. mês passado" />
        <StatCard label="Clientes ativos" value={String(stats.clientesAtivos)} icon={Users} tone="info" trend="+4" hint="novos este mês" />
        <StatCard label="Prazos na semana" value={String(stats.prazosSemana)} icon={Timer} tone="warning" hint="3 fatais" />
        <StatCard label="Receita do mês" value={fmtBRL(stats.receitaMes)} icon={DollarSign} tone="success" trend="+18%" hint="acima da meta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold">Prazos críticos</h2>
              <p className="text-[12px] text-muted-foreground">Próximos 15 dias, ordenados por urgência</p>
            </div>
            <Link to="/app/prazos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
          </div>
          <ul className="divide-y divide-border">
            {prazos.slice(0, 5).map((p) => {
              const tone = p.dias < 0 ? "destructive" : p.dias <= 3 ? "warning" : "info";
              return (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-warning/15 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{p.titulo}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      <span className="font-mono">{p.processo}</span> · {p.cliente}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusPill tone={tone as any}>
                      {p.dias < 0 ? `${Math.abs(p.dias)}d em atraso` : p.dias === 0 ? "Hoje" : `${p.dias}d restantes`}
                    </StatusPill>
                    <p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(p.vencimento)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold">Próximas audiências</h2>
            <p className="text-[12px] text-muted-foreground">Semana atual</p>
          </div>
          <ul className="divide-y divide-border">
            {audiencias.map((h) => (
              <li key={h.id} className="px-5 py-4 hover:bg-muted/40 transition">
                <div className="flex items-start gap-3">
                  <div className="text-center shrink-0 rounded-md border border-border bg-muted/50 px-2 py-1.5 min-w-[52px]">
                    <p className="font-display text-lg font-semibold leading-none">{h.data.split("-")[2]}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Jul</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{h.tipo} · {h.hora}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{h.forum}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StatusPill tone={h.modalidade === "Virtual" ? "info" : "muted"}>{h.modalidade}</StatusPill>
                      <span className="text-[11px] text-muted-foreground">{h.responsavel}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold">Minhas tarefas</h2>
              <p className="text-[12px] text-muted-foreground">Atribuídas a você</p>
            </div>
            <Link to="/app/tarefas" className="text-[12px] text-accent hover:underline">Ver todas →</Link>
          </div>
          <ul className="divide-y divide-border">
            {tarefas.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition">
                <div className={`grid h-6 w-6 place-items-center rounded-md border ${t.status === "Concluída" ? "bg-success text-success-foreground border-success" : "border-border bg-background"}`}>
                  {t.status === "Concluída" && <CheckSquare className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[13.5px] ${t.status === "Concluída" ? "text-muted-foreground line-through" : "font-medium"}`}>{t.titulo}</p>
                  <p className="text-[11.5px] text-muted-foreground font-mono">{t.processo}</p>
                </div>
                <StatusPill tone={t.prioridade === "Alta" ? "destructive" : t.prioridade === "Média" ? "warning" : "muted"}>{t.prioridade}</StatusPill>
                <span className="text-[11.5px] text-muted-foreground w-16 text-right shrink-0">{fmtDate(t.vencimento)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Financeiro</h2>
            <Link to="/app/financeiro" className="text-[12px] text-accent hover:underline">Detalhes →</Link>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">A receber (30d)</p>
              <p className="mt-1 font-display text-2xl font-semibold text-success tabular-nums">{fmtBRL(stats.aReceber)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">A pagar (30d)</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{fmtBRL(stats.aPagar)}</p>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Taxa de êxito (YTD)</span>
                <span className="font-medium text-success">{stats.taxaExito}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-success to-accent" style={{ width: `${stats.taxaExito}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/8 px-3 py-2.5">
              <TrendingUp className="h-4 w-4 text-success shrink-0" />
              <p className="text-[12px] text-foreground">
                Receita <span className="font-semibold">18% acima</span> da meta trimestral.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Processos com movimentação recente</h2>
            <p className="text-[12px] text-muted-foreground">Últimas 48 horas</p>
          </div>
          <Link to="/app/processos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Número</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Área</th>
                <th className="px-4 py-2.5 text-left font-medium">Fase</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processos.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-mono text-[12.5px]">{p.numero}</td>
                  <td className="px-4 py-3 font-medium">{p.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.area}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.fase}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(p.valor)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={p.status === "Em andamento" ? "info" : p.status === "Novo" ? "success" : p.status === "Suspenso" ? "warning" : "muted"}>{p.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{p.ultimoAndamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}