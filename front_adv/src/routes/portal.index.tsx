import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, FileStack, DollarSign, MessageSquare, ArrowRight } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { processos, financeiro, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/portal/")({ component: PortalHome });

function PortalHome() {
  const meus = processos.filter((p) => p.cliente.includes("Aurora"));
  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Olá, Construtora Aurora" title="Acompanhe seus processos" description="Resumo do que está acontecendo no seu escritório de advocacia." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos ativos" value="24" icon={Gavel} />
        <StatCard label="Documentos" value="128" icon={FileStack} tone="info" />
        <StatCard label="A pagar" value={fmtBRL(45000)} icon={DollarSign} tone="warning" />
        <StatCard label="Mensagens novas" value="3" icon={MessageSquare} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="surface-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-[15px] font-semibold">Processos com movimentação</h2>
            <Link to="/portal/processos" className="text-[12px] text-accent hover:underline">Ver todos →</Link>
          </div>
          <ul className="divide-y divide-border">
            {meus.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary"><Gavel className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{p.area} · {p.fase}</p>
                  <p className="text-[11.5px] font-mono text-muted-foreground">{p.numero}</p>
                </div>
                <StatusPill tone={p.status === "Em andamento" ? "info" : "muted"}>{p.status}</StatusPill>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-[15px] font-semibold">Financeiro</h2>
          <p className="text-[12px] text-muted-foreground">Boletos em aberto</p>
          <ul className="mt-4 space-y-3">
            {financeiro.slice(0, 3).map((f) => (
              <li key={f.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-[13px] font-medium">{f.descricao}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11.5px] text-muted-foreground">Vence {fmtDate(f.vencimento)}</span>
                  <span className="text-[13px] font-semibold tabular-nums">{fmtBRL(f.valor)}</span>
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