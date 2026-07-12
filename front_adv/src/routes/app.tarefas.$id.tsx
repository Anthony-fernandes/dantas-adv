import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { tarefas, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/tarefas/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Tarefa ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (tarefas as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Tarefa não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/tarefas"
      backLabel="Voltar para tarefas"
      eyebrow="Tarefas"
      title={String(rec.titulo)}
      subtitle={rec.processo ? String(rec.processo) : undefined}
      fields={[
              { label: "Título", value: String(rec.titulo) },
              { label: "Processo", value: <span className="font-mono text-[13px]">{rec.processo}</span> },
              { label: "Prioridade", value: String(rec.prioridade) },
              { label: "Vencimento", value: fmtDate(rec.vencimento as string) },
              { label: "Responsável", value: String(rec.responsavel) },
              { label: "Status", value: <StatusPill tone="info">{String(rec.status)}</StatusPill> }
      ]}
    />
  );
}
