import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/areas/novo")({
  head: () => ({ meta: [{ title: "Novo área — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/areas"
      backLabel="Voltar para áreas"
      eyebrow="Áreas de atuação"
      title="Novo área"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/areas" })}
      fields={[
          { label: "Nome da área", name: "nome", type: "text", required: true },
          { label: "Responsável", name: "responsavel", type: "text", required: true },
          { label: "Descrição", name: "descricao", type: "textarea" }
      ]}
    />
  );
}
