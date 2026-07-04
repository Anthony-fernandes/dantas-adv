import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/honorarios/novo")({
  head: () => ({ meta: [{ title: "Novo honorário — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/honorarios"
      backLabel="Voltar para honorários"
      eyebrow="Honorários"
      title="Novo honorário"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/honorarios" })}
      fields={[
          { label: "Cliente", name: "cliente", type: "text", required: true },
          { label: "Tipo", name: "tipo", type: "select", required: true, options: ["Contratual","Êxito","Consultoria","Sucumbência"] },
          { label: "Valor (R$)", name: "valor", type: "money", required: true },
          { label: "Vencimento", name: "vencimento", type: "date", required: true },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
