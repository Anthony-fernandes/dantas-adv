import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { funcionarios, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/funcionarios/$id")({
  head: ({ params }) => ({ meta: [{ title: pageTitle(`Funcionário ${params.id}`) }] }),
  loader: ({ params }) => {
    const rec = (funcionarios as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Funcionário não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/funcionarios"
      backLabel="Voltar para funcionários"
      eyebrow="Funcionários"
      title={String(rec.nome)}
      subtitle={rec.cargo ? String(rec.cargo) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "Cargo", value: String(rec.cargo) },
              { label: "E-mail", value: String(rec.email) },
              { label: "OAB", value: <span className="font-mono text-[13px]">{rec.oab}</span> },
              { label: "Ingresso", value: fmtDate(rec.ingresso as string) }
      ]}
    />
  );
}
