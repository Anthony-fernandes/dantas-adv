import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate, useList } from "@/lib/resources";

export const Route = createFileRoute("/app/prazos/novo")({
  head: () => ({ meta: [{ title: "Novo prazo — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const processes = useList<any>("processes");
  const create = useCreate<any>("deadlines");

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  return (
    <RecordForm
      backTo="/app/prazos"
      backLabel="Voltar para prazos"
      eyebrow="Prazos"
      title="Novo prazo"
      description="Cadastre um prazo processual vinculado a um processo."
      submitLabel="Criar prazo"
      fields={[
        { label: "Descrição", name: "description", type: "text", required: true, full: true },
        { label: "Processo", name: "process", type: "select", options: processOptions },
        { label: "Vencimento", name: "due_date", type: "date", required: true },
        { label: "Prioridade", name: "priority", type: "select", options: [
          { value: "urgente", label: "Urgente" }, { value: "alta", label: "Alta" },
          { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" },
        ] },
        { label: "Observações", name: "notes", type: "textarea" },
      ]}
      onSubmit={async (v) => {
        if (!v.description || !v.due_date) {
          toast.error("Informe descrição e vencimento.");
          return;
        }
        try {
          await create.mutateAsync({
            description: v.description,
            process: v.process || null,
            due_date: v.due_date,
            priority: v.priority || "media",
            notes: v.notes || null,
            status: "aberto",
          });
          toast.success("Prazo criado.");
          nav({ to: "/app/prazos" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar o prazo.");
        }
      }}
    />
  );
}
