import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { contratos, fmtBRL, fmtDate } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/portal/contratos")({
  head: () => ({ meta: [{ title: pageTitle("Contratos — Portal do Cliente") }] }),
  component: PortalContratos,
});

function PortalContratos() {
  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Meus contratos" description="Contratos ativos com o escritório." />
      <div className="grid gap-4">
        {contratos.filter((c) => c.cliente.includes("Aurora")).map((c) => (
          <div key={c.id} className="surface-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{c.numero}</p>
                <h3 className="mt-1 font-display text-xl font-semibold">{c.objeto}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">Vigência: {fmtDate(c.inicio)} a {fmtDate(c.fim)}</p>
              </div>
              <StatusPill tone={c.status === "Ativo" ? "success" : "warning"}>{c.status}</StatusPill>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-[12px] text-muted-foreground">Valor anual</span>
              <span className="font-display text-2xl font-semibold tabular-nums">{fmtBRL(c.valor)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}