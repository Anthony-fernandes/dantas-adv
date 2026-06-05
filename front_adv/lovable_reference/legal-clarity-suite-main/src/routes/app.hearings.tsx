import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader, Badge } from "@/components/ui-kit/PageKit";
import { useState } from "react";

export const Route = createFileRoute("/app/hearings")({ component: Hearings });

const list = [
  { id: 0, d: "16", m: "MAI", t: "Conciliação", proc: "Cunha v. TechCorp", time: "09:00", court: "TJSP · Sala Virtual 02", who: "Dra. Helena Vasconcellos", tone: "warning" },
  { id: 1, d: "22", m: "MAI", t: "Instrução", proc: "Andradina v. União", time: "14:30", court: "TJSP-Federal · Sala 04", who: "Dr. Marcos Vinícius", tone: "active" },
  { id: 2, d: "28", m: "MAI", t: "Julgamento", proc: "Banco Aurora v. Fintech", time: "10:00", court: "TJ-RJ · 12ª Câmara", who: "Dra. Clara Nunes", tone: "neutral" },
  { id: 3, d: "04", m: "JUN", t: "Una", proc: "Sindicato Têxtil v. Andradina", time: "13:30", court: "TRT-2 · Sala 11", who: "Dr. André Salles", tone: "neutral" },
];

function Hearings() {
  const [sel, setSel] = useState(1);
  const h = list[sel];
  return (
    <AppShell eyebrow="Jurídico · Audiências" title="Pauta de audiências">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-4 h-fit sticky top-24">
          <CardHeader title="Próximas audiências" eyebrow="Pauta" />
          <div className="divide-y divide-rule">
            {list.map((it, i) => (
              <button key={it.id} onClick={() => setSel(i)} className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-paper ${i===sel?"bg-paper":""}`}>
                <div className="size-12 grid place-content-center border border-rule rounded-sm shrink-0">
                  <div className="text-[9px] font-mono-ui text-ink-soft text-center">{it.m}</div>
                  <div className="font-display text-xl text-center leading-none">{it.d}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{it.t} · {it.time}</div>
                  <div className="text-[11px] text-ink-soft truncate">{it.proc}</div>
                </div>
                <Badge tone={it.tone as any}>{it.tone === "warning" ? "Hoje" : it.tone === "active" ? "Próxima" : "Agendada"}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card className="col-span-8">
          <CardHeader title={`${h.t} · ${h.proc}`} eyebrow={`${h.d} ${h.m} · ${h.time}`} action={<button className="px-3 h-8 bg-ink text-paper text-[11px] uppercase tracking-widest rounded">Entrar na sessão</button>} />
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <div className="eyebrow mb-2">Local</div>
              <div className="text-sm">{h.court}</div>
              <div className="text-xs text-ink-soft mt-1">Link enviado por e-mail · senha: 4421</div>
            </div>
            <div>
              <div className="eyebrow mb-2">Responsável</div>
              <div className="text-sm">{h.who}</div>
              <div className="text-xs text-ink-soft mt-1">+ Dr. André Salles (apoio)</div>
            </div>
            <div className="col-span-2 rule-t pt-6">
              <div className="eyebrow mb-3">Roteiro / Estratégia</div>
              <ol className="text-sm space-y-2 list-decimal pl-5 text-ink/85 leading-relaxed">
                <li>Sustentar nulidade da CDA por insuficiência de fundamentação.</li>
                <li>Apresentar planilhas de recolhimento incontroverso (anexo 14).</li>
                <li>Pleitear realização de prova pericial contábil.</li>
                <li>Reservar 5 min para considerações finais.</li>
              </ol>
            </div>
            <div className="col-span-2 rule-t pt-6">
              <div className="eyebrow mb-3">Documentos vinculados</div>
              <div className="grid grid-cols-2 gap-2">
                {["Contestação_v3.pdf", "Planilhas_Anexo_14.xlsx", "Súmulas_de_apoio.pdf", "Procuração.pdf"].map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-rule rounded text-xs">
                    <div className="size-7 bg-surface-2 grid place-items-center rounded text-[9px] font-mono-ui">PDF</div>
                    <span className="flex-1 truncate">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
