import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { FileStack, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { usePortalGet, unwrapList } from "@/lib/portal";
import { api, apiDownload } from "@/lib/api";
import { fmtDate } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/portal/documentos")({
  head: () => ({ meta: [{ title: pageTitle("Documentos — Portal do Cliente") }] }),
  component: PortalDocs,
});

function fmtSize(bytes?: number | null) {
  const n = Number(bytes || 0);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function PortalDocs() {
  const processes = usePortalGet<any>("/portal/processes/");
  const procs = unwrapList(processes.data);

  // Documentos por processo do cliente (endpoints do portal, escopo por cliente).
  const docQueries = useQueries({
    queries: procs.map((p: any) => ({
      queryKey: ["portal", "process-docs", String(p.id)],
      queryFn: () => api.get<any>(`/portal/processes/${p.id}/documents/`),
      enabled: procs.length > 0,
    })),
  });

  const loading = processes.isLoading || docQueries.some((q) => q.isLoading);
  const docs = docQueries.flatMap((q, i) =>
    unwrapList(q.data).map((d: any) => ({ ...d, _proc: procs[i] })),
  ).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  return (
    <ModuleScaffold eyebrow="Portal" title="Documentos" description="Documentos disponibilizados pelo escritório para você." icon={FileStack}
      stats={[{ label: "Total", value: loading ? "…" : String(docs.length) }]}
    >
      <div className="surface-card overflow-hidden">
        <ul className="divide-y divide-border">
          {loading && <li className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></li>}
          {!loading && docs.length === 0 && <li className="px-5 py-10 text-center text-muted-foreground">Nenhum documento disponível.</li>}
          {docs.map((d: any) => (
            <li key={d.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary"><FileText className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[13.5px]">{d.title || d.filename || "Documento"}</p>
                <p className="text-[11.5px] text-muted-foreground">{fmtDate(d.created_at)} · {d._proc?.cnj || d._proc?.title || ""}</p>
              </div>
              <span className="text-[12px] text-muted-foreground w-20 text-right">{fmtSize(d.file_size)}</span>
              {d.download_url && (
                <button
                  onClick={() => apiDownload(d.download_url, d.filename || d.title || "documento").catch((e: any) => toast.error(e?.detail || "Falha no download."))}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-muted transition"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </ModuleScaffold>
  );
}
