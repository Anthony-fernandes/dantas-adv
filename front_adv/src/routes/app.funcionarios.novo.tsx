import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate } from "@/lib/resources";

export const Route = createFileRoute("/app/funcionarios/novo")({
  head: () => ({ meta: [{ title: "Novo funcionário — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const create = useCreate<any>("employees");
  return (
    <RecordForm
      backTo="/app/funcionarios"
      backLabel="Voltar para funcionários"
      eyebrow="Funcionários"
      title="Novo funcionário"
      description="Cadastre um integrante da equipe do escritório."
      submitLabel="Criar funcionário"
      fields={[
        { label: "Nome completo", name: "full_name", type: "text", required: true, full: true },
        { label: "E-mail", name: "email", type: "email" },
        { label: "Telefone", name: "phone", type: "tel" },
        { label: "Data de admissão", name: "hire_date", type: "date" },
      ]}
      onSubmit={async (v) => {
        if (!v.full_name) {
          toast.error("Informe o nome completo.");
          return;
        }
        try {
          await create.mutateAsync({ full_name: v.full_name, email: v.email || null, phone: v.phone || null, hire_date: v.hire_date || null, is_active: true });
          toast.success("Funcionário cadastrado.");
          nav({ to: "/app/funcionarios" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível cadastrar o funcionário.");
        }
      }}
    />
  );
}
