import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/audiencias/novo")({
  head: () => ({ meta: [{ title: "Novo audiência — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/audiencias"
      backLabel="Voltar para audiências"
      eyebrow="Audiências"
      title="Novo audiência"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/audiencias" })}
      fields={[
          { label: "Tipo", name: "tipo", type: "select", required: true, options: ["Instrução","Conciliação","Una","Julgamento"] },
          { label: "Processo (CNJ)", name: "processo", type: "text", required: true },
          { label: "Data", name: "data", type: "date", required: true },
          { label: "Hora", name: "hora", type: "text", required: true },
          { label: "Fórum", name: "forum", type: "text", required: true },
          { label: "Cidade", name: "cidade", type: "text", required: true },
          { label: "Modalidade", name: "modalidade", type: "select", required: true, options: ["Presencial","Virtual","Híbrida"] },
          { label: "Responsável", name: "responsavel", type: "text", required: true },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
