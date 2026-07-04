import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { financeiro, fmtBRL, fmtBRLPreciso, fmtDate } from "@/lib/mock";
import { DollarSign, Download } from "lucide-react";

export const Route = createFileRoute("/portal/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Portal" }] }),
  component: PortalFin,
});

function PortalFin() {
  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Meu financeiro" description="Boletos, notas fiscais e histórico de pagamentos." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="A pagar" value={fmtBRL(45000)} icon={DollarSign} tone="warning" />
        <StatCard label="Pago no mês" value={fmtBRL(22000)} icon={DollarSign} tone="success" />
        <StatCard label="Total do ano" value={fmtBRL(528000)} icon={DollarSign} tone="info" />
        <StatCard label="Notas fiscais" value="18" icon={DollarSign} />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Lançamentos</h2>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] hover:bg-muted">
            <Download className="h-3.5 w-3.5" /> Baixar extrato
          </button>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">Descrição</th>
              <th className="px-4 py-2.5 text-left font-medium">Vencimento</th>
              <th className="px-4 py-2.5 text-right font-medium">Valor</th>
              <th className="px-5 py-2.5 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {financeiro.map((f) => (
              <tr key={f.id} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{f.descricao}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(f.vencimento)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtBRLPreciso(f.valor)}</td>
                <td className="px-5 py-3">
                  <StatusPill tone={f.status === "Pago" ? "success" : f.status === "Atrasado" ? "destructive" : "warning"}>{f.status}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}