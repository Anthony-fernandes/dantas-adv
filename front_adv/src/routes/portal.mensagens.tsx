import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { Send } from "lucide-react";

export const Route = createFileRoute("/portal/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — Portal" }] }),
  component: PortalMsg,
});

function PortalMsg() {
  const msgs = [
    { m: "Bom dia! Enviei a documentação solicitada para o processo trabalhista.", me: true, t: "09:12" },
    { m: "Obrigada, recebemos. Vamos analisar hoje e retornar até amanhã.", me: false, t: "09:35", au: "Dra. Marina Souza" },
    { m: "Perfeito. Sobre a audiência do dia 10, precisarei estar presente?", me: true, t: "09:40" },
    { m: "Sim, sua presença é essencial. Enviaremos as orientações por e-mail.", me: false, t: "10:02", au: "Dra. Marina Souza" },
  ];
  return (
    <div className="mx-auto max-w-[900px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Mensagens" description="Converse diretamente com sua equipe jurídica." />
      <div className="surface-card flex flex-col min-h-[560px]">
        <div className="border-b border-border p-5">
          <p className="text-[14px] font-semibold">Equipe JurisFlow</p>
          <p className="text-[11.5px] text-muted-foreground">Dra. Marina Souza · Dr. Ricardo Lima</p>
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.me ? "justify-end" : ""}`}>
              <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-[13.5px] ${m.me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!m.me && m.au && <p className="text-[11px] font-semibold text-accent mb-0.5">{m.au}</p>}
                <p>{m.m}</p>
                <p className={`mt-1 text-[10.5px] ${m.me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.t}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-3 flex items-center gap-2">
          <input placeholder="Digite sua mensagem…" className="h-11 flex-1 rounded-md border border-input bg-background px-3.5 text-[13.5px]" />
          <button className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}