import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: pageTitle("Chat") }] }),
  component: ChatPage,
});

function ChatPage() {
  const conv = [
    { m: "Boa tarde, Marina. O laudo pericial já foi juntado no processo da Aurora.", me: false, t: "14:22" },
    { m: "Ótimo. Vou analisar hoje ainda. A contestação está pronta?", me: true, t: "14:25" },
    { m: "Está em revisão final. Envio à noite.", me: false, t: "14:26" },
  ];
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Produtividade" title="Chat interno" description="Comunicação da equipe por processo e por cliente." />
      <div className="surface-card grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[560px] overflow-hidden">
        <aside className="border-r border-border">
          <div className="p-4 border-b border-border">
            <input placeholder="Buscar conversa…" className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]" />
          </div>
          <ul className="divide-y divide-border">
            {[
              { n: "Ricardo Lima", u: "está em revisão final…", t: "14:26", unread: 0 },
              { n: "André Palma", u: "Preciso do parecer até…", t: "13:12", unread: 2 },
              { n: "Luísa Prado", u: "Cliente enviou docs.", t: "11:04", unread: 0 },
              { n: "Equipe Aurora", u: "Reunião amanhã 9h", t: "Ontem", unread: 0 },
            ].map((c, i) => (
              <li key={i} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 ${i === 0 ? "bg-muted/60" : ""}`}>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/8 text-primary text-[11px] font-semibold">
                  {c.n.split(" ").map(x => x[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{c.n}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{c.u}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] text-muted-foreground">{c.t}</p>
                  {c.unread > 0 && <span className="mt-1 inline-block h-4 min-w-4 rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">{c.unread}</span>}
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <section className="flex flex-col">
          <div className="border-b border-border px-5 py-3.5">
            <p className="text-[14px] font-semibold">Ricardo Lima</p>
            <p className="text-[11.5px] text-muted-foreground font-mono">1023456-78.2024.8.26.0100</p>
          </div>
          <div className="flex-1 space-y-3 p-5 overflow-y-auto">
            {conv.map((c, i) => (
              <div key={i} className={`flex ${c.me ? "justify-end" : ""}`}>
                <div className={`max-w-[70%] rounded-lg px-3.5 py-2 text-[13px] ${c.me ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <p>{c.m}</p>
                  <p className={`mt-1 text-[10.5px] ${c.me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{c.t}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3 flex items-center gap-2">
            <input placeholder="Digitar mensagem…" className="h-10 flex-1 rounded-md border border-input bg-background px-3.5 text-[13px]" />
            <button className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"><Send className="h-4 w-4" /></button>
          </div>
        </section>
      </div>
    </div>
  );
}