import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { horas, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/horas/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Apontamento ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (horas as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Apontamento não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/horas"
      backLabel="Voltar para horas"
      eyebrow="Horas trabalhadas"
      title={String(rec.atividade)}
      subtitle={rec.cliente ? String(rec.cliente) : undefined}
      fields={[
              { label: "Data", value: fmtDate(rec.data as string) },
              { label: "Advogado", value: String(rec.advogado) },
              { label: "Cliente", value: String(rec.cliente) },
              { label: "Atividade", value: String(rec.atividade) },
              { label: "Horas", value: String(rec.horas) },
              { label: "Valor", value: fmtBRL(rec.valor as number) }
      ]}
    />
  );
}
