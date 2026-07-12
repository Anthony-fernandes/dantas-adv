import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/prazos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Prazo") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/prazos/$id" });
  const { data: rec, isLoading } = useDetail<any>("deadlines", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/prazos"
      backLabel="Voltar para prazos"
      eyebrow="Prazos"
      title={String(rec.description || rec.title || "Prazo")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Descrição", value: rec.description || "—" },
        { label: "Processo", value: <span className="font-mono text-[13px]">{rec.process_number || rec.process || "—"}</span> },
        { label: "Vencimento", value: fmtDate(rec.due_date) },
        { label: "Prioridade", value: humanize(rec.priority) },
        { label: "Status", value: humanize(rec.status) },
        { label: "Observações", value: rec.notes || "—" },
      ]}
    />
  );
}
