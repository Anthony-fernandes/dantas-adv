import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/usuarios/novo")({
  head: () => ({ meta: [{ title: "Novo usuário — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/usuarios"
      backLabel="Voltar para usuários"
      eyebrow="Usuários"
      title="Novo usuário"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/usuarios" })}
      fields={[
          { label: "Nome", name: "nome", type: "text", required: true },
          { label: "E-mail", name: "email", type: "email", required: true },
          { label: "Papel", name: "papel", type: "select", required: true, options: ["Admin","Advogado","Estagiário","Financeiro","Visualizador"] },
          { label: "Status", name: "status", type: "select", required: true, options: ["Ativo","Inativo"] }
      ]}
    />
  );
}
