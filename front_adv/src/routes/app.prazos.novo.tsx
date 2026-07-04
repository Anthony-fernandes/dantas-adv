import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/prazos/novo")({
  head: () => ({ meta: [{ title: "Novo prazo — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/prazos"
      backLabel="Voltar para prazos"
      eyebrow="Prazos"
      title="Novo prazo"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/prazos" })}
      fields={[
          { label: "Título", name: "titulo", type: "text", required: true },
          { label: "Processo (CNJ)", name: "processo", type: "text", required: true },
          { label: "Cliente", name: "cliente", type: "text", required: true },
          { label: "Vencimento", name: "vencimento", type: "date", required: true },
          { label: "Tipo", name: "tipo", type: "select", options: ["Fatal","Ordinário","Comum"] },
          { label: "Responsável", name: "responsavel", type: "text", required: true },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
