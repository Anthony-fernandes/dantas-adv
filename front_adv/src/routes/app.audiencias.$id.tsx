import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/audiencias/$id")({
  head: () => ({ meta: [{ title: pageTitle("Audiência") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/audiencias/$id" });
  const { data: rec, isLoading } = useDetail<any>("hearings", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/audiencias"
      backLabel="Voltar para audiências"
      eyebrow="Audiências"
      title={String(rec.type || "Audiência")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Tipo", value: rec.type || "—" },
        { label: "Data e hora", value: fmtDateTime(rec.hearing_date) },
        { label: "Processo", value: <span className="font-mono text-[13px]">{rec.process_number || rec.process || "—"}</span> },
        { label: "Local", value: rec.location || "—" },
        { label: "Modalidade", value: rec.modality || "—" },
        { label: "Link", value: rec.online_link ? <a className="text-primary hover:underline" href={rec.online_link} target="_blank" rel="noreferrer">{rec.online_link}</a> : "—" },
        { label: "Status", value: humanize(rec.status) },
        { label: "Observações", value: rec.notes || "—" },
      ]}
    />
  );
}
