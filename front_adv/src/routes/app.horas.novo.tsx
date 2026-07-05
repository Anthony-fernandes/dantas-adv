import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate, useList } from "@/lib/resources";

export const Route = createFileRoute("/app/horas/novo")({
  head: () => ({ meta: [{ title: "Novo apontamento — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const processes = useList<any>("processes");
  const create = useCreate<any>("time-entries");

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  return (
    <RecordForm
      backTo="/app/horas"
      backLabel="Voltar para horas"
      eyebrow="Horas trabalhadas"
      title="Novo apontamento"
      description="Lance horas trabalhadas, opcionalmente vinculadas a um processo."
      submitLabel="Lançar horas"
      fields={[
        { label: "Data", name: "date", type: "date", required: true },
        { label: "Processo", name: "process", type: "select", options: processOptions },
        { label: "Descrição", name: "description", type: "text", required: true, full: true },
        { label: "Horas", name: "hours", type: "number", required: true },
        { label: "Faturável", name: "billable", type: "select", options: [{ value: "true", label: "Sim" }, { value: "false", label: "Não" }] },
        { label: "Valor (R$)", name: "amount", type: "money" },
      ]}
      onSubmit={async (v) => {
        if (!v.date || !v.description || !v.hours) {
          toast.error("Informe data, descrição e horas.");
          return;
        }
        try {
          await create.mutateAsync({
            date: v.date,
            process: v.process || null,
            description: v.description,
            hours: Number(v.hours),
            billable: v.billable !== "false",
            amount: v.amount ? Number(v.amount) : null,
          });
          toast.success("Horas lançadas.");
          nav({ to: "/app/horas" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível lançar as horas.");
        }
      }}
    />
  );
}
