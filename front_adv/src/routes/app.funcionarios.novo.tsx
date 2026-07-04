import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/funcionarios/novo")({
  head: () => ({ meta: [{ title: "Novo funcionário — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/funcionarios"
      backLabel="Voltar para funcionários"
      eyebrow="Funcionários"
      title="Novo funcionário"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/funcionarios" })}
      fields={[
          { label: "Nome completo", name: "nome", type: "text", required: true },
          { label: "Cargo", name: "cargo", type: "text", required: true },
          { label: "E-mail", name: "email", type: "email", required: true },
          { label: "OAB", name: "oab", type: "text" },
          { label: "Data de ingresso", name: "ingresso", type: "date", required: true },
          { label: "Telefone", name: "telefone", type: "tel" },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
