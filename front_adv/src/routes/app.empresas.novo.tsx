import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/empresas/novo")({
  head: () => ({ meta: [{ title: "Novo empresa — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/empresas"
      backLabel="Voltar para empresas"
      eyebrow="Empresas"
      title="Novo empresa"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/empresas" })}
      fields={[
          { label: "Nome", name: "nome", type: "text", required: true },
          { label: "CNPJ", name: "cnpj", type: "text", required: true },
          { label: "Cidade", name: "cidade", type: "text", required: true },
          { label: "Plano", name: "plano", type: "select", required: true, options: ["Starter","Business","Enterprise"] }
      ]}
    />
  );
}
