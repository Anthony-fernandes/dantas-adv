import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { usePortalGet, type PortalFinancial } from "@/lib/portal";
import { fmtBRL, fmtDate, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/portal/financeiro")({
  head: () => ({ meta: [{ title: pageTitle("Financeiro — Portal do Cliente") }] }),
  component: PortalFin,
});

function isPaid(s?: string | null) {
  return String(s || "").toLowerCase() === "pago";
}

function PortalFin() {
  const fin = usePortalGet<PortalFinancial>("/portal/financial/");
  const rows = fin.data?.receivables ?? [];

  const stats = useMemo(() => {
    const open = rows.filter((f) => !isPaid(f.status));
    const paid = rows.filter((f) => isPaid(f.status));
    return {
      aPagar: open.reduce((s, f) => s + Number(f.amount || 0), 0),
      pago: paid.reduce((s, f) => s + Number(f.amount || 0), 0),
      total: rows.reduce((s, f) => s + Number(f.amount || 0), 0),
      abertos: open.length,
    };
  }, [rows]);

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Meu financeiro" description="Cobranças e histórico de pagamentos junto ao escritório." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="A pagar" value={fmtBRL(stats.aPagar)} icon={DollarSign} tone="warning" />
        <StatCard label="Pago" value={fmtBRL(stats.pago)} icon={DollarSign} tone="success" />
        <StatCard label="Total" value={fmtBRL(stats.total)} icon={DollarSign} tone="info" />
        <StatCard label="Em aberto" value={String(stats.abertos)} icon={DollarSign} />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Lançamentos</h2>
        </div>
        <div className="overflow-x-auto">
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
              {fin.isLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!fin.isLoading && rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Nenhum lançamento disponível.</td></tr>}
              {rows.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{f.description || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(f.due_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(f.amount)}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={isPaid(f.status) ? "success" : String(f.status).toLowerCase() === "vencido" ? "destructive" : "warning"}>{humanize(f.status) || "—"}</StatusPill>
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
