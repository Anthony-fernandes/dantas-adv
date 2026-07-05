import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { RecordForm } from "@/components/shell/RecordScaffold";
import { useCreate, useList } from "@/lib/resources";

export const Route = createFileRoute("/app/audiencias/novo")({
  head: () => ({ meta: [{ title: "Nova audiência — JurisFlow" }] }),
  component: Novo,
});

function Novo() {
  const nav = useNavigate();
  const processes = useList<any>("processes");
  const create = useCreate<any>("hearings");

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  return (
    <RecordForm
      backTo="/app/audiencias"
      backLabel="Voltar para audiências"
      eyebrow="Audiências"
      title="Nova audiência"
      description="Agende uma audiência vinculada a um processo."
      submitLabel="Agendar audiência"
      fields={[
        { label: "Tipo", name: "type", type: "select", required: true, options: ["Instrução", "Conciliação", "Una", "Julgamento"] },
        { label: "Processo", name: "process", type: "select", options: processOptions },
        { label: "Data e hora", name: "hearing_date", type: "text", required: true, placeholder: "AAAA-MM-DD HH:MM" },
        { label: "Local / Fórum", name: "location", type: "text" },
        { label: "Modalidade", name: "modality", type: "select", required: true, options: ["Presencial", "Virtual", "Híbrida"] },
        { label: "Link online", name: "online_link", type: "text" },
        { label: "Observações", name: "notes", type: "textarea" },
      ]}
      onSubmit={async (v) => {
        if (!v.type || !v.hearing_date) {
          toast.error("Informe tipo e data/hora.");
          return;
        }
        try {
          await create.mutateAsync({
            type: v.type,
            process: v.process || null,
            hearing_date: v.hearing_date.replace(" ", "T"),
            location: v.location || null,
            modality: v.modality,
            online_link: v.online_link || null,
            notes: v.notes || null,
            status: "agendada",
          });
          toast.success("Audiência agendada.");
          nav({ to: "/app/audiencias" });
        } catch (err: any) {
          toast.error(err?.detail || "Não foi possível agendar a audiência.");
        }
      }}
    />
  );
}
