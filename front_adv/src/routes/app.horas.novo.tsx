import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/horas/novo")({
  head: () => ({ meta: [{ title: "Novo apontamento — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/horas"
      backLabel="Voltar para horas"
      eyebrow="Horas trabalhadas"
      title="Novo apontamento"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/horas" })}
      fields={[
          { label: "Data", name: "data", type: "date", required: true },
          { label: "Advogado", name: "advogado", type: "text", required: true },
          { label: "Cliente", name: "cliente", type: "text", required: true },
          { label: "Atividade", name: "atividade", type: "text", required: true },
          { label: "Horas", name: "horas", type: "number", required: true },
          { label: "Valor faturável (R$)", name: "valor", type: "money" },
          { label: "Descrição detalhada", name: "descricao", type: "textarea" }
      ]}
    />
  );
}
