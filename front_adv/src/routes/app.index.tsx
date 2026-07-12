import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Gavel, Timer, CheckSquare, DollarSign, Clock, ArrowUpRight, Loader2,
  CheckCircle2, CalendarCheck2, Sparkles, Command,
} from "lucide-react";
import { toast } from "sonner";
import { StatCard, StatusPill } from "@/components/shell/PageHeader";
import { ProcessoDialog } from "@/components/shell/ProcessoDialog";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useUpdate, useCreate, fmtBRL, fmtDate, fmtDateTime, daysUntil, humanize } from "@/lib/resources";

export const Route = createFileRoute("/app/")({
  component: Workspace,
});

/** Lista paginada do DRF ou array puro. */
function unwrap(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

/** Consulta condicionada ao papel do usuário (evita 403 para perfis sem acesso). */
function useGated(resource: string, params: Record<string, any>, enabled: boolean) {
  return useQuery<any[]>({
    queryKey: [resource, "workspace", params],
    queryFn: async () => unwrap(await api.get<any>(`/${resource}/`, params)),
    enabled,
    staleTime: 30_000,
  });
}

function isDoneStatus(s?: string | null) {
  return ["concluido", "concluida", "cumprido", "pago", "realizada", "cancelada", "cancelado"].includes(String(s || "").toLowerCase());
}

function Workspace() {
  const { profile, roles, hasRole, isSuperuser } = useAuth();
  const navigate = useNavigate();
  const [novoProcesso, setNovoProcesso] = useState(false);

  const canLegal = isSuperuser || hasRole("OWNER", "ADMIN", "LAWYER", "ASSISTANT");
  const canFinance = isSuperuser || hasRole("OWNER", "ADMIN", "FINANCE");
  const isPartner = isSuperuser || hasRole("OWNER", "ADMIN");

  // Fila jurídica (controladoria/advogado)
  const deadlines = useGated("deadlines", { ordering: "due_date" }, canLegal);
  const hearings = useGated("hearings", { ordering: "hearing_date" }, canLegal);
  const tasks = useGated("tasks", {}, canLegal);
  const processes = useGated("processes", { ordering: "-updated_at" }, canLegal);
  const hoursToday = useGated("time-entries", { ordering: "-date" }, canLegal && hasRole("LAWYER"));

  // Fila financeira
  const receivables = useGated("accounts-receivable", { ordering: "due_date" }, canFinance);
  const payables = useGated("accounts-payable", { ordering: "due_date" }, canFinance);

  const updateDeadline = useUpdate<any>("deadlines");
  const updateHearing = useUpdate<any>("hearings");
  const updateTask = useUpdate<any>("tasks");
  const updateReceivable = useUpdate<any>("accounts-receivable");
  const createMovement = useCreate<any>("movements");

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (profile?.full_name || "").split(" ")[0] || "";

  // ---- Filas do dia ----
  const queueDeadlines = useMemo(() => {
    return (deadlines.data ?? [])
      .filter((d) => !isDoneStatus(d.status))
      .map((d) => ({ ...d, _d: daysUntil(d.due_date) }))
      .filter((d) => d._d === null || d._d <= 7)
      .sort((a, b) => (a._d ?? 999) - (b._d ?? 999))
      .slice(0, 8);
  }, [deadlines.data]);

  const queueHearings = useMemo(() => {
    return (hearings.data ?? [])
      .filter((h) => !isDoneStatus(h.status))
      .map((h) => ({ ...h, _d: daysUntil(h.hearing_date) }))
      .filter((h) => h._d !== null && h._d >= 0 && h._d <= 7)
      .sort((a, b) => (a._d ?? 999) - (b._d ?? 999))
      .slice(0, 6);
  }, [hearings.data]);

  const queueTasks = useMemo(() => {
    return (tasks.data ?? [])
      .filter((t) => !isDoneStatus(t.status))
      .map((t) => ({ ...t, _d: daysUntil(t.due_date) }))
      .sort((a, b) => (a._d ?? 999) - (b._d ?? 999))
      .slice(0, 6);
  }, [tasks.data]);

  const queueBills = useMemo(() => {
    return (receivables.data ?? [])
      .filter((r) => !isDoneStatus(r.status))
      .map((r) => ({ ...r, _d: daysUntil(r.due_date) }))
      .filter((r) => r._d === null || r._d <= 7)
      .sort((a, b) => (a._d ?? 999) - (b._d ?? 999))
      .slice(0, 8);
  }, [receivables.data]);

  // ---- Indicadores executivos (sócio/admin) ----
  const kpis = useMemo(() => {
    const recv = receivables.data ?? [];
    const open = recv.filter((r) => !isDoneStatus(r.status));
    const overdue = open.filter((r) => (daysUntil(r.due_date) ?? 1) < 0);
    const pay = (payables.data ?? []).filter((r) => !isDoneStatus(r.status));
    return {
      aReceber: open.reduce((s, r) => s + Number(r.amount || 0), 0),
      vencido: overdue.reduce((s, r) => s + Number(r.amount || 0), 0),
      aPagar: pay.reduce((s, r) => s + Number(r.amount || 0), 0),
      ativos: (processes.data ?? []).filter((p) => !["finalizado", "arquivado"].includes(String(p.status || "").toLowerCase())).length,
    };
  }, [receivables.data, payables.data, processes.data]);

  const todayHours = useMemo(() => {
    const iso = today.toISOString().slice(0, 10);
    return (hoursToday.data ?? []).filter((h) => String(h.date).slice(0, 10) === iso)
      .reduce((s, h) => s + Number(h.hours || 0), 0);
  }, [hoursToday.data]);

  // ---- Ações inline ----
  async function concluirPrazo(d: any) {
    try {
      await updateDeadline.mutateAsync({ id: String(d.id), status: "concluido" });
      if (d.process) {
        // Baixa de prazo vira andamento na timeline do processo.
        await createMovement.mutateAsync({
          process: d.process, date: new Date().toISOString().slice(0, 10),
          type: "Prazo cumprido", description: d.description || "Prazo baixado pela Central de Trabalho",
        }).catch(() => null);
      }
      toast.success("Prazo baixado.");
    } catch (e: any) { toast.error(e?.detail || "Não foi possível baixar o prazo."); }
  }
  async function confirmarAudiencia(h: any) {
    try { await updateHearing.mutateAsync({ id: String(h.id), status: "confirmada" }); toast.success("Audiência confirmada."); }
    catch (e: any) { toast.error(e?.detail || "Não foi possível confirmar."); }
  }
  async function concluirTarefa(t: any) {
    try { await updateTask.mutateAsync({ id: String(t.id), status: "concluida" }); toast.success("Tarefa concluída."); }
    catch (e: any) { toast.error(e?.detail || "Não foi possível concluir."); }
  }
  async function receberCobranca(r: any) {
    try { await updateReceivable.mutateAsync({ id: String(r.id), status: "pago" }); toast.success("Pagamento registrado."); }
    catch (e: any) { toast.error(e?.detail || "Não foi possível registrar."); }
  }

  const loadingLegal = canLegal && (deadlines.isLoading || hearings.isLoading || tasks.isLoading);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      {/* Cabeçalho do workspace */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {today.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
          <h1 className="font-display text-2xl md:text-[28px] font-semibold tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ""} — seu dia de trabalho
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {roles.includes("FINANCE") && !canLegal ? "Cobranças, recebimentos e caixa em um só lugar." : "Prazos, audiências, tarefas e pendências, priorizados para hoje."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground">
            <Command className="h-3.5 w-3.5" /> Ctrl+K para buscar ou criar
          </span>
          {canLegal && (
            <button onClick={() => setNovoProcesso(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              Novo processo <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Indicadores executivos (sócio/admin) */}
      {isPartner && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Processos ativos" value={String(kpis.ativos)} icon={Gavel} />
          <StatCard label="A receber (aberto)" value={fmtBRL(kpis.aReceber)} icon={DollarSign} tone="info" />
          <StatCard label="Vencido (inadimplência)" value={fmtBRL(kpis.vencido)} icon={DollarSign} tone="destructive" />
          <StatCard label="A pagar (aberto)" value={fmtBRL(kpis.aPagar)} icon={DollarSign} tone="warning" />
        </div>
      )}

      {/* CENTRAL DE TRABALHO */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna 1-2: filas acionáveis */}
        <div className="xl:col-span-2 space-y-6">
          {canLegal && (
            <section className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-[15px] font-semibold inline-flex items-center gap-2"><Timer className="h-4 w-4 text-warning" /> Prazos — vencidos e próximos 7 dias</h2>
                <Link to="/app/prazos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
              </div>
              <ul className="divide-y divide-border">
                {loadingLegal && <li className="px-5 py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>}
                {!loadingLegal && queueDeadlines.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">Nenhum prazo na janela crítica. ✅</li>}
                {queueDeadlines.map((d) => {
                  const dd = d._d as number | null;
                  return (
                    <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                      <StatusPill tone={dd !== null && dd < 0 ? "destructive" : dd !== null && dd <= 1 ? "warning" : "info"}>
                        {dd === null ? "—" : dd < 0 ? `${Math.abs(dd)}d atraso` : dd === 0 ? "HOJE" : `${dd}d`}
                      </StatusPill>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{d.description || "Prazo"}</p>
                        <p className="text-[11.5px] text-muted-foreground">{fmtDate(d.due_date)} · {humanize(d.priority)}</p>
                      </div>
                      {d.process && (
                        <button onClick={() => navigate({ to: "/app/processos/$id", params: { id: String(d.process) } })}
                          className="hidden sm:inline text-[12px] text-accent hover:underline">processo</button>
                      )}
                      <button onClick={() => concluirPrazo(d)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium hover:bg-success/10 hover:text-success transition">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Baixar
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {canLegal && (
            <section className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-[15px] font-semibold inline-flex items-center gap-2"><Gavel className="h-4 w-4 text-info" /> Audiências da semana</h2>
                <Link to="/app/audiencias" className="text-[12px] text-accent hover:underline">Ver todas →</Link>
              </div>
              <ul className="divide-y divide-border">
                {!loadingLegal && queueHearings.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">Nenhuma audiência nos próximos 7 dias.</li>}
                {queueHearings.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                    <StatusPill tone={h._d === 0 ? "warning" : "info"}>{h._d === 0 ? "HOJE" : `${h._d}d`}</StatusPill>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{h.type || "Audiência"} · {fmtDateTime(h.hearing_date)}</p>
                      <p className="text-[11.5px] text-muted-foreground">{h.location || h.modality || "—"}</p>
                    </div>
                    {String(h.status).toLowerCase() !== "confirmada" ? (
                      <button onClick={() => confirmarAudiencia(h)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium hover:bg-info/10 hover:text-info transition">
                        <CalendarCheck2 className="h-3.5 w-3.5" /> Confirmar
                      </button>
                    ) : (
                      <StatusPill tone="success">Confirmada</StatusPill>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {canFinance && (
            <section className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-[15px] font-semibold inline-flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" /> Cobranças — vencidas e da semana</h2>
                <Link to="/app/financeiro" className="text-[12px] text-accent hover:underline">Financeiro →</Link>
              </div>
              <ul className="divide-y divide-border">
                {receivables.isLoading && <li className="px-5 py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>}
                {!receivables.isLoading && queueBills.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">Nada vencendo nos próximos 7 dias. 🎉</li>}
                {queueBills.map((r) => {
                  const dd = r._d as number | null;
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                      <StatusPill tone={dd !== null && dd < 0 ? "destructive" : "warning"}>
                        {dd === null ? "—" : dd < 0 ? `${Math.abs(dd)}d atraso` : dd === 0 ? "HOJE" : `${dd}d`}
                      </StatusPill>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{r.description || "Cobrança"}</p>
                        <p className="text-[11.5px] text-muted-foreground">{r.client_name || ""} · vence {fmtDate(r.due_date)}</p>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums">{fmtBRL(r.amount)}</span>
                      <button onClick={() => receberCobranca(r)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium hover:bg-success/10 hover:text-success transition">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Receber
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Coluna 3: tarefas + produtividade pessoal */}
        <div className="space-y-6">
          {canLegal && (
            <section className="surface-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-[15px] font-semibold inline-flex items-center gap-2"><CheckSquare className="h-4 w-4 text-primary" /> Tarefas</h2>
                <Link to="/app/tarefas" className="text-[12px] text-accent hover:underline">Todas →</Link>
              </div>
              <ul className="divide-y divide-border">
                {!loadingLegal && queueTasks.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-muted-foreground">Sem tarefas pendentes.</li>}
                {queueTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <button aria-label="Concluir tarefa" onClick={() => concluirTarefa(t)}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-border bg-background hover:border-success hover:text-success transition">
                      <CheckCircle2 className="h-3.5 w-3.5 opacity-0 hover:opacity-100" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{t.title}</p>
                      <p className="text-[11.5px] text-muted-foreground">{t.due_date ? `vence ${fmtDate(t.due_date)}` : "sem prazo"} · {humanize(t.priority)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {canLegal && hasRole("LAWYER") && (
            <section className="surface-card p-5">
              <h2 className="text-[15px] font-semibold inline-flex items-center gap-2"><Clock className="h-4 w-4 text-info" /> Suas horas hoje</h2>
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{todayHours.toFixed(1).replace(".", ",")}h</p>
              <p className="text-[12px] text-muted-foreground">Horas lançadas em {fmtDate(today.toISOString())}</p>
              <Link to="/app/horas" search={{ novo: 1 } as any} className="mt-3 block w-full rounded-md border border-border bg-card px-3 py-2 text-center text-[12.5px] hover:bg-muted transition">
                Lançar horas agora
              </Link>
            </section>
          )}

          {/* IA-ready: ponto preparado para o assistente (resumo do dia, sugestões). */}
          <section className="surface-card p-5 border-dashed">
            <h2 className="text-[14px] font-semibold inline-flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4" /> Assistente NimbusLaw
            </h2>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Em breve: resumo inteligente do seu dia, sugestões de prioridade e rascunhos automáticos.
            </p>
          </section>
        </div>
      </div>

      <ProcessoDialog open={novoProcesso} onOpenChange={setNovoProcesso} onCreated={(p) => navigate({ to: "/app/processos/$id", params: { id: String(p.id) } })} />
    </div>
  );
}
