import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/cargos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Cargo") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/cargos/$id" });
  const { data: rec, isLoading } = useDetail<any>("job-positions", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/cargos"
      backLabel="Voltar para cargos"
      eyebrow="Cargos"
      title={String(rec.name || "Cargo")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Nome", value: rec.name || "—" },
        { label: "Descrição", value: rec.description || "—" },
        { label: "Ativo", value: rec.is_active === false ? "Não" : "Sim" },
      ]}
    />
  );
}
