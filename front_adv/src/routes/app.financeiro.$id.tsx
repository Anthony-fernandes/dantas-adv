import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { financeiro, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/financeiro/$id")({
  head: ({ params }) => ({ meta: [{ title: `Lançamento ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const rec = (financeiro as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Lançamento não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/financeiro"
      backLabel="Voltar para financeiro"
      eyebrow="Financeiro"
      title={String(rec.descricao)}
      subtitle={rec.cliente ? String(rec.cliente) : undefined}
      fields={[
              { label: "Descrição", value: String(rec.descricao) },
              { label: "Tipo", value: String(rec.tipo) },
              { label: "Cliente / Fornecedor", value: String(rec.cliente) },
              { label: "Vencimento", value: fmtDate(rec.vencimento as string) },
              { label: "Valor", value: fmtBRL(rec.valor as number) },
              { label: "Status", value: <StatusPill tone="info">{String(rec.status)}</StatusPill> }
      ]}
    />
  );
}
