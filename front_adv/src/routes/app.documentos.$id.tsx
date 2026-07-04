import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { documentos, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/documentos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Documento ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const rec = (documentos as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Documento não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/documentos"
      backLabel="Voltar para documentos"
      eyebrow="Documentos"
      title={String(rec.nome)}
      subtitle={rec.processo ? String(rec.processo) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "Tipo", value: String(rec.tipo) },
              { label: "Processo", value: <span className="font-mono text-[13px]">{rec.processo}</span> },
              { label: "Cliente", value: String(rec.cliente) },
              { label: "Tamanho", value: String(rec.tamanho) },
              { label: "Autor", value: String(rec.autor) },
              { label: "Data", value: fmtDate(rec.data as string) }
      ]}
    />
  );
}
