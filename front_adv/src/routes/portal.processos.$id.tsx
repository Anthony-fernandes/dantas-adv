import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Scale, FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/shell/PageHeader";
import { usePortalGet, unwrapList } from "@/lib/portal";
import { fmtDateTime, fmtDate, humanize } from "@/lib/resources";
import { apiDownload } from "@/lib/api";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/portal/processos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Processo — Portal do Cliente") }, { name: "robots", content: "noindex" }] }),
  component: PortalProcessoDetalhe,
});

function PortalProcessoDetalhe() {
  const { id } = useParams({ from: "/portal/processos/$id" });
  const proc = usePortalGet<any>(`/portal/processes/${id}/`);
  const movements = usePortalGet<any>(`/portal/processes/${id}/movements/`);
  const documents = usePortalGet<any>(`/portal/processes/${id}/documents/`);

  const p = proc.data;
  if (proc.isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!p) return <div className="p-10 text-center text-muted-foreground">Processo não encontrado.</div>;

  const movs = unwrapList(movements.data);
  const docs = unwrapList(documents.data);

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
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{p.cnj || p.title || "Processo"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
              <span>Fase: {humanize(p.phase)}</span>
              <StatusPill tone="info">{humanize(p.status) || "—"}</StatusPill>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-card overflow-hidden lg:col-span-2">
          <div className="border-b border-border px-5 py-4"><h2 className="text-[15px] font-semibold">Andamentos</h2></div>
          <div className="p-6">
            {movements.isLoading && <p className="py-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>}
            {!movements.isLoading && movs.length === 0 && <p className="py-6 text-center text-muted-foreground text-[13px]">Sem andamentos publicados.</p>}
            {movs.length > 0 && (
              <ol className="relative border-l-2 border-border ml-3 space-y-6">
                {movs.map((e: any) => (
                  <li key={e.id} className="ml-4">
                    <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{fmtDateTime(e.date || e.created_at)}</p>
                    <p className="mt-0.5 font-medium text-[13.5px]">{humanize(e.type) || "Andamento"}</p>
                    <p className="text-[13px] text-muted-foreground">{e.description || ""}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-5 py-4"><h2 className="text-[15px] font-semibold">Documentos</h2></div>
          <ul className="divide-y divide-border">
            {documents.isLoading && <li className="px-5 py-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>}
            {!documents.isLoading && docs.length === 0 && <li className="px-5 py-6 text-center text-[12.5px] text-muted-foreground">Nenhum documento disponível.</li>}
            {docs.map((d: any) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium">{d.title || d.filename || "Documento"}</p>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(d.created_at)}</p>
                </div>
                {d.download_url && (
                  <button
                    aria-label="Baixar documento"
                    onClick={() => apiDownload(d.download_url, d.filename || d.title || "documento").catch((e: any) => toast.error(e?.detail || "Falha no download."))}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
