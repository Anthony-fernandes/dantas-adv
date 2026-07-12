import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/horas/$id")({
  head: () => ({ meta: [{ title: pageTitle("Apontamento") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/horas/$id" });
  const { data: rec, isLoading } = useDetail<any>("time-entries", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/horas"
      backLabel="Voltar para horas"
      eyebrow="Horas trabalhadas"
      title={String(rec.description || "Apontamento")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Data", value: fmtDate(rec.date) },
        { label: "Descrição", value: rec.description || "—" },
        { label: "Processo", value: <span className="font-mono text-[13px]">{rec.process_number || rec.process || "—"}</span> },
        { label: "Horas", value: String(rec.hours ?? "—") },
        { label: "Faturável", value: rec.billable === false ? "Não" : "Sim" },
        { label: "Valor", value: fmtBRL(rec.amount) },
      ]}
    />
  );
}
