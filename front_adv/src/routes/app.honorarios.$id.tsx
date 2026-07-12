import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/honorarios/$id")({
  head: () => ({ meta: [{ title: pageTitle("Honorário") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/honorarios/$id" });
  const { data: rec, isLoading } = useDetail<any>("invoices", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/honorarios"
      backLabel="Voltar para honorários"
      eyebrow="Honorários"
      title={`Fatura ${rec.number || rec.id}`}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Número", value: rec.number || rec.id },
        { label: "Cliente", value: rec.client_name || rec.client || "—" },
        { label: "Valor", value: fmtBRL(rec.amount ?? rec.total) },
        { label: "Vencimento", value: fmtDate(rec.due_date) },
        { label: "Emissão", value: fmtDate(rec.issue_date || rec.created_at) },
        { label: "Status", value: humanize(rec.status) },
      ]}
    />
  );
}
