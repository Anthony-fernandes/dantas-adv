import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Timer, AlertTriangle, Clock, CheckCircle2, Plus, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { FormDialog } from "@/components/shell/FormDialog";
import { useList, useCreate, fmtDate, daysUntil, humanize , useNovoParam } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/prazos/")({
  head: () => ({ meta: [{ title: pageTitle("Prazos") }] }),
  component: PrazosPage,
});

function isDone(status?: string | null) {
  return ["concluido", "concluída", "cumprido"].includes(String(status || "").toLowerCase());
}

function PrazosPage() {
  const deadlines = useList<any>("deadlines", { ordering: "due_date" });
  const processes = useList<any>("processes");
  const create = useCreate<any>("deadlines");
  const [open, setOpen] = useState(false);
  useNovoParam(() => setOpen(true));
  const rows = deadlines.data ?? [];

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  const sorted = useMemo(
    () =>
      [...rows]
        .filter((d) => !isDone(d.status))
        .map((d) => ({ ...d, _d: daysUntil(d.due_date) }))
        .sort((a, b) => (a._d ?? 9999) - (b._d ?? 9999)),
    [rows],
  );

  const stats = useMemo(() => {
    const active = rows.filter((d) => !isDone(d.status)).length;
    const overdue = rows.filter((d) => !isDone(d.status) && (daysUntil(d.due_date) ?? 1) < 0).length;
    const week = rows.filter((d) => {
      const dd = daysUntil(d.due_date);
      return !isDone(d.status) && dd !== null && dd >= 0 && dd <= 7;
    }).length;
    const done = rows.filter((d) => isDone(d.status)).length;
    return { active, overdue, week, done };
  }, [rows]);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Prazos"
        description="Todos os prazos processuais monitorados, com destaque para os fatais."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo prazo
          </button>
        }
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Novo prazo"
        description="Cadastre um prazo processual vinculado a um processo."
        submitLabel="Criar prazo"
        fields={[
          { label: "Descrição", name: "description", type: "text", required: true, full: true },
          { label: "Processo", name: "process", type: "select", options: processOptions },
          { label: "Vencimento", name: "due_date", type: "date", required: true },
          { label: "Prioridade", name: "priority", type: "select", options: [
            { value: "urgente", label: "Urgente" }, { value: "alta", label: "Alta" },
            { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" },
          ] },
          { label: "Observações", name: "notes", type: "textarea" },
        ]}
        onSubmit={async (v) => {
          if (!v.description || !v.due_date) {
            toast.error("Informe descrição e vencimento.");
            return;
          }
          try {
            await create.mutateAsync({
              description: v.description,
              process: v.process || null,
              due_date: v.due_date,
              priority: v.priority || "media",
              notes: v.notes || null,
              status: "aberto",
            });
            toast.success("Prazo criado.");
            setOpen(false);
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível criar o prazo.");
          }
        }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ativos" value={String(stats.active)} icon={Timer} />
        <StatCard label="Atrasados" value={String(stats.overdue)} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Vencem em 7 dias" value={String(stats.week)} icon={Clock} tone="warning" />
        <StatCard label="Concluídos" value={String(stats.done)} icon={CheckCircle2} tone="success" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Todos os prazos</h2>
        </div>
        <ul className="divide-y divide-border">
          {deadlines.isLoading && (
            <li className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>
          )}
          {!deadlines.isLoading && sorted.length === 0 && (
            <li className="px-5 py-10 text-center text-muted-foreground">Nenhum prazo em aberto.</li>
          )}
          {sorted.map((p) => {
            const dias = p._d as number | null;
            const fatal = String(p.priority || "").toLowerCase() === "urgente" || String(p.type || "").toLowerCase() === "fatal";
            const tone = dias !== null && dias < 0 ? "destructive" : dias !== null && dias <= 3 ? "warning" : "info";
            return (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition">
                <div className={`grid h-10 w-10 place-items-center rounded-md ${fatal ? "bg-destructive/12 text-destructive" : "bg-info/12 text-info"}`}>
                  <Timer className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-medium truncate">{p.description || p.title || "Prazo"}</p>
                    <StatusPill tone={fatal ? "destructive" : "muted"}>{humanize(p.priority || "média")}</StatusPill>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{p.process_number || "Processo vinculado"}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusPill tone={tone as any}>
                    {dias === null ? "—" : dias < 0 ? `${Math.abs(dias)}d em atraso` : dias === 0 ? "Hoje" : `${dias}d restantes`}
                  </StatusPill>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">Vence em {fmtDate(p.due_date)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
