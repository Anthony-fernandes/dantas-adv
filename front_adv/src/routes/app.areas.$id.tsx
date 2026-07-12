import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { areas, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/areas/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Área ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (areas as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Área não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/areas"
      backLabel="Voltar para áreas"
      eyebrow="Áreas de atuação"
      title={String(rec.nome)}
      subtitle={rec.responsavel ? String(rec.responsavel) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "Processos", value: String(rec.processos) },
              { label: "Responsável", value: String(rec.responsavel) }
      ]}
    />
  );
}
