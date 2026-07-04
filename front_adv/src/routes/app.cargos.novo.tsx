import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/cargos/novo")({
  head: () => ({ meta: [{ title: "Novo cargo — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/cargos"
      backLabel="Voltar para cargos"
      eyebrow="Cargos"
      title="Novo cargo"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/cargos" })}
      fields={[
          { label: "Nome do cargo", name: "nome", type: "text", required: true },
          { label: "Nível", name: "nivel", type: "select", required: true, options: ["Diretoria","Sênior","Pleno","Júnior","Estágio","Administrativo"] },
          { label: "Salário-base (R$)", name: "salarioBase", type: "money", required: true },
          { label: "Descrição", name: "descricao", type: "textarea" }
      ]}
    />
  );
}
