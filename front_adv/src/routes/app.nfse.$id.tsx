import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/nfse/$id")({
  head: () => ({ meta: [{ title: pageTitle("NFS-e") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/nfse/$id" });
  const { data: rec, isLoading } = useDetail<any>("nfse", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/nfse"
      backLabel="Voltar para NFS-e"
      eyebrow="NFS-e"
      title={`NFS-e ${rec.numero || rec.number || rec.id}`}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Número", value: rec.numero || rec.number || rec.id },
        { label: "Competência", value: rec.competencia || "—" },
        { label: "Tomador", value: rec.tomador_nome || rec.client_name || "—" },
        { label: "Valor", value: fmtBRL(rec.valor ?? rec.amount) },
        { label: "Emissão", value: fmtDateTime(rec.created_at) },
        { label: "Status", value: humanize(rec.status) },
      ]}
    />
  );
}
