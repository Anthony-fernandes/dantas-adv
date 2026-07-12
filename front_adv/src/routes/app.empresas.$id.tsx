import { createFileRoute, useParams } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { useAuth } from "@/lib/auth";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/empresas/$id")({
  head: () => ({ meta: [{ title: pageTitle("Empresa") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/empresas/$id" });
  const { tenants, activeTenantId } = useAuth();
  const rec = tenants.find((t) => t.id === id) ?? null;

  if (!rec) return <div className="p-10 text-center text-muted-foreground">Empresa não encontrada.</div>;

  return (
    <RecordDetail
      backTo="/app/empresas"
      backLabel="Voltar para empresas"
      eyebrow="Empresas"
      title={rec.name}
      status={rec.id === String(activeTenantId) ? "Escritório ativo" : undefined}
      statusTone="success"
      fields={[
        { label: "Nome", value: rec.name },
        { label: "Slug", value: rec.slug || "—" },
        { label: "ID", value: <span className="font-mono text-[12px]">{rec.id}</span> },
      ]}
    />
  );
}
