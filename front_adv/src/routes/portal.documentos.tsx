import { createFileRoute } from "@tanstack/react-router";
import { FileStack, Download, FileText, Image as ImageIcon, File } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";

export const Route = createFileRoute("/portal/documentos")({
  head: () => ({ meta: [{ title: "Documentos — Portal" }] }),
  component: PortalDocs,
});

const docs = [
  { n: "Petição inicial — 1023456.pdf", d: "03/07/2026", size: "1.2 MB", t: "PDF" },
  { n: "Contrato de honorários.pdf", d: "01/07/2026", size: "480 KB", t: "PDF" },
  { n: "Procuração assinada.pdf", d: "28/06/2026", size: "320 KB", t: "PDF" },
  { n: "Anexo fotográfico.jpg", d: "25/06/2026", size: "2.1 MB", t: "IMG" },
];

function PortalDocs() {
  return (
    <ModuleScaffold eyebrow="Portal" title="Documentos" description="Documentos disponibilizados pelo escritório para você." icon={FileStack}
      stats={[{ label: "Total", value: "128" }, { label: "Recentes", value: "8", tone: "info" }, { label: "Aguardando assinatura", value: "1", tone: "warning" }, { label: "Assinados", value: "42", tone: "success" }]}
    >
      <div className="surface-card overflow-hidden">
        <ul className="divide-y divide-border">
          {docs.map((d, i) => {
            const Ic = d.t === "IMG" ? ImageIcon : d.t === "PDF" ? FileText : File;
            return (
              <li key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/8 text-primary"><Ic className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[13.5px]">{d.n}</p>
                  <p className="text-[11.5px] text-muted-foreground">{d.d}</p>
                </div>
                <span className="text-[12px] text-muted-foreground w-20 text-right">{d.size}</span>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12px] hover:bg-muted transition">
                  <Download className="h-3.5 w-3.5" /> Baixar
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </ModuleScaffold>
  );
}