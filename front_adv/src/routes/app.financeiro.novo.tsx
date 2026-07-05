import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate, useList, clientName } from "@/lib/resources";

export const Route = createFileRoute("/app/financeiro/novo")({
  head: () => ({ meta: [{ title: "Novo lançamento — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const clients = useList<any>("clients");
  const createReceber = useCreate<any>("accounts-receivable", ["accounts-payable"]);
  const createPagar = useCreate<any>("accounts-payable", ["accounts-receivable"]);

  const clientOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(clients.data ?? []).map((c) => ({ value: String(c.id), label: clientName(c) }))],
    [clients.data],
  );

  return (
    <RecordForm
      backTo="/app/financeiro"
      backLabel="Voltar para financeiro"
      eyebrow="Financeiro"
      title="Novo lançamento"
      description="Registre uma conta a receber ou a pagar."
      submitLabel="Criar lançamento"
      fields={[
        { label: "Tipo", name: "kind", type: "select", required: true, options: [{ value: "receber", label: "A receber" }, { value: "pagar", label: "A pagar" }] },
        { label: "Descrição", name: "description", type: "text", required: true, full: true },
        { label: "Cliente", name: "client", type: "select", options: clientOptions },
        { label: "Valor (R$)", name: "amount", type: "money", required: true },
        { label: "Vencimento", name: "due_date", type: "date", required: true },
        { label: "Status", name: "status", type: "select", options: [
          { value: "aberto", label: "Em aberto" }, { value: "pago", label: "Pago" }, { value: "vencido", label: "Vencido" },
        ] },
      ]}
      onSubmit={async (v) => {
        if (!v.description || !v.amount || !v.due_date) {
          toast.error("Informe descrição, valor e vencimento.");
          return;
        }
        try {
          const payload: Record<string, unknown> = {
            description: v.description,
            client: v.client || null,
            amount: Number(v.amount),
            due_date: v.due_date,
            status: v.status || "aberto",
          };
          if (v.kind === "pagar") await createPagar.mutateAsync(payload);
          else await createReceber.mutateAsync(payload);
          toast.success("Lançamento criado.");
          nav({ to: "/app/financeiro" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível criar o lançamento.");
        }
      }}
    />
  );
}
