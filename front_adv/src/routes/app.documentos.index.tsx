import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileStack, Upload, FileText, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { DocumentoDialog } from "@/components/shell/DocumentoDialog";
import { useList, fmtDate } from "@/lib/resources";

export const Route = createFileRoute("/app/documentos/")({
  head: () => ({ meta: [{ title: "Documentos — JurisFlow" }] }),
  component: DocumentosPage,
});

function fmtSize(bytes?: number | null) {
  const n = Number(bytes || 0);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function DocumentosPage() {
  const documents = useList<any>("documents", { ordering: "-created_at" });
  const [open, setOpen] = useState(false);
  const rows = documents.data ?? [];

  const stats = useMemo(() => ({
    total: rows.length,
    restritos: rows.filter((d) => String(d.access_level).toUpperCase() === "ROLES").length,
  }), [rows]);

  return (
    <ModuleScaffold
      eyebrow="Jurídico" title="Documentos"
      description="Gestão centralizada de documentos processuais."
      icon={FileStack}
      stats={[
        { label: "Total", value: String(stats.total) },
        { label: "Restritos", value: String(stats.restritos), tone: "warning" },
      ]}
      actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Upload className="h-3.5 w-3.5" /> Novo documento
        </button>
      }
    >
      <DocumentoDialog open={open} onOpenChange={setOpen} />
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Documento</th>
                <th className="px-4 py-2.5 text-left font-medium">Categoria</th>
                <th className="px-4 py-2.5 text-right font-medium">Tamanho</th>
                <th className="px-5 py-2.5 text-left font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.isLoading && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!documents.isLoading && rows.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Nenhum documento cadastrado.</td></tr>
              )}
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/8 text-primary"><FileText className="h-4 w-4" /></span>
                      <span className="font-medium truncate max-w-[360px]">{d.title || d.filename || "Documento"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{d.category || "geral"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{fmtSize(d.file_size)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
