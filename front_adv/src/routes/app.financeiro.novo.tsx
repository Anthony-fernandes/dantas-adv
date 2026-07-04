import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/financeiro/novo")({
  head: () => ({ meta: [{ title: "Novo lançamento — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/financeiro"
      backLabel="Voltar para financeiro"
      eyebrow="Financeiro"
      title="Novo lançamento"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/financeiro" })}
      fields={[
          { label: "Descrição", name: "descricao", type: "text", required: true },
          { label: "Tipo", name: "tipo", type: "select", required: true, options: ["Receber","Pagar"] },
          { label: "Cliente / Fornecedor", name: "cliente", type: "text", required: true },
          { label: "Vencimento", name: "vencimento", type: "date", required: true },
          { label: "Valor (R$)", name: "valor", type: "money", required: true },
          { label: "Categoria", name: "categoria", type: "select", options: ["Honorário","Sucumbência","Custas","Aluguel","Salário","Outros"] },
          { label: "Observações", name: "obs", type: "textarea" }
      ]}
    />
  );
}
