import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/contratos/novo")({
  head: () => ({ meta: [{ title: "Novo contrato — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/contratos"
      backLabel="Voltar para contratos"
      eyebrow="Contratos"
      title="Novo contrato"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/contratos" })}
      fields={[
          { label: "Número do contrato", name: "numero", type: "text", required: true },
          { label: "Cliente", name: "cliente", type: "text", required: true },
          { label: "Objeto", name: "objeto", type: "text", required: true },
          { label: "Início", name: "inicio", type: "date", required: true },
          { label: "Fim", name: "fim", type: "date", required: true },
          { label: "Valor mensal (R$)", name: "valor", type: "money", required: true },
          { label: "Status", name: "status", type: "select", required: true, options: ["Ativo","Encerrando","Encerrado","Suspenso"] },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
