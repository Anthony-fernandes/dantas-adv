import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shell/PageHeader";
import { usePortalGet, unwrapList, usePortalSendMessage } from "@/lib/portal";
import { fmtDateTime } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/portal/mensagens")({
  head: () => ({ meta: [{ title: pageTitle("Mensagens — Portal do Cliente") }] }),
  component: PortalMsg,
});

function PortalMsg() {
  const messages = usePortalGet<any>("/portal/messages/");
  const send = usePortalSendMessage();
  const [text, setText] = useState("");
  const msgs = unwrapList(messages.data);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    try {
      await send.mutateAsync(content);
      setText("");
    } catch (err: any) {
      toast.error(err?.detail || "Não foi possível enviar a mensagem.");
    }
  }

  return (
    <div className="mx-auto max-w-[900px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Mensagens" description="Converse diretamente com sua equipe jurídica." />
      <div className="surface-card flex flex-col min-h-[560px]">
        <div className="border-b border-border p-5">
          <p className="text-[14px] font-semibold">Equipe do escritório</p>
        </div>
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {messages.isLoading && <p className="py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>}
          {!messages.isLoading && msgs.length === 0 && <p className="py-10 text-center text-[13px] text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>}
          {msgs.map((m: any) => {
            const me = m.sender === "CLIENT";
            return (
              <div key={m.id} className={`flex ${me ? "justify-end" : ""}`}>
                <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-[13.5px] ${me ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {!me && m.sender_name && <p className="text-[11px] font-semibold text-accent mb-0.5">{m.sender_name}</p>}
                  <p>{m.content}</p>
                  <p className={`mt-1 text-[10.5px] ${me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{fmtDateTime(m.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={submit} className="border-t border-border p-3 flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite sua mensagem…" className="h-11 flex-1 rounded-md border border-input bg-background px-3.5 text-[13.5px]" />
          <button type="submit" disabled={send.isPending} aria-label="Enviar mensagem" className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
