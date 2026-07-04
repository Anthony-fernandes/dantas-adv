import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, Plus, MoreHorizontal } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { contratos, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/contratos/")({
  head: () => ({ meta: [{ title: "Contratos — JurisFlow" }] }),
  component: ContratosPage,
});

function ContratosPage() {
  const total = contratos.reduce((s, c) => s + c.valor, 0);
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Jurídico"
        title="Contratos"
        description="Contratos vigentes de honorários, consultoria e serviços."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo contrato
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(contratos.length)} icon={FileSignature} />
        <StatCard label="Ativos" value="3" tone="success" />
        <StatCard label="Encerrando (30d)" value="1" tone="warning" />
        <StatCard label="Valor total" value={fmtBRL(total)} tone="info" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Contrato</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Objeto</th>
                <th className="px-4 py-2.5 text-left font-medium">Vigência</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contratos.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-mono text-[12.5px]">{c.numero}</td>
                  <td className="px-4 py-3 font-medium">{c.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[280px]">{c.objeto}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.inicio)} → {fmtDate(c.fim)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(c.valor)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={c.status === "Ativo" ? "success" : "warning"}>{c.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}