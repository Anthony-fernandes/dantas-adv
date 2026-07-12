import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { audiencias, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/audiencias/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Audiência ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (audiencias as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Audiência não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/audiencias"
      backLabel="Voltar para audiências"
      eyebrow="Audiências"
      title={String(rec.tipo)}
      subtitle={rec.processo ? String(rec.processo) : undefined}
      fields={[
              { label: "Tipo", value: String(rec.tipo) },
              { label: "Processo", value: <span className="font-mono text-[13px]">{rec.processo}</span> },
              { label: "Data", value: fmtDate(rec.data as string) },
              { label: "Hora", value: String(rec.hora) },
              { label: "Fórum", value: String(rec.forum) },
              { label: "Cidade", value: String(rec.cidade) },
              { label: "Modalidade", value: String(rec.modalidade) },
              { label: "Responsável", value: String(rec.responsavel) }
      ]}
    />
  );
}
