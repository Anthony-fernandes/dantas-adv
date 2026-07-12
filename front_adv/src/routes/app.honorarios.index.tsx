import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Banknote, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, fmtDate, clientName } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/honorarios/")({
  head: () => ({ meta: [{ title: pageTitle("Honorários") }] }),
  component: HonorariosPage,
});

function HonorariosPage() {
  const invoices = useList<any>("invoices");
  const clients = useList<any>("clients");
  const rows = invoices.data ?? [];
  const clientMap = useMemo(() => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])), [clients.data]);

  const total = useMemo(() => rows.reduce((s, i) => s + Number(i.amount || i.value || 0), 0), [rows]);
  const pago = useMemo(() => rows.filter((i) => String(i.status).toLowerCase().match(/pago|recebido/)).reduce((s, i) => s + Number(i.amount || i.value || 0), 0), [rows]);

  return (
    <ModuleScaffold
      eyebrow="Financeiro" title="Honorários"
      description="Controle de honorários por cliente e processo."
      icon={Banknote}
      stats={[
        { label: "Total", value: fmtBRL(total), tone: "info" },
        { label: "Recebido", value: fmtBRL(pago), tone: "success" },
        { label: "Lançamentos", value: String(rows.length) },
      ]}
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Descrição</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Vencimento</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!invoices.isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhum honorário lançado.</td></tr>}
              {rows.map((i) => (
                <tr key={i.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{i.description || i.number || "Honorário"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.client_name || clientMap[String(i.client)] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.due_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(i.amount || i.value)}</td>
                  <td className="px-5 py-3"><StatusPill tone={String(i.status).toLowerCase().match(/pago|recebido/) ? "success" : "warning"}>{i.status || "aberto"}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
