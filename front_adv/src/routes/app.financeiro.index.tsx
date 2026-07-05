import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, fmtDate, clientName } from "@/lib/resources";

export const Route = createFileRoute("/app/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro — JurisFlow" }] }),
  component: FinanceiroPage,
});

function amountOf(e: any) {
  return Number(e.amount || e.value || 0);
}
function isOpen(status?: string | null) {
  return !["pago", "recebido", "quitado", "cancelado"].includes(String(status || "").toLowerCase());
}
function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (["pago", "recebido", "quitado"].includes(s)) return "success";
  if (["vencido", "atrasado"].includes(s)) return "destructive";
  return "warning";
}

function FinanceiroPage() {
  const receivables = useList<any>("accounts-receivable");
  const payables = useList<any>("accounts-payable");
  const clients = useList<any>("clients");
  const [filter, setFilter] = useState<"all" | "receber" | "pagar">("all");

  const clientMap = useMemo(
    () => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])),
    [clients.data],
  );

  const entries = useMemo(() => {
    const rec = (receivables.data ?? []).map((e) => ({ ...e, _kind: "Receber" as const }));
    const pay = (payables.data ?? []).map((e) => ({ ...e, _kind: "Pagar" as const }));
    return [...rec, ...pay].sort((a, b) => new Date(b.due_date || 0).getTime() - new Date(a.due_date || 0).getTime());
  }, [receivables.data, payables.data]);

  const filtered = useMemo(
    () => entries.filter((e) => filter === "all" || (filter === "receber" ? e._kind === "Receber" : e._kind === "Pagar")),
    [entries, filter],
  );

  const stats = useMemo(() => {
    const aReceber = (receivables.data ?? []).filter((e) => isOpen(e.status)).reduce((s, e) => s + amountOf(e), 0);
    const aPagar = (payables.data ?? []).filter((e) => isOpen(e.status)).reduce((s, e) => s + amountOf(e), 0);
    const recebido = (receivables.data ?? []).filter((e) => !isOpen(e.status)).reduce((s, e) => s + amountOf(e), 0);
    return { aReceber, aPagar, recebido, saldo: aReceber - aPagar };
  }, [receivables.data, payables.data]);

  const loading = receivables.isLoading || payables.isLoading;

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title="Fluxo financeiro"
        description="Contas a receber, contas a pagar e situação de caixa do escritório."
        actions={
          <Link to="/app/financeiro/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo lançamento
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Recebido" value={fmtBRL(stats.recebido)} icon={DollarSign} tone="success" />
        <StatCard label="A receber (aberto)" value={fmtBRL(stats.aReceber)} icon={TrendingUp} tone="info" />
        <StatCard label="A pagar (aberto)" value={fmtBRL(stats.aPagar)} icon={TrendingDown} tone="warning" />
        <StatCard label="Saldo projetado" value={fmtBRL(stats.saldo)} icon={Wallet} tone={stats.saldo >= 0 ? "success" : "destructive"} />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Lançamentos</h2>
          <div className="flex rounded-md border border-border overflow-hidden text-[12.5px]">
            {([["all", "Todos"], ["receber", "A receber"], ["pagar", "A pagar"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">Descrição</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente/Fornecedor</th>
                <th className="px-4 py-2.5 text-left font-medium">Vencimento</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nenhum lançamento.</td></tr>
              )}
              {filtered.map((f) => (
                <tr key={`${f._kind}-${f.id}`} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <div className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${f._kind === "Receber" ? "text-success" : "text-destructive"}`}>
                      {f._kind === "Receber" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {f._kind}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{f.description || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.client_name || clientMap[String(f.client)] || f.supplier || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(f.due_date)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${f._kind === "Receber" ? "text-success" : ""}`}>
                    {f._kind === "Receber" ? "+" : "−"}{fmtBRL(amountOf(f))}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill tone={statusTone(f.status) as any}>{f.status || "aberto"}</StatusPill>
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
