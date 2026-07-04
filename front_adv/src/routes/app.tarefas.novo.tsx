import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/tarefas/novo")({
  head: () => ({ meta: [{ title: "Novo tarefa — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/tarefas"
      backLabel="Voltar para tarefas"
      eyebrow="Tarefas"
      title="Novo tarefa"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/tarefas" })}
      fields={[
          { label: "Título", name: "titulo", type: "text", required: true },
          { label: "Processo (CNJ)", name: "processo", type: "text" },
          { label: "Prioridade", name: "prioridade", type: "select", required: true, options: ["Alta","Média","Baixa"] },
          { label: "Vencimento", name: "vencimento", type: "date", required: true },
          { label: "Responsável", name: "responsavel", type: "text", required: true },
          { label: "Descrição", name: "descricao", type: "textarea" }
      ]}
    />
  );
}
