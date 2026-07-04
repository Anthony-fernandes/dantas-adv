import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { honorarios, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/honorarios/$id")({
  head: ({ params }) => ({ meta: [{ title: `Honorário ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const rec = (honorarios as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Honorário não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/honorarios"
      backLabel="Voltar para honorários"
      eyebrow="Honorários"
      title={String(rec.cliente)}
      subtitle={rec.tipo ? String(rec.tipo) : undefined}
      fields={[
              { label: "Cliente", value: String(rec.cliente) },
              { label: "Tipo", value: String(rec.tipo) },
              { label: "Valor", value: fmtBRL(rec.valor as number) },
              { label: "Vencimento", value: fmtDate(rec.vencimento as string) },
              { label: "Status", value: <StatusPill tone="info">{String(rec.status)}</StatusPill> }
      ]}
    />
  );
}
