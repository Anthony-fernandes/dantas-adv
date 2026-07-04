import { createFileRoute } from "@tanstack/react-router";
import { FileStack, Upload, FolderOpen, FileText, File, Image as ImageIcon } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";

export const Route = createFileRoute("/app/documentos/")({
  head: () => ({ meta: [{ title: "Documentos — JurisFlow" }] }),
  component: DocumentosPage,
});

const docs = [
  { id: 1, nome: "Petição inicial — Aurora S.A..pdf", processo: "1023456-78.2024", size: "1.2 MB", data: "03/07/2026", tipo: "PDF" },
  { id: 2, nome: "Contestação Petro Sul.docx", processo: "0009887-11.2023", size: "480 KB", data: "02/07/2026", tipo: "DOCX" },
  { id: 3, nome: "Laudo pericial.pdf", processo: "5566778-33.2024", size: "3.4 MB", data: "01/07/2026", tipo: "PDF" },
  { id: 4, nome: "Anexo fotográfico.jpg", processo: "1023456-78.2024", size: "820 KB", data: "30/06/2026", tipo: "IMG" },
];

function DocumentosPage() {
  const iconFor = (t: string) => t === "IMG" ? ImageIcon : t === "PDF" || t === "DOCX" ? FileText : File;
  return (
    <ModuleScaffold
      eyebrow="Jurídico" title="Documentos"
      description="Gestão centralizada de documentos processuais, com controle de versões e assinatura."
      icon={FileStack}
      stats={[
        { label: "Total", value: "1.284" },
        { label: "Este mês", value: "142", tone: "info" },
        { label: "Assinaturas pendentes", value: "6", tone: "warning" },
        { label: "Armazenamento", value: "48,2 GB", tone: "success" },
      ]}
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
            <FolderOpen className="h-3.5 w-3.5" /> Nova pasta
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Upload className="h-3.5 w-3.5" /> Fazer upload
          </button>
        </>
      }
    >
      <div className="surface-card overflow-hidden">
        <ul className="divide-y divide-border">
          {docs.map((d) => {
            const Ic = iconFor(d.tipo);
            return (
              <li key={d.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary">
                  <Ic className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[13.5px]">{d.nome}</p>
                  <p className="text-[11.5px] text-muted-foreground font-mono">{d.processo}</p>
                </div>
                <span className="text-[12px] text-muted-foreground tabular-nums w-20 text-right">{d.size}</span>
                <span className="text-[12px] text-muted-foreground w-24 text-right">{d.data}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </ModuleScaffold>
  );
}