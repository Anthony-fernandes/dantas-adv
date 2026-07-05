import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate, useList, clientName } from "@/lib/resources";

export const Route = createFileRoute("/app/contratos/novo")({
  head: () => ({ meta: [{ title: "Novo contrato — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const clients = useList<any>("clients");
  const create = useCreate<any>("contracts");

  const clientOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(clients.data ?? []).map((c) => ({ value: String(c.id), label: clientName(c) }))],
    [clients.data],
  );

  return (
    <RecordForm
      backTo="/app/contratos"
      backLabel="Voltar para contratos"
      eyebrow="Contratos"
      title="Novo contrato"
      description="Cadastre um contrato de honorários vinculado a um cliente."
      submitLabel="Criar contrato"
      fields={[
        { label: "Cliente", name: "client", type: "select", options: clientOptions, full: true },
        { label: "Tipo", name: "type", type: "select", required: true, options: [
          { value: "fixo", label: "Honorário fixo" }, { value: "percentual", label: "Percentual" },
          { value: "exito", label: "Êxito" }, { value: "hora", label: "Por hora" }, { value: "retainer", label: "Retainer mensal" },
        ] },
        { label: "Valor (R$)", name: "fixed_value", type: "money" },
        { label: "Status", name: "status", type: "select", required: true, options: [
          { value: "vigente", label: "Vigente" }, { value: "suspenso", label: "Suspenso" }, { value: "encerrado", label: "Encerrado" },
        ] },
        { label: "Início", name: "start_date", type: "date", required: true },
        { label: "Fim", name: "end_date", type: "date" },
      ]}
      onSubmit={async (v) => {
        if (!v.client || !v.start_date) {
          toast.error("Informe cliente e data de início.");
          return;
        }
        try {
          await create.mutateAsync({
            client: v.client,
            type: v.type,
            fixed_value: v.fixed_value ? Number(v.fixed_value) : null,
            status: v.status,
            start_date: v.start_date,
            end_date: v.end_date || null,
          });
          toast.success("Contrato criado.");
          nav({ to: "/app/contratos" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar o contrato.");
        }
      }}
    />
  );
}
