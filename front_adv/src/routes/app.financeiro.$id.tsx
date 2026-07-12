import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { useDetail, fmtBRL, fmtDate, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/financeiro/$id")({
  head: () => ({ meta: [{ title: pageTitle("Lançamento") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/financeiro/$id" });
  // O lançamento pode ser conta a receber ou a pagar — tenta os dois recursos.
  const receivable = useDetail<any>("accounts-receivable", id);
  const payable = useDetail<any>("accounts-payable", id);

  const isLoading = receivable.isLoading || payable.isLoading;
  const rec = receivable.data ?? payable.data ?? null;
  const kind = receivable.data ? "A receber" : payable.data ? "A pagar" : "";

  if (isLoading && !rec) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;

  return (
    <RecordDetail
      backTo="/app/financeiro"
      backLabel="Voltar para financeiro"
      eyebrow={`Financeiro · ${kind}`}
      title={String(rec.description || "Lançamento")}
      status={rec.status ? humanize(rec.status) : undefined}
      statusTone={String(rec.status).toLowerCase() === "pago" ? "success" : String(rec.status).toLowerCase() === "vencido" ? "destructive" : "info"}
      fields={[
        { label: "Tipo", value: kind || "—" },
        { label: "Descrição", value: rec.description || "—" },
        { label: "Cliente", value: rec.client_name || rec.client || "—" },
        { label: "Valor", value: fmtBRL(rec.amount) },
        { label: "Vencimento", value: fmtDate(rec.due_date) },
        { label: "Pago em", value: fmtDate(rec.paid_at || rec.payment_date) },
        { label: "Status", value: humanize(rec.status) },
      ]}
    />
  );
}
