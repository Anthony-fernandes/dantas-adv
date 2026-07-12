import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { contratos, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/contratos/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Contrato ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (contratos as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Contrato não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/contratos"
      backLabel="Voltar para contratos"
      eyebrow="Contratos"
      title={String(rec.numero)}
      subtitle={rec.cliente ? String(rec.cliente) : undefined}
      fields={[
              { label: "Número", value: <span className="font-mono text-[13px]">{rec.numero}</span> },
              { label: "Cliente", value: String(rec.cliente) },
              { label: "Objeto", value: String(rec.objeto) },
              { label: "Início", value: fmtDate(rec.inicio as string) },
              { label: "Fim", value: fmtDate(rec.fim as string) },
              { label: "Valor", value: fmtBRL(rec.valor as number) },
              { label: "Status", value: <StatusPill tone="info">{String(rec.status)}</StatusPill> }
      ]}
    />
  );
}
