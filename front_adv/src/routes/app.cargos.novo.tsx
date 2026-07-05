import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate } from "@/lib/resources";

export const Route = createFileRoute("/app/cargos/novo")({
  head: () => ({ meta: [{ title: "Novo cargo — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const create = useCreate<any>("job-positions");
  return (
    <RecordForm
      backTo="/app/cargos"
      backLabel="Voltar para cargos"
      eyebrow="Cargos"
      title="Novo cargo"
      description="Cadastre um cargo do escritório."
      submitLabel="Criar cargo"
      fields={[
        { label: "Nome do cargo", name: "name", type: "text", required: true, full: true },
        { label: "Descrição", name: "description", type: "textarea" },
      ]}
      onSubmit={async (v) => {
        if (!v.name) {
          toast.error("Informe o nome do cargo.");
          return;
        }
        try {
          await create.mutateAsync({ name: v.name, description: v.description || null, is_active: true });
          toast.success("Cargo criado.");
          nav({ to: "/app/cargos" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar o cargo.");
        }
      }}
    />
  );
}
