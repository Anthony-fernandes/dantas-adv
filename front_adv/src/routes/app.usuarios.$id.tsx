import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/usuarios/$id")({
  head: () => ({ meta: [{ title: pageTitle("Usuário") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/usuarios/$id" });
  const { data: rec, isLoading } = useDetail<any>("users", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/usuarios"
      backLabel="Voltar para usuários"
      eyebrow="Usuários"
      title={String(rec.full_name || rec.email || "Usuário")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Nome", value: rec.full_name || "—" },
        { label: "E-mail", value: rec.email || "—" },
        { label: "Perfis", value: Array.isArray(rec.roles) ? rec.roles.join(", ") : rec.role || "—" },
        { label: "Ativo", value: rec.is_active === false ? "Não" : "Sim" },
      ]}
    />
  );
}
