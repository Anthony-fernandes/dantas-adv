import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader, FilterBar, FilterChip } from "@/components/ui-kit/PageKit";
import { Search, Upload, FolderOpen, FileText, Eye, Share2, History } from "lucide-react";

export const Route = createFileRoute("/app/documents")({ component: Documents });

const docs = [
  { n: "Contestação_Final_v3.pdf", proc: "1002345-82.2023", who: "Dra. Clara Nunes", v: 3, d: "Hoje · 14:22", s: "2.4 MB", t: "Petição" },
  { n: "Parecer_Pericial_Contabil.docx", proc: "5012003-90.2024", who: "Perito Externo", v: 1, d: "Ontem · 18:08", s: "1.1 MB", t: "Parecer" },
  { n: "Procuração_Andradina.pdf", proc: "1002345-82.2023", who: "Sistema", v: 2, d: "12 mai", s: "240 KB", t: "Procuração" },
  { n: "Contrato_Honorários_4421.pdf", proc: "—", who: "Dr. Daniel Marques", v: 4, d: "10 mai", s: "880 KB", t: "Contrato" },
  { n: "Memorial_Finais_v2.docx", proc: "0044290-15.2023", who: "Dr. André Salles", v: 2, d: "08 mai", s: "640 KB", t: "Petição" },
];

function Documents() {
  return (
    <AppShell eyebrow="Jurídico · Documentos" title="Central de documentos" actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Upload className="size-3.5" /> Upload</button>}>
      <FilterBar>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
          <input placeholder="Nome do documento, processo, autor..." className="w-full bg-surface border border-rule rounded-md pl-9 pr-3 h-9 text-[13px]" />
        </div>
        <FilterChip active>Todos · 8.412</FilterChip>
        <FilterChip>Petições</FilterChip>
        <FilterChip>Contratos</FilterChip>
        <FilterChip>Pareceres</FilterChip>
        <FilterChip>Procurações</FilterChip>
      </FilterBar>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card>
            <CardHeader title="Pastas" eyebrow="Organização" />
            <div className="p-2">
              {[
                { n: "Por Cliente", c: 240 },
                { n: "Por Processo", c: 1284 },
                { n: "Por Área", c: 6 },
                { n: "Modelos & Templates", c: 88 },
                { n: "Compartilhados com Cliente", c: 412 },
                { n: "Lixeira", c: 12 },
              ].map((f, i) => (
                <button key={i} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded hover:bg-paper ${i===1?"bg-paper":""}`}>
                  <FolderOpen className="size-4 text-ink-soft" />
                  <span className="flex-1 text-left">{f.n}</span>
                  <span className="text-[11px] text-ink-soft font-mono-ui">{f.c}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="col-span-8">
          <CardHeader title="Arquivos recentes" eyebrow="Por processo" />
          <table className="table-editorial">
            <thead><tr><th>Arquivo</th><th>Processo</th><th>Tipo</th><th>Versão</th><th>Modificado</th><th></th></tr></thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-ink-soft" />
                      <div>
                        <div className="font-medium text-[13px]">{d.n}</div>
                        <div className="text-[10px] text-ink-soft font-mono-ui">{d.s} · {d.who}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono-ui text-[11px] text-ink-soft">{d.proc}</td>
                  <td className="text-xs">{d.t}</td>
                  <td><span className="font-mono-ui text-[11px] bg-surface-2 px-1.5 py-0.5 rounded">v{d.v}</span></td>
                  <td className="text-xs text-ink-soft">{d.d}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-1 text-ink-soft">
                      <button className="size-7 grid place-items-center hover:bg-paper rounded"><Eye className="size-3.5" /></button>
                      <button className="size-7 grid place-items-center hover:bg-paper rounded"><Share2 className="size-3.5" /></button>
                      <button className="size-7 grid place-items-center hover:bg-paper rounded"><History className="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}
