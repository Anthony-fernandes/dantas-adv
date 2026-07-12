import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/contratos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Contrato") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/contratos/$id" });
  const { data: rec, isLoading } = useDetail<any>("contracts", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/contratos"
      backLabel="Voltar para contratos"
      eyebrow="Contratos"
      title={`Contrato ${humanize(rec.type) || ""}`}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Cliente", value: rec.client_name || rec.client || "—" },
        { label: "Tipo", value: humanize(rec.type) },
        { label: "Valor", value: fmtBRL(rec.fixed_value ?? rec.value) },
        { label: "Início", value: fmtDate(rec.start_date) },
        { label: "Fim", value: fmtDate(rec.end_date) },
        { label: "Status", value: humanize(rec.status) },
      ]}
    />
  );
}
