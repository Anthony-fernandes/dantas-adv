import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, FileStack, DollarSign, Timer, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { usePortalGet, type PortalDashboard, type PortalFinancial } from "@/lib/portal";
import { fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/portal/")({ component: PortalHome });

function PortalHome() {
  const { profile } = useAuth();
  const dash = usePortalGet<PortalDashboard>("/portal/dashboard/");
  const fin = usePortalGet<PortalFinancial>("/portal/financial/");

  const openBills = (fin.data?.receivables ?? []).filter((r) => String(r.status || "").toLowerCase() !== "pago");
  const totalAPagar = openBills.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow={`Olá, ${profile?.full_name || "cliente"}`}
        title="Acompanhe seus processos"
        description="Resumo do que está acontecendo no seu escritório de advocacia."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos ativos" value={String(dash.data?.active_processes ?? "—")} icon={Gavel} />
        <StatCard label="Documentos" value={String(dash.data?.documents ?? "—")} icon={FileStack} tone="info" />
        <StatCard label="A pagar" value={fmtBRL(totalAPagar)} icon={DollarSign} tone="warning" />
        <StatCard label="Prazos próximos" value={String(dash.data?.upcoming_deadlines?.length ?? 0)} icon={Timer} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold">Próximos compromissos</h2>
            <Link to="/portal/processos" className="text-[12px] text-accent hover:underline">Meus processos →</Link>
          </div>
          <ul className="divide-y divide-border">
            {dash.isLoading && <li className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>}
            {!dash.isLoading && (dash.data?.upcoming_deadlines?.length ?? 0) === 0 && (dash.data?.upcoming_hearings?.length ?? 0) === 0 && (
              <li className="px-5 py-10 text-center text-muted-foreground">Nenhum compromisso próximo.</li>
            )}
            {(dash.data?.upcoming_hearings ?? []).map((h) => (
              <li key={h.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-info/10 text-info"><Gavel className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">Audiência — {h.type || "—"}</p>
                  <p className="text-[11.5px] font-mono text-muted-foreground">{h.process?.cnj || "—"} · {fmtDateTime(h.hearing_date)}</p>
                </div>
                <StatusPill tone="info">{humanize(h.status)}</StatusPill>
              </li>
            ))}
            {(dash.data?.upcoming_deadlines ?? []).map((d) => (
              <li key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-warning/10 text-warning"><Timer className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{d.description || "Prazo"}</p>
                  <p className="text-[11.5px] font-mono text-muted-foreground">{d.process?.cnj || "—"} · vence {fmtDate(d.due_date)}</p>
                </div>
                <StatusPill tone="warning">{humanize(d.priority)}</StatusPill>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-[15px] font-semibold">Financeiro</h2>
          <p className="text-[12px] text-muted-foreground">Cobranças em aberto</p>
          <ul className="mt-4 space-y-3">
            {openBills.length === 0 && <li className="py-4 text-center text-[12.5px] text-muted-foreground">Nada em aberto. 🎉</li>}
            {openBills.slice(0, 3).map((f) => (
              <li key={f.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-[13px] font-medium">{f.description || "Cobrança"}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11.5px] text-muted-foreground">Vence {fmtDate(f.due_date)}</span>
                  <span className="text-[13px] font-semibold tabular-nums">{fmtBRL(f.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/portal/financeiro" className="mt-4 block w-full rounded-md border border-border bg-card px-3 py-2 text-center text-[12.5px] hover:bg-muted transition">
            Ver todos os lançamentos
          </Link>
        </section>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <ArrowRight className="h-3.5 w-3.5" /> Dúvidas? Fale com a equipe em <Link to="/portal/mensagens" className="text-accent hover:underline">Mensagens</Link>.
      </div>
    </div>
  );
}
