import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RecordForm } from "@/components/shell/RecordScaffold";

export const Route = createFileRoute("/app/nfse/novo")({
  head: () => ({ meta: [{ title: "Novo nfs-e — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  return (
    <RecordForm
      backTo="/app/nfse"
      backLabel="Voltar para NFS-e"
      eyebrow="Notas fiscais"
      title="Novo nfs-e"
      description="Preencha os campos para criar um novo registro."
      onSubmit={() => nav({ to: "/app/nfse" })}
      fields={[
          { label: "Número", name: "numero", type: "text" },
          { label: "Cliente", name: "cliente", type: "text", required: true },
          { label: "Emissão", name: "emissao", type: "date", required: true },
          { label: "Valor (R$)", name: "valor", type: "money", required: true },
          { label: "Descrição do serviço", name: "descricao", type: "textarea", required: true }
      ]}
    />
  );
}
