import { createFileRoute, notFound } from "@tanstack/react-router";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { usuarios, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/usuarios/$id")({
  head: ({ params }) => ({ meta: [{ title: `Usuário ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const rec = (usuarios as any[]).find((x) => x.id === params.id);
    if (!rec) throw notFound();
    return { rec };
  },
  component: Detail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Usuário não encontrado.</div>
  ),
});

function Detail() {
  const { rec } = Route.useLoaderData() as { rec: any };
  return (
    <RecordDetail
      backTo="/app/usuarios"
      backLabel="Voltar para usuários"
      eyebrow="Usuários"
      title={String(rec.nome)}
      subtitle={rec.email ? String(rec.email) : undefined}
      fields={[
              { label: "Nome", value: String(rec.nome) },
              { label: "E-mail", value: String(rec.email) },
              { label: "Papel", value: String(rec.papel) },
              { label: "MFA", value: String(rec.mfa) },
              { label: "Último acesso", value: String(rec.ultimoAcesso) },
              { label: "Status", value: <StatusPill tone="info">{String(rec.status)}</StatusPill> }
      ]}
    />
  );
}
