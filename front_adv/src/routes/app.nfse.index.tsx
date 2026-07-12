import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Receipt, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, fmtDate } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/nfse/")({
  head: () => ({ meta: [{ title: pageTitle("NFS-e") }] }),
  component: NfsePage,
});

function statusTone(s?: string | null) {
  const v = String(s || "").toLowerCase();
  if (v.includes("autoriz") || v.includes("emitid")) return "success";
  if (v.includes("rejeit") || v.includes("cancel")) return "destructive";
  return "warning";
}

function NfsePage() {
  const nfse = useList<any>("nfse", { ordering: "-created_at" });
  const rows = nfse.data ?? [];

  const stats = useMemo(() => ({
    total: rows.length,
    autorizadas: rows.filter((n) => String(n.status).toLowerCase().match(/autoriz|emitid/)).length,
    pendentes: rows.filter((n) => String(n.status).toLowerCase().match(/pendente|processando/)).length,
  }), [rows]);

  return (
    <ModuleScaffold
      eyebrow="Financeiro" title="NFS-e"
      description="Emissão e controle de notas fiscais de serviço eletrônicas."
      icon={Receipt}
      stats={[
        { label: "Total", value: String(stats.total) },
        { label: "Autorizadas", value: String(stats.autorizadas), tone: "success" },
        { label: "Pendentes", value: String(stats.pendentes), tone: "warning" },
      ]}
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Número</th>
                <th className="px-4 py-2.5 text-left font-medium">Tomador</th>
                <th className="px-4 py-2.5 text-left font-medium">Emissão</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {nfse.isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!nfse.isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhuma NFS-e emitida.</td></tr>}
              {rows.map((n) => (
                <tr key={n.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-mono text-[12.5px]">{n.number || n.numero || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.client_name || n.tomador || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(n.created_at || n.issue_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(n.amount || n.value)}</td>
                  <td className="px-5 py-3"><StatusPill tone={statusTone(n.status) as any}>{n.status || "—"}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
