import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { FormDialog } from "@/components/shell/FormDialog";
import { useList, useUpdate, useCreate, fmtDate, humanize , useNovoParam } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/tarefas/")({
  head: () => ({ meta: [{ title: pageTitle("Tarefas") }] }),
  component: TarefasPage,
});

function prioTone(p?: string | null) {
  const s = String(p || "").toLowerCase();
  if (s === "urgente" || s === "alta") return "destructive";
  if (s === "media") return "warning";
  return "muted";
}

function TarefasPage() {
  const tasks = useList<any>("tasks");
  const processes = useList<any>("processes");
  const update = useUpdate<any>("tasks");
  const create = useCreate<any>("tasks");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  useNovoParam(() => setOpen(true));
  const rows = tasks.data ?? [];

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  const filtered = useMemo(
    () => rows.filter((t) => statusFilter === "all" || String(t.status).toLowerCase() === statusFilter),
    [rows, statusFilter],
  );

  const stats = useMemo(() => ({
    pend: rows.filter((t) => String(t.status).toLowerCase() === "pendente").length,
    prog: rows.filter((t) => String(t.status).toLowerCase() === "em_andamento").length,
    done: rows.filter((t) => String(t.status).toLowerCase() === "concluida").length,
    total: rows.length,
  }), [rows]);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Produtividade"
        title="Tarefas"
        description="Tarefas do escritório, por processo e responsável."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Nova tarefa
          </button>
        }
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Nova tarefa"
        description="Crie uma tarefa e vincule opcionalmente a um processo."
        submitLabel="Criar tarefa"
        fields={[
          { label: "Título", name: "title", type: "text", required: true, full: true },
          { label: "Processo", name: "process", type: "select", options: processOptions },
          { label: "Prioridade", name: "priority", type: "select", required: true, options: [
            { value: "urgente", label: "Urgente" }, { value: "alta", label: "Alta" },
            { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" },
          ] },
          { label: "Vencimento", name: "due_date", type: "date" },
          { label: "Descrição", name: "description", type: "textarea" },
        ]}
        onSubmit={async (v) => {
          if (!v.title) {
            toast.error("Informe o título da tarefa.");
            return;
          }
          try {
            await create.mutateAsync({
              title: v.title,
              process: v.process || null,
              priority: v.priority || "media",
              due_date: v.due_date || null,
              description: v.description || null,
              status: "pendente",
            });
            toast.success("Tarefa criada.");
            setOpen(false);
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível criar a tarefa.");
          }
        }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(stats.total)} />
        <StatCard label="Pendentes" value={String(stats.pend)} tone="warning" />
        <StatCard label="Em andamento" value={String(stats.prog)} tone="info" />
        <StatCard label="Concluídas" value={String(stats.done)} tone="success" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">Todas as tarefas</h2>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-[13px]">
            <option value="all">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="w-10 px-5 py-2.5"></th>
                <th className="px-4 py-2.5 text-left font-medium">Tarefa</th>
                <th className="px-4 py-2.5 text-left font-medium">Prioridade</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.isLoading && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!tasks.isLoading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhuma tarefa.</td></tr>
              )}
              {filtered.map((t) => {
                const done = String(t.status).toLowerCase() === "concluida";
                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => update.mutate({ id: String(t.id), status: done ? "pendente" : "concluida" })}
                        className={`grid h-5 w-5 place-items-center rounded-md border ${done ? "bg-success text-success-foreground border-success" : "border-border bg-background"}`}
                      >
                        {done && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                      {t.description && <p className="text-[11.5px] text-muted-foreground truncate max-w-[360px]">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusPill tone={prioTone(t.priority) as any}>{humanize(t.priority || "média")}</StatusPill></td>
                    <td className="px-4 py-3"><StatusPill tone={done ? "success" : String(t.status).toLowerCase() === "em_andamento" ? "info" : "muted"}>{humanize(t.status)}</StatusPill></td>
                    <td className="px-5 py-3 text-muted-foreground">{fmtDate(t.due_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
