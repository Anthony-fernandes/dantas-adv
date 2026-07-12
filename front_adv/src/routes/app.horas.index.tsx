import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { FormDialog } from "@/components/shell/FormDialog";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList, useCreate, fmtBRL, fmtDate } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/horas/")({
  head: () => ({ meta: [{ title: pageTitle("Horas") }] }),
  component: HorasPage,
});

function fmtHours(v: any) {
  const n = Number(v ?? 0);
  if (!n) return "—";
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  return `${h}h${m ? ` ${m}min` : ""}`;
}

function HorasPage() {
  const entries = useList<any>("time-entries", { ordering: "-date" });
  const processes = useList<any>("processes");
  const create = useCreate<any>("time-entries");
  const [open, setOpen] = useState(false);
  const rows = entries.data ?? [];

  const processOptions = useMemo(
    () => [{ value: "", label: "Selecione…" }, ...(processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` }))],
    [processes.data],
  );

  const stats = useMemo(() => {
    const totalH = rows.reduce((s, e) => s + Number(e.hours || e.duration_hours || 0), 0);
    const faturavel = rows.filter((e) => e.billable !== false).reduce((s, e) => s + Number(e.hours || e.duration_hours || 0), 0);
    const valor = rows.reduce((s, e) => s + Number(e.amount || e.value || 0), 0);
    return { totalH, faturavel, valor };
  }, [rows]);

  return (
    <ModuleScaffold
      eyebrow="Produtividade" title="Timesheet"
      description="Lançamento e apuração de horas trabalhadas."
      icon={Clock}
      stats={[
        { label: "Total de horas", value: fmtHours(stats.totalH), tone: "info" },
        { label: "Faturáveis", value: fmtHours(stats.faturavel), tone: "success" },
        { label: "Valor apurado", value: fmtBRL(stats.valor), tone: "warning" },
      ]}
      actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Lançar horas
        </button>
      }
    >
      <FormDialog
        open={open}
        onOpenChange={setOpen}
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
            setOpen(false);
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível lançar as horas.");
          }
        }}
      />
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Data</th>
                <th className="px-4 py-2.5 text-left font-medium">Descrição</th>
                <th className="px-4 py-2.5 text-right font-medium">Horas</th>
                <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-5 py-2.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!entries.isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhum lançamento de horas.</td></tr>}
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3 font-medium">{e.description || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">{fmtHours(e.hours || e.duration_hours)}</td>
                  <td className="px-4 py-3"><StatusPill tone={e.billable !== false ? "success" : "muted"}>{e.billable !== false ? "Faturável" : "Não faturável"}</StatusPill></td>
                  <td className="px-5 py-3 text-right tabular-nums">{e.amount || e.value ? fmtBRL(e.amount || e.value) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
