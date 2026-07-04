import { createFileRoute } from "@tanstack/react-router";
import { Plus, MoreHorizontal } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { tarefas, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/tarefas/")({
  head: () => ({ meta: [{ title: "Tarefas — JurisFlow" }] }),
  component: TarefasPage,
});

function TarefasPage() {
  const cols = [
    { key: "A fazer", tone: "muted" as const },
    { key: "Em andamento", tone: "info" as const },
    { key: "Concluída", tone: "success" as const },
  ];
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Produtividade"
        title="Tarefas"
        description="Fluxo Kanban de tarefas do escritório, por processo e responsável."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Nova tarefa
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cols.map((col) => {
          const items = tarefas.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="surface-card p-4 min-h-[480px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusPill tone={col.tone}>{col.key}</StatusPill>
                  <span className="text-[12px] text-muted-foreground tabular-nums">{items.length}</span>
                </div>
                <button className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <div key={t.id} className="rounded-md border border-border bg-background p-3 hover:shadow-[var(--shadow-card)] transition cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium leading-snug">{t.titulo}</p>
                      <button className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-muted shrink-0"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{t.processo}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <StatusPill tone={t.prioridade === "Alta" ? "destructive" : t.prioridade === "Média" ? "warning" : "muted"}>{t.prioridade}</StatusPill>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{fmtDate(t.vencimento)}</span>
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                          {t.responsavel.split(" ").slice(-1)[0][0]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}