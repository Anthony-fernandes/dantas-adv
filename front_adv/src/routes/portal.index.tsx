import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Gavel, FileStack, DollarSign, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, fmtDate, humanize } from "@/lib/resources";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/portal/")({ component: PortalHome });

function isOpen(status?: string | null) {
  return !["pago", "cancelado"].includes(String(status || "").toLowerCase());
}

function PortalHome() {
  const { profile } = useAuth();
  const processes = useList<any>("processes", { ordering: "-updated_at" });
  const documents = useList<any>("documents");
  const receivables = useList<any>("accounts-receivable");

  const procs = processes.data ?? [];
  const openBills = useMemo(
    () => (receivables.data ?? []).filter((f) => isOpen(f.status)),
    [receivables.data],
  );
  const totalAPagar = useMemo(() => openBills.reduce((s, f) => s + Number(f.amount || 0), 0), [openBills]);
  const activeProcs = procs.filter((p) => !["finalizado", "arquivado"].includes(String(p.status || "").toLowerCase()));
  const loading = processes.isLoading;

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow={`Olá, ${profile?.full_name || "cliente"}`}
        title="Acompanhe seus processos"
        description="Resumo do que está acontecendo no seu escritório de advocacia."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos ativos" value={String(activeProcs.length)} icon={Gavel} />
        <StatCard label="Documentos" value={String((documents.data ?? []).length)} icon={FileStack} tone="info" />
        <StatCard label="A pagar" value={fmtBRL(totalAPagar)} icon={DollarSign} tone="warning" />
        <StatCard label="Cobranças em aberto" value={String(openBills.length)} icon={DollarSign} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold">Processos recentes</h2>
            <Link to="/portal/processos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
          </div>
          <ul className="divide-y divide-border">
            {loading && <li className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>}
            {!loading && procs.length === 0 && <li className="px-5 py-10 text-center text-muted-foreground">Nenhum processo disponível.</li>}
            {procs.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to="/portal/processos/$id" params={{ id: String(p.id) }} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary"><Gavel className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{p.area || "Processo"} · {humanize(p.phase)}</p>
                    <p className="text-[11.5px] font-mono text-muted-foreground">{p.cnj || "—"}</p>
                  </div>
                  <StatusPill tone="info">{humanize(p.status) || "—"}</StatusPill>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
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
    </div>
  );
}
