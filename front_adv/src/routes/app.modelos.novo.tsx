import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate } from "@/lib/resources";

export const Route = createFileRoute("/app/modelos/novo")({
  head: () => ({ meta: [{ title: "Novo modelo — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const create = useCreate<any>("legal-templates");
  return (
    <RecordForm
      backTo="/app/modelos"
      backLabel="Voltar para modelos"
      eyebrow="Modelos de documento"
      title="Novo modelo"
      description="Crie um modelo reutilizável com variáveis dinâmicas."
      submitLabel="Criar modelo"
      fields={[
        { label: "Nome do modelo", name: "name", type: "text", required: true, full: true },
        { label: "Categoria", name: "category", type: "select", options: ["peticao", "contrato", "parecer", "procuracao", "notificacao", "geral"] },
        { label: "Formato", name: "format", type: "select", options: ["docx", "pdf", "html"] },
        { label: "Conteúdo (variáveis: {{cliente}}, {{processo}})", name: "content", type: "textarea", required: true, full: true },
      ]}
      onSubmit={async (v) => {
        if (!v.name || !v.content) {
          toast.error("Informe nome e conteúdo do modelo.");
          return;
        }
        try {
          await create.mutateAsync({ name: v.name, category: v.category, format: v.format, content: v.content, version: 1 });
          toast.success("Modelo criado.");
          nav({ to: "/app/modelos" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar o modelo.");
        }
      }}
    />
  );
}
