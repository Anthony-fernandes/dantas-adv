import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { modelos, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/modelos/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Modelo ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (modelos as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Modelo não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/modelos"
      backLabel="Voltar para modelos"
      eyebrow="Modelos de documento"
      title={String(rec.nome)}
      subtitle={rec.area ? String(rec.area) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "Área", value: String(rec.area) },
              { label: "Usos", value: String(rec.uso) },
              { label: "Atualizado", value: fmtDate(rec.atualizado as string) },
              { label: "Autor", value: String(rec.autor) }
      ]}
    />
  );
}
