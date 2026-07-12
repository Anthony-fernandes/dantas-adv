import { createFileRoute, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { RecordDetail } from "@/components/shell/RecordScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useDetail, fmtBRL, fmtDate, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";
import { apiDownload } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/documentos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Documento") }] }),
  component: Detail,
});

function Detail() {
  const { id } = useParams({ from: "/app/documentos/$id" });
  const { data: rec, isLoading } = useDetail<any>("documents", id);
  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!rec) return <div className="p-10 text-center text-muted-foreground">Registro não encontrado.</div>;
  return (
    <RecordDetail
      backTo="/app/documentos"
      backLabel="Voltar para documentos"
      eyebrow="Documentos"
      title={String(rec.title || rec.name || "Documento")}
      status={rec.status ? String(rec.status) : undefined}
      fields={[
        { label: "Título", value: rec.title || rec.name || "—" },
        { label: "Categoria", value: humanize(rec.category) },
        { label: "Processo", value: <span className="font-mono text-[13px]">{rec.process_number || rec.process || "—"}</span> },
        { label: "Cliente", value: rec.client_name || rec.client || "—" },
        { label: "Enviado em", value: fmtDateTime(rec.created_at) },
        { label: "Arquivo", value: rec.file_download_url ? <button className="text-primary hover:underline" onClick={() => apiDownload(rec.file_download_url, rec.filename || rec.title || "documento").catch((e: any) => toast.error(e?.detail || "Falha no download."))}>Baixar arquivo</button> : "—" },
      ]}
    />
  );
}
