import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { nfse, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/nfse/$id")({
  head: ({ params }) => ({ meta: [{ title: `NFS-e ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const rec = (nfse as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">NFS-e não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/nfse"
      backLabel="Voltar para NFS-e"
      eyebrow="Notas fiscais"
      title={String(rec.numero)}
      subtitle={rec.cliente ? String(rec.cliente) : undefined}
      fields={[
              { label: "Número", value: <span className="font-mono text-[13px]">{rec.numero}</span> },
              { label: "Cliente", value: String(rec.cliente) },
              { label: "Emissão", value: fmtDate(rec.emissao as string) },
              { label: "Valor", value: fmtBRL(rec.valor as number) },
              { label: "Status", value: <StatusPill tone="info">{String(rec.status)}</StatusPill> }
      ]}
    />
  );
}
