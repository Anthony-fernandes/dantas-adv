import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { empresas, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/empresas/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Empresa ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (empresas as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Empresa não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/empresas"
      backLabel="Voltar para empresas"
      eyebrow="Empresas"
      title={String(rec.nome)}
      subtitle={rec.cnpj ? String(rec.cnpj) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "CNPJ", value: <span className="font-mono text-[13px]">{rec.cnpj}</span> },
              { label: "Cidade", value: String(rec.cidade) },
              { label: "Usuários", value: String(rec.usuarios) },
              { label: "Plano", value: String(rec.plano) }
      ]}
    />
  );
}
