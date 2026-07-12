import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/funcionarios/$id")({
  head: () => ({ meta: [{ title: pageTitle("Funcionário") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/funcionarios/$id" });
  const { data: rec, isLoading } = useDetail<any>("employees", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/funcionarios"
      backLabel="Voltar para funcionários"
      eyebrow="Funcionários"
      title={String(rec.full_name || rec.name || "Funcionário")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Nome", value: rec.full_name || rec.name || "—" },
        { label: "E-mail", value: rec.email || "—" },
        { label: "Telefone", value: rec.phone || "—" },
        { label: "Cargo", value: rec.position_name || rec.cargo || "—" },
        { label: "Admissão", value: fmtDate(rec.hire_date) },
        { label: "Ativo", value: rec.is_active === false ? "Não" : "Sim" },
      ]}
    />
  );
}
