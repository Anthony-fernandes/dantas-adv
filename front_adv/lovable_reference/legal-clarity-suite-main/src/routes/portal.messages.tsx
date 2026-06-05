import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/shells/PortalShell";
import { Card } from "@/components/ui-kit/PageKit";
import { Send } from "lucide-react";

export const Route = createFileRoute("/portal/messages")({ component: PortalMsg });

const thread = [
  { who: "Dra. Helena Vasconcellos", side: "them", time: "10:22", text: "Bom dia, Mariana. A réplica foi protocolada hoje. Em anexo a peça final." },
  { who: "Você", side: "me", time: "10:38", text: "Obrigada, doutora. Posso confirmar o teor com a diretoria antes da audiência?" },
  { who: "Dra. Helena Vasconcellos", side: "them", time: "11:02", text: "Claro. Vou agendar uma call para sexta às 15h se for conveniente." },
];

function PortalMsg() {
  return (
    <PortalShell eyebrow="Portal" title="Mensagens">
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
        <Card className="col-span-4 overflow-y-auto">
          <div className="divide-y divide-rule">
            {[
              { n: "Dra. Helena Vasconcellos", l: "Vou agendar uma call para...", t: "11:02", a: true },
              { n: "Dr. Marcos Vinícius", l: "Sobre o memorial...", t: "ontem" },
              { n: "Financeiro", l: "Lembrete de fatura #4422", t: "12 mai" },
            ].map((c, i) => (
              <button key={i} className={`w-full text-left p-4 hover:bg-paper ${c.a?"bg-paper":""}`}>
                <div className="flex justify-between text-xs"><span className="font-semibold">{c.n}</span><span className="text-ink-soft font-mono-ui">{c.t}</span></div>
                <div className="text-xs text-ink-soft mt-1 truncate">{c.l}</div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="col-span-8 flex flex-col">
          <div className="px-5 py-4 rule-b"><div className="font-display text-lg">Dra. Helena Vasconcellos</div><div className="text-xs text-ink-soft">Sócia · Cível</div></div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {thread.map((m, i) => (
              <div key={i} className={`flex ${m.side==="me"?"justify-end":"justify-start"}`}>
                <div className={`max-w-md ${m.side==="me"?"bg-ink text-paper":"bg-paper border border-rule"} rounded-md px-4 py-2.5`}>
                  <div className="text-sm leading-relaxed">{m.text}</div>
                  <div className={`text-[10px] mt-1 font-mono-ui ${m.side==="me"?"text-paper/50":"text-ink-soft"}`}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rule-t p-4 flex gap-2">
            <input placeholder="Escreva uma mensagem..." className="flex-1 h-10 px-3 bg-surface border border-rule rounded text-sm" />
            <button className="size-10 bg-ink text-paper rounded grid place-items-center"><Send className="size-4" /></button>
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
