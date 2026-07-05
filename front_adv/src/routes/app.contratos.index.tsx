import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { FileSignature, Plus, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, fmtDate, clientName, humanize } from "@/lib/resources";

export const Route = createFileRoute("/app/contratos/")({
  head: () => ({ meta: [{ title: "Contratos — JurisFlow" }] }),
  component: ContratosPage,
});

function contractValue(c: any) {
  return Number(c.fixed_value || c.value || c.amount || 0);
}

function ContratosPage() {
  const contracts = useList<any>("contracts");
  const clients = useList<any>("clients");
  const rows = contracts.data ?? [];

  const clientMap = useMemo(
    () => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])),
    [clients.data],
  );

  const stats = useMemo(() => ({
    total: rows.length,
    vigentes: rows.filter((c) => String(c.status).toLowerCase() === "vigente").length,
    encerrados: rows.filter((c) => String(c.status).toLowerCase() === "encerrado").length,
    valor: rows.reduce((s, c) => s + contractValue(c), 0),
  }), [rows]);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Jurídico"
        title="Contratos"
        description="Contratos de honorários, consultoria e serviços."
        actions={
          <Link to="/app/contratos/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo contrato
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(stats.total)} icon={FileSignature} />
        <StatCard label="Vigentes" value={String(stats.vigentes)} tone="success" />
        <StatCard label="Encerrados" value={String(stats.encerrados)} tone="muted" />
        <StatCard label="Valor total" value={fmtBRL(stats.valor)} tone="info" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">Vigência</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.isLoading && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!contracts.isLoading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhum contrato cadastrado.</td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{c.client_name || clientMap[String(c.client)] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{humanize(c.type)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.start_date)} {c.end_date ? `→ ${fmtDate(c.end_date)}` : ""}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(contractValue(c))}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={String(c.status).toLowerCase() === "vigente" ? "success" : String(c.status).toLowerCase() === "suspenso" ? "warning" : "muted"}>{c.status || "—"}</StatusPill>
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
