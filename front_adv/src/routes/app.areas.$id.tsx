import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/areas/$id")({
  head: () => ({ meta: [{ title: pageTitle("Área") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/areas/$id" });
  const { data: rec, isLoading } = useDetail<any>("causes", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/areas"
      backLabel="Voltar para áreas"
      eyebrow="Áreas de atuação"
      title={String(rec.name || rec.area || "Área")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Nome", value: rec.name || "—" },
        { label: "Código", value: rec.area || "—" },
        { label: "Ativa", value: rec.is_active === false ? "Não" : "Sim" },
        { label: "Criada em", value: fmtDate(rec.created_at) },
      ]}
    />
  );
}
