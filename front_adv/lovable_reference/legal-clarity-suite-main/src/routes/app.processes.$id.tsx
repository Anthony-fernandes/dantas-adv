import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader, Badge, Tabs } from "@/components/ui-kit/PageKit";
import { FileText, Download, Share2, Calendar, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/app/processes/$id")({ component: ProcessDetail });

const timeline = [
  { d: "14 mai 2026 · 14:22", t: "Juntada de Petição de Embargos", a: "Dra. Clara Nunes", b: "Apresentada contestação tempestiva pela parte ré, anexando comprovantes de operação portuária e registros de log de 2022. Pedido de produção de prova testemunhal e pericial contábil." },
  { d: "10 mai 2026 · 09:10", t: "Despacho Interlocutório", a: "TJSP · 12ª Vara Cível", b: "Designada audiência de instrução para 22/04 às 14h30. Partes intimadas eletronicamente." },
  { d: "02 mai 2026 · 16:45", t: "Distribuição por Sorteio", a: "Sistema · DJE-SP", b: "Autuação eletrônica concluída. Vinculação ao acervo do escritório." },
  { d: "28 abr 2026 · 11:00", t: "Protocolo de Petição Inicial", a: "Dr. Marcos Vinícius", b: "Petição inicial protocolada com 14 documentos comprobatórios. Custas processuais recolhidas via guia eletrônica." },
];

const docs = [
  { n: "Contestação_Final_v3.pdf", s: "2.4 MB", d: "Ontem · 16:22", who: "Dra. Clara Nunes" },
  { n: "Parecer_Pericial.docx", s: "1.1 MB", d: "12 mai", who: "Perito Externo" },
  { n: "Procuração_Cliente.pdf", s: "240 KB", d: "02 mai", who: "Sistema" },
  { n: "Petição_Inicial.pdf", s: "3.8 MB", d: "28 abr", who: "Dr. Marcos Vinícius" },
];

function ProcessDetail() {
  const { id } = Route.useParams();
  return (
    <AppShell>
      {/* Header */}
      <div className="-mx-8 -mt-8 px-8 py-8 rule-b bg-surface mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Badge tone="dark">Contencioso Cível</Badge>
          <span className="font-mono-ui text-[11px] text-ink-soft">CNJ {id}</span>
          <Badge tone="active">Em andamento</Badge>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl">Indústria Têxtil Andradina <span className="italic text-ink-soft">v.</span> União Federal</h1>
            <p className="text-ink-soft mt-2 text-sm max-w-2xl">Ação anulatória de débito fiscal cumulada com pedido de tutela antecipada. Distribuída em 02/05/2023 perante a 12ª Vara Cível Federal de São Paulo.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 h-9 border border-rule text-xs rounded-md inline-flex items-center gap-2"><Share2 className="size-3.5" /> Compartilhar</button>
            <button className="px-3 h-9 border border-rule text-xs rounded-md inline-flex items-center gap-2"><Download className="size-3.5" /> Exportar dossiê</button>
            <button className="px-3 h-9 bg-ink text-paper text-xs uppercase tracking-widest rounded-md">Nova movimentação</button>
          </div>
        </div>
      </div>

      <Tabs items={["Resumo 360", "Andamentos", "Prazos", "Audiências", "Documentos", "Financeiro", "Histórico"]} active="Resumo 360" />

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-3 space-y-6">
          <Card>
            <CardHeader title="Partes" eyebrow="Identificação" />
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] font-mono-ui text-gold uppercase tracking-widest mb-1">Polo Ativo</div>
                <div className="text-sm font-medium">Indústria Têxtil Andradina S.A.</div>
                <div className="text-xs text-ink-soft mt-0.5">CNPJ 12.334.556/0001-90</div>
                <div className="text-xs text-ink-soft">Adv: Dr. Marcos Vinícius · OAB/SP 184.221</div>
              </div>
              <div className="rule-t pt-4">
                <div className="text-[10px] font-mono-ui text-ink-soft uppercase tracking-widest mb-1">Polo Passivo</div>
                <div className="text-sm font-medium">União Federal</div>
                <div className="text-xs text-ink-soft mt-0.5">Procuradoria da Fazenda Nacional</div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Identificação" eyebrow="Dados processuais" />
            <dl className="p-5 text-xs space-y-3">
              {[
                ["Vara", "12ª Vara Cível Federal SP"],
                ["Comarca", "São Paulo · Capital"],
                ["Distribuição", "02/05/2023"],
                ["Valor da causa", "R$ 1.240.000,00"],
                ["Honorários", "20% êxito + R$ 12k/mês"],
                ["Risco contábil", "Provável — 35%"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2"><dt className="text-ink-soft">{k}</dt><dd className="font-medium text-right">{v}</dd></div>
              ))}
            </dl>
          </Card>
        </div>

        {/* CENTER */}
        <div className="col-span-6">
          <Card>
            <CardHeader title="Timeline de andamentos" eyebrow="Movimentação processual" action={<button className="text-[11px] text-gold font-mono-ui uppercase tracking-widest">Histórico completo →</button>} />
            <div className="p-6 relative">
              <div className="absolute left-[34px] top-6 bottom-6 w-px bg-rule" />
              <div className="space-y-8">
                {timeline.map((m, i) => (
                  <div key={i} className="flex gap-5 relative">
                    <div className={`size-3 rounded-full mt-1.5 shrink-0 ml-4 ring-4 ring-surface ${i===0?"bg-gold":"bg-rule"}`} />
                    <div className="flex-1">
                      <div className="font-mono-ui text-[10px] uppercase tracking-widest text-ink-soft">{m.d}</div>
                      <div className="font-display text-lg mt-1">{m.t}</div>
                      <div className="text-[11px] text-ink-soft mt-0.5">{m.a}</div>
                      <p className="text-sm text-ink/80 mt-3 leading-relaxed">{m.b}</p>
                      <div className="flex gap-3 mt-3">
                        <button className="text-[11px] font-mono-ui uppercase tracking-widest text-ink-soft hover:text-gold">Ver peça →</button>
                        <button className="text-[11px] font-mono-ui uppercase tracking-widest text-ink-soft hover:text-gold">Adicionar nota</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="col-span-3 space-y-6">
          <div className="card-flat bg-ink text-paper p-5">
            <div className="text-[10px] font-mono-ui text-gold uppercase tracking-widest mb-3">Próxima audiência</div>
            <div className="font-display text-3xl italic">Instrução</div>
            <div className="text-sm text-paper/70 mt-2">22 mai · 14h30</div>
            <div className="text-xs text-paper/50 mt-4 rule-t border-white/10 pt-3">Sala Virtual 04 · TJSP<br/>Link enviado por e-mail</div>
            <button className="mt-4 w-full h-9 bg-gold text-white text-[11px] uppercase tracking-widest font-medium rounded">Entrar na sessão</button>
          </div>

          <Card>
            <CardHeader title="Próximos prazos" eyebrow="Agenda" />
            <div className="divide-y divide-rule">
              {[
                { d: "16", m: "MAI", t: "Réplica à contestação", h: "Hoje · 18h", tone: "danger" },
                { d: "22", m: "MAI", t: "Audiência de instrução", h: "14h30", tone: "warning" },
                { d: "30", m: "MAI", t: "Memorial finais", h: "23h59", tone: "neutral" },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`size-11 grid place-content-center rounded-sm border ${p.tone==="danger"?"bg-danger/5 border-danger/30 text-danger":p.tone==="warning"?"bg-warning/5 border-warning/30":"border-rule"}`}>
                    <div className="text-[9px] font-mono-ui">{p.m}</div>
                    <div className="font-display text-lg leading-none -mt-0.5">{p.d}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{p.t}</div>
                    <div className="text-[10px] text-ink-soft">{p.h}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Documentos" eyebrow="Recentes" action={<button className="text-[11px] text-gold font-mono-ui uppercase tracking-widest">Todos</button>} />
            <div className="divide-y divide-rule">
              {docs.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-paper">
                  <FileText className="size-4 text-ink-soft shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium truncate">{d.n}</div>
                    <div className="text-[10px] text-ink-soft">{d.s} · {d.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
