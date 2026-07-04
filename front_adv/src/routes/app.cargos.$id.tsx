import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { cargos, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/cargos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Cargo ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const rec = (cargos as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Cargo não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/cargos"
      backLabel="Voltar para cargos"
      eyebrow="Cargos"
      title={String(rec.nome)}
      subtitle={rec.nivel ? String(rec.nivel) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "Nível", value: String(rec.nivel) },
              { label: "Pessoas", value: String(rec.pessoas) },
              { label: "Salário-base", value: fmtBRL(rec.salarioBase as number) }
      ]}
    />
  );
}
