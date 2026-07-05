import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Scale, MapPin, Loader2 } from "lucide-react";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, useList, fmtBRL, fmtDateTime, humanize } from "@/lib/resources";

export const Route = createFileRoute("/portal/processos/$id")({
  head: () => ({ meta: [{ title: `Processo — Portal do Cliente` }, { name: "robots", content: "noindex" }] }),
  component: PortalProcessoDetalhe,
});

function linkedTo(item: any, id: string) {
  return String(item.process || item.process_id || "") === id;
}

function PortalProcessoDetalhe() {
  const { id } = useParams({ from: "/portal/processos/$id" });
  const { data: p, isLoading } = useDetail<any>("processes", id);
  const movements = useList<any>("movements", { ordering: "-date" });
  const relMov = useMemo(() => (movements.data ?? []).filter((m) => linkedTo(m, id)), [movements.data, id]);

  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!p) return <div className="p-10 text-center text-muted-foreground">Processo não encontrado.</div>;

  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8 space-y-6">
      <Link to="/portal/processos" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Meus processos
      </Link>

      <div className="surface-card p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Scale className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Processo · {p.area || "—"}</p>
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{p.cnj || "Sem CNJ"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[p.court_division, p.court].filter(Boolean).join(" · ") || "—"}</span>
              <span>Fase: {humanize(p.phase)}</span>
              <span className="font-medium text-foreground">{fmtBRL(p.cause_value)}</span>
              <StatusPill tone="info">{p.status || "—"}</StatusPill>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4"><h2 className="text-[15px] font-semibold">Andamentos</h2></div>
        <div className="p-6">
          {relMov.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-[13px]">Sem andamentos publicados.</p>
          ) : (
            <ol className="relative border-l-2 border-border ml-3 space-y-6">
              {relMov.map((e) => (
                <li key={e.id} className="ml-4">
                  <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{fmtDateTime(e.date || e.created_at)}</p>
                  <p className="mt-0.5 font-medium text-[13.5px]">{e.title || e.type || "Andamento"}</p>
                  <p className="text-[13px] text-muted-foreground">{e.description || e.content || ""}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
