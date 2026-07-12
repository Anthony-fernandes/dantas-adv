import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { usePortalGet, unwrapList } from "@/lib/portal";
import { fmtBRL, fmtDate, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/portal/contratos")({
  head: () => ({ meta: [{ title: pageTitle("Contratos — Portal do Cliente") }] }),
  component: PortalContratos,
});

function PortalContratos() {
  const contracts = usePortalGet<any>("/portal/contracts/");
  const rows = unwrapList(contracts.data);

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Meus contratos" description="Contratos ativos com o escritório." />
      {contracts.isLoading && <div className="p-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>}
      {!contracts.isLoading && rows.length === 0 && (
        <div className="surface-card p-10 text-center text-muted-foreground">Nenhum contrato disponível.</div>
      )}
      <div className="grid gap-4">
        {rows.map((c: any) => {
          const vigente = String(c.status || "").toLowerCase() === "vigente";
          return (
            <div key={c.id} className="surface-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Contrato · {humanize(c.type) || "—"}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">Contrato {humanize(c.type) || ""}</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Vigência: {fmtDate(c.start_date)}{c.end_date ? ` a ${fmtDate(c.end_date)}` : " (sem término definido)"}
                  </p>
                </div>
                <StatusPill tone={vigente ? "success" : "warning"}>{humanize(c.status) || "—"}</StatusPill>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-[12px] text-muted-foreground">Valor</span>
                <span className="font-display text-2xl font-semibold tabular-nums">{c.fixed_value != null ? fmtBRL(c.fixed_value) : c.percent != null ? `${c.percent}%` : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
