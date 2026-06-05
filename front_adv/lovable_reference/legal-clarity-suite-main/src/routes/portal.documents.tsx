import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/shells/PortalShell";
import { Card } from "@/components/ui-kit/PageKit";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/portal/documents")({ component: PortalDocs });

const docs = [
  ["Contestação_Final.pdf", "Andradina v. União", "Hoje", "2.4 MB"],
  ["Parecer_Pericial.pdf", "v. Fazenda Nacional", "12 mai", "1.1 MB"],
  ["Procuração.pdf", "Andradina v. União", "02 mai", "240 KB"],
  ["Contrato_Honorários.pdf", "Geral", "10 mai", "880 KB"],
];

function PortalDocs() {
  return (
    <PortalShell eyebrow="Portal" title="Documentos compartilhados">
      <Card>
        <table className="table-editorial">
          <thead><tr><th>Arquivo</th><th>Processo</th><th>Compartilhado</th><th></th></tr></thead>
          <tbody>{docs.map((d, i) => (
            <tr key={i}>
              <td><div className="flex items-center gap-3"><FileText className="size-4 text-ink-soft" /><div><div className="font-medium text-[13px]">{d[0]}</div><div className="text-[10px] text-ink-soft font-mono-ui">{d[3]}</div></div></div></td>
              <td className="text-ink-soft">{d[1]}</td>
              <td className="text-xs text-ink-soft">{d[2]}</td>
              <td className="text-right"><button className="size-7 grid place-items-center hover:bg-paper rounded text-ink-soft inline-flex"><Download className="size-3.5" /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
