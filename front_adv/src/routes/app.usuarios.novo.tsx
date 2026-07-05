import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/usuarios/novo")({
  head: () => ({ meta: [{ title: "Novo usuário — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const { activeTenantId } = useAuth();
  return (
    <RecordForm
      backTo="/app/usuarios"
      backLabel="Voltar para usuários"
      eyebrow="Usuários"
      title="Convidar usuário"
      description="Envie um convite de acesso ao escritório."
      submitLabel="Enviar convite"
      fields={[
        { label: "Nome", name: "full_name", type: "text", required: true },
        { label: "E-mail", name: "email", type: "email", required: true },
        { label: "Perfil", name: "role", type: "select", required: true, options: [
          { value: "ADMIN", label: "Administrador" }, { value: "LAWYER", label: "Advogado(a)" },
          { value: "ASSISTANT", label: "Assistente" }, { value: "FINANCE", label: "Financeiro" },
        ] },
      ]}
      onSubmit={async (v) => {
        if (!v.email) {
          toast.error("Informe o e-mail do convidado.");
          return;
        }
        if (!activeTenantId) {
          toast.error("Selecione um escritório antes de convidar.");
          return;
        }
        try {
          await api.post(`/tenants/${activeTenantId}/invite/`, {
            email: v.email,
            full_name: v.full_name || "",
            role: v.role,
            roles: [v.role],
          });
          toast.success("Convite enviado.");
          nav({ to: "/app/usuarios" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível enviar o convite.");
        }
      }}
    />
  );
}
