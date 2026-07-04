import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/documentos/novo")({
  head: () => ({ meta: [{ title: "Novo documento — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/documentos"
      backLabel="Voltar para documentos"
      eyebrow="Documentos"
      title="Novo documento"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/documentos" })}
      fields={[
          { label: "Nome do documento", name: "nome", type: "text", required: true },
          { label: "Tipo", name: "tipo", type: "select", required: true, options: ["Petição","Procuração","Laudo","Contrato","Comprovante","Outro"] },
          { label: "Processo (CNJ)", name: "processo", type: "text" },
          { label: "Cliente", name: "cliente", type: "text" },
          { label: "Autor", name: "autor", type: "text", required: true },
          { label: "Data", name: "data", type: "date", required: true },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
