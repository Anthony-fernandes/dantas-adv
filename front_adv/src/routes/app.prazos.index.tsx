import { createFileRoute } from "@tanstack/react-router";
import { Timer, AlertTriangle, Clock, CheckCircle2, Plus } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { prazos, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/prazos/")({
  head: () => ({ meta: [{ title: "Prazos — JurisFlow" }] }),
  component: PrazosPage,
});

function PrazosPage() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Prazos"
        description="Todos os prazos processuais monitorados, com destaque para os fatais."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo prazo
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ativos" value={String(prazos.length)} icon={Timer} />
        <StatCard label="Atrasados" value="1" icon={AlertTriangle} tone="destructive" />
        <StatCard label="Fatais nesta semana" value="3" icon={Clock} tone="warning" />
        <StatCard label="Concluídos (30d)" value="42" icon={CheckCircle2} tone="success" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Todos os prazos</h2>
          <div className="flex items-center gap-2">
            <select className="h-8 rounded-md border border-input bg-background px-3 text-[12.5px]">
              <option>Ordenar por urgência</option><option>Ordenar por data</option><option>Ordenar por processo</option>
            </select>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {prazos.map((p) => {
            const tone = p.dias < 0 ? "destructive" : p.dias <= 3 ? "warning" : "info";
            return (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition">
                <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" />
                <div className={`grid h-10 w-10 place-items-center rounded-md ${p.tipo === "Fatal" ? "bg-destructive/12 text-destructive" : "bg-info/12 text-info"}`}>
                  <Timer className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-medium truncate">{p.titulo}</p>
                    <StatusPill tone={p.tipo === "Fatal" ? "destructive" : "muted"}>{p.tipo}</StatusPill>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    <span className="font-mono">{p.processo}</span> · {p.cliente} · {p.responsavel}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <StatusPill tone={tone as any}>
                    {p.dias < 0 ? `${Math.abs(p.dias)}d em atraso` : p.dias === 0 ? "Hoje" : `${p.dias}d restantes`}
                  </StatusPill>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">Vence em {fmtDate(p.vencimento)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}