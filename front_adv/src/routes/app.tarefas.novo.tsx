import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate, useList } from "@/lib/resources";

export const Route = createFileRoute("/app/tarefas/novo")({
  head: () => ({ meta: [{ title: "Nova tarefa — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const processes = useList<any>("processes");
  const create = useCreate<any>("tasks");

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  return (
    <RecordForm
      backTo="/app/tarefas"
      backLabel="Voltar para tarefas"
      eyebrow="Tarefas"
      title="Nova tarefa"
      description="Crie uma tarefa e vincule opcionalmente a um processo."
      submitLabel="Criar tarefa"
      fields={[
        { label: "Título", name: "title", type: "text", required: true, full: true },
        { label: "Processo", name: "process", type: "select", options: processOptions },
        { label: "Prioridade", name: "priority", type: "select", required: true, options: [
          { value: "urgente", label: "Urgente" }, { value: "alta", label: "Alta" },
          { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" },
        ] },
        { label: "Vencimento", name: "due_date", type: "date" },
        { label: "Descrição", name: "description", type: "textarea" },
      ]}
      onSubmit={async (v) => {
        if (!v.title) {
          toast.error("Informe o título da tarefa.");
          return;
        }
        try {
          await create.mutateAsync({
            title: v.title,
            process: v.process || null,
            priority: v.priority || "media",
            due_date: v.due_date || null,
            description: v.description || null,
            status: "pendente",
          });
          toast.success("Tarefa criada.");
          nav({ to: "/app/tarefas" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar a tarefa.");
        }
      }}
    />
  );
}
