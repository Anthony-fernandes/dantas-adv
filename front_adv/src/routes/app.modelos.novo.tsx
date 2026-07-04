import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/modelos/novo")({
  head: () => ({ meta: [{ title: "Novo modelo — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/modelos"
      backLabel="Voltar para modelos"
      eyebrow="Modelos de documento"
      title="Novo modelo"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/modelos" })}
      fields={[
          { label: "Nome do modelo", name: "nome", type: "text", required: true },
          { label: "Área", name: "area", type: "select", required: true, options: ["Cível","Trabalhista","Tributário","Família","Empresarial","Ambiental"] },
          { label: "Autor", name: "autor", type: "text", required: true },
          { label: "Conteúdo (variáveis: {{cliente}}, {{processo}})", name: "conteudo", type: "textarea", required: true }
      ]}
    />
  );
}
