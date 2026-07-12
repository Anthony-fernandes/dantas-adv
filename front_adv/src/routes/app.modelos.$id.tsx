import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/modelos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Modelo") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/modelos/$id" });
  const { data: rec, isLoading } = useDetail<any>("legal-templates", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/modelos"
      backLabel="Voltar para modelos"
      eyebrow="Modelos de documento"
      title={String(rec.name || "Modelo")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Nome", value: rec.name || "—" },
        { label: "Categoria", value: humanize(rec.category) },
        { label: "Formato", value: (rec.format || "—").toUpperCase() },
        { label: "Versão", value: `v${rec.version || 1}` },
        { label: "Criado em", value: fmtDate(rec.created_at) },
        { label: "Conteúdo", value: <pre className="whitespace-pre-wrap font-sans text-[13px]">{rec.content || "—"}</pre> },
      ]}
    />
  );
}
