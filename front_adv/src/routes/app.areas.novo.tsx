import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate } from "@/lib/resources";

export const Route = createFileRoute("/app/areas/novo")({
  head: () => ({ meta: [{ title: "Nova área — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const create = useCreate<any>("causes");
  return (
    <RecordForm
      backTo="/app/areas"
      backLabel="Voltar para áreas"
      eyebrow="Áreas de atuação"
      title="Nova área"
      description="Cadastre uma área do direito atendida pelo escritório."
      submitLabel="Criar área"
      fields={[
        { label: "Nome da área", name: "name", type: "text", required: true, full: true },
        { label: "Código", name: "area", type: "text", placeholder: "ex.: civel" },
      ]}
      onSubmit={async (v) => {
        if (!v.name) {
          toast.error("Informe o nome da área.");
          return;
        }
        try {
          await create.mutateAsync({ name: v.name, area: v.area || v.name.toLowerCase(), is_active: true });
          toast.success("Área criada.");
          nav({ to: "/app/areas" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar a área.");
        }
      }}
    />
  );
}
