import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Gavel, Users, Timer, DollarSign, TrendingUp,
  ArrowUpRight, AlertTriangle, CheckSquare,
} from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, fmtDate, daysUntil, clientName } from "@/lib/resources";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function isOpen(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return !["finalizado", "arquivado", "encerrado", "concluido", "concluída", "cancelada", "pago"].includes(s);
}

function Dashboard() {
  const { profile } = useAuth();
  const processes = useList<any>("processes", { ordering: "-updated_at" });
  const clients = useList<any>("clients");
  const deadlines = useList<any>("deadlines", { ordering: "due_date" });
  const hearings = useList<any>("hearings", { ordering: "hearing_date" });
  const tasks = useList<any>("tasks");
  const receivables = useList<any>("accounts-receivable");
  const payables = useList<any>("accounts-payable");

  const procList = processes.data ?? [];
  const clientMap = useMemo(
    () => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])),
    [clients.data],
  );

  const stats = useMemo(() => {
    const activeProc = procList.filter((p) => isOpen(p.status)).length;
    const activeClients = (clients.data ?? []).filter((c) => String(c.status || "ativo").toLowerCase() !== "inativo").length;
    const weekDeadlines = (deadlines.data ?? []).filter((d) => {
      const dd = daysUntil(d.due_date);
      return dd !== null && dd >= 0 && dd <= 7 && isOpen(d.status);
    }).length;
    const aReceber = (receivables.data ?? [])
      .filter((r) => isOpen(r.status))
      .reduce((s, r) => s + Number(r.amount || r.value || 0), 0);
    const aPagar = (payables.data ?? [])
      .filter((r) => isOpen(r.status))
      .reduce((s, r) => s + Number(r.amount || r.value || 0), 0);
    return { activeProc, activeClients, weekDeadlines, aReceber, aPagar };
  }, [procList, clients.data, deadlines.data, receivables.data, payables.data]);

  const criticalDeadlines = useMemo(
    () =>
      [...(deadlines.data ?? [])]
        .filter((d) => isOpen(d.status))
        .map((d) => ({ ...d, _d: daysUntil(d.due_date) }))
        .filter((d) => d._d !== null)
        .sort((a, b) => (a._d as number) - (b._d as number))
        .slice(0, 5),
    [deadlines.data],
  );

  const upcomingHearings = useMemo(
    () =>
      [...(hearings.data ?? [])]
        .map((h) => ({ ...h, _d: daysUntil(h.hearing_date) }))
        .filter((h) => h._d !== null && (h._d as number) >= 0)
        .sort((a, b) => (a._d as number) - (b._d as number))
        .slice(0, 4),
    [hearings.data],
  );

  const myTasks = useMemo(
    () => [...(tasks.data ?? [])].filter((t) => String(t.status).toLowerCase() !== "cancelada").slice(0, 5),
    [tasks.data],
  );

  const recentProcesses = procList.slice(0, 5);
  const firstName = (profile?.full_name || "").split(" ")[0] || "";

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-8">
      <PageHeader
        eyebrow="Painel"
        title={firstName ? `Bem-vindo(a), ${firstName}.` : "Painel do escritório"}
        description="Resumo operacional do escritório: prazos, audiências, tarefas e financeiro."
        actions={
          <>
            <Link to="/app/processos" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
              Ver processos
            </Link>
            <Link to="/app/processos/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              Novo processo <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos ativos" value={String(stats.activeProc)} icon={Gavel} hint="em andamento" />
        <StatCard label="Clientes ativos" value={String(stats.activeClients)} icon={Users} tone="info" hint="carteira" />
        <StatCard label="Prazos na semana" value={String(stats.weekDeadlines)} icon={Timer} tone="warning" hint="próximos 7 dias" />
        <StatCard label="A receber (aberto)" value={fmtBRL(stats.aReceber)} icon={DollarSign} tone="success" hint="cobranças em aberto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold">Prazos críticos</h2>
              <p className="text-[12px] text-muted-foreground">Ordenados por urgência</p>
            </div>
            <Link to="/app/prazos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
          </div>
          <ul className="divide-y divide-border">
            {criticalDeadlines.length === 0 && (
              <li className="px-5 py-6 text-center text-[13px] text-muted-foreground">Nenhum prazo em aberto.</li>
            )}
            {criticalDeadlines.map((p) => {
              const dias = p._d as number;
              const tone = dias < 0 ? "destructive" : dias <= 3 ? "warning" : "info";
              return (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-warning/15 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{p.description || p.title || "Prazo"}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {clientMap[String(p.process)] || p.process_number || "Processo"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusPill tone={tone as any}>
                      {dias < 0 ? `${Math.abs(dias)}d em atraso` : dias === 0 ? "Hoje" : `${dias}d restantes`}
                    </StatusPill>
                    <p className="mt-1 text-[11px] text-muted-foreground">{fmtDate(p.due_date)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold">Próximas audiências</h2>
            <p className="text-[12px] text-muted-foreground">Agenda</p>
          </div>
          <ul className="divide-y divide-border">
            {upcomingHearings.length === 0 && (
              <li className="px-5 py-6 text-center text-[13px] text-muted-foreground">Sem audiências agendadas.</li>
            )}
            {upcomingHearings.map((h) => {
              const d = h.hearing_date ? new Date(h.hearing_date) : null;
              return (
                <li key={h.id} className="px-5 py-4 hover:bg-muted/40 transition">
                  <div className="flex items-start gap-3">
                    <div className="text-center shrink-0 rounded-md border border-border bg-muted/50 px-2 py-1.5 min-w-[52px]">
                      <p className="font-display text-lg font-semibold leading-none">{d ? String(d.getDate()).padStart(2, "0") : "--"}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {d ? d.toLocaleDateString("pt-BR", { month: "short" }) : ""}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium">
                        {h.type || "Audiência"} {d ? `· ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{h.location || "Local a definir"}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <StatusPill tone={String(h.modality).toLowerCase().includes("virtual") ? "info" : "muted"}>
                          {h.modality || "Presencial"}
                        </StatusPill>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold">Tarefas</h2>
              <p className="text-[12px] text-muted-foreground">Pendências do escritório</p>
            </div>
            <Link to="/app/tarefas" className="text-[12px] text-accent hover:underline">Ver todas →</Link>
          </div>
          <ul className="divide-y divide-border">
            {myTasks.length === 0 && (
              <li className="px-5 py-6 text-center text-[13px] text-muted-foreground">Nenhuma tarefa pendente.</li>
            )}
            {myTasks.map((t) => {
              const done = String(t.status).toLowerCase() === "concluida";
              const prio = String(t.priority || "media").toLowerCase();
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition">
                  <div className={`grid h-6 w-6 place-items-center rounded-md border ${done ? "bg-success text-success-foreground border-success" : "border-border bg-background"}`}>
                    {done && <CheckSquare className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13.5px] ${done ? "text-muted-foreground line-through" : "font-medium"}`}>{t.title}</p>
                  </div>
                  <StatusPill tone={prio === "urgente" || prio === "alta" ? "destructive" : prio === "media" ? "warning" : "muted"}>
                    {prio}
                  </StatusPill>
                  <span className="text-[11.5px] text-muted-foreground w-16 text-right shrink-0">{fmtDate(t.due_date)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card p-5 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Financeiro</h2>
            <Link to="/app/financeiro" className="text-[12px] text-accent hover:underline">Detalhes →</Link>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">A receber (aberto)</p>
              <p className="mt-1 font-display text-2xl font-semibold text-success tabular-nums">{fmtBRL(stats.aReceber)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">A pagar (aberto)</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{fmtBRL(stats.aPagar)}</p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-success/20 bg-success/8 px-3 py-2.5">
              <TrendingUp className="h-4 w-4 text-success shrink-0" />
              <p className="text-[12px] text-foreground">
                Saldo projetado: <span className="font-semibold">{fmtBRL(stats.aReceber - stats.aPagar)}</span>.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Processos recentes</h2>
            <p className="text-[12px] text-muted-foreground">Últimas atualizações</p>
          </div>
          <Link to="/app/processos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Número CNJ</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Área</th>
                <th className="px-4 py-2.5 text-left font-medium">Fase</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentProcesses.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">Nenhum processo cadastrado.</td></tr>
              )}
              {recentProcesses.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-mono text-[12.5px]">
                    <Link to="/app/processos/$id" params={{ id: String(p.id) }} className="text-primary hover:underline">{p.cnj || "—"}</Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.client_name || clientMap[String(p.client)] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.area || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{p.phase || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(p.cause_value)}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={isOpen(p.status) ? "info" : "muted"}>{p.status || "—"}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
