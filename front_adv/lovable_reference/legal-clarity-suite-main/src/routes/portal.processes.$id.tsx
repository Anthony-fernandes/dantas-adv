import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/shells/PortalShell";
import { Card, CardHeader, Badge, Tabs } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/portal/processes/$id")({ component: PortalProcessDetail });

function PortalProcessDetail() {
  const { id } = Route.useParams();
  return (
    <PortalShell>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3"><Badge tone="active">Em andamento</Badge><span className="font-mono-ui text-[11px] text-ink-soft">CNJ {id}</span></div>
        <h1 className="font-display text-4xl">Indústria Andradina v. União Federal</h1>
        <p className="text-ink-soft mt-2 text-sm">Ação anulatória de débito fiscal. Acompanhada por Dra. Helena Vasconcellos.</p>
      </div>
      <Tabs items={["Resumo", "Andamentos", "Documentos", "Mensagens"]} active="Resumo" />
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader title="Linha do tempo" eyebrow="Movimentações recentes" />
          <div className="p-6 relative">
            <div className="absolute left-[20px] top-6 bottom-6 w-px bg-rule" />
            <div className="space-y-7">
              {[
                { d: "14 mai 2026", t: "Réplica à contestação protocolada", b: "A peça foi protocolada com sucesso. Próximo passo: aguardar designação de audiência de instrução." },
                { d: "10 mai 2026", t: "Despacho do juiz", b: "O magistrado deferiu a produção de prova pericial contábil." },
                { d: "02 mai 2026", t: "Distribuição do processo", b: "Vinculação ao acervo do escritório concluída." },
              ].map((m, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`size-3 rounded-full mt-1.5 ml-2 ${i===0?"bg-gold":"bg-rule"} ring-4 ring-surface shrink-0`} />
                  <div>
                    <div className="font-mono-ui text-[10px] uppercase tracking-widest text-ink-soft">{m.d}</div>
                    <div className="font-medium mt-1">{m.t}</div>
                    <p className="text-sm text-ink-soft mt-1 leading-relaxed">{m.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Próxima audiência" eyebrow="Calendário" />
          <div className="p-6">
            <div className="font-display text-3xl">22 mai · 14h30</div>
            <div className="text-sm text-ink-soft mt-1">Audiência de instrução</div>
            <div className="rule-t mt-4 pt-4 text-xs text-ink-soft">TJSP-Federal · Sala 04<br/>Modalidade virtual</div>
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
