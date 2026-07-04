import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Scale, MapPin, CheckCircle2, MessageSquare, FileText } from "lucide-react";
import { StatusPill } from "@/components/shell/PageHeader";
import { processos, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/portal/processos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Processo — Portal do Cliente` }, { name: "robots", content: "noindex" }] }),
  loader: ({ params }) => {
    const p = processos.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return { p };
  },
  component: PortalProcessoDetalhe,
  notFoundComponent: () => <div className="p-10 text-center text-muted-foreground">Processo não encontrado.</div>,
});

const fases = ["Petição inicial", "Contestação", "Instrução", "Sentença", "Recurso", "Arquivado"];

function PortalProcessoDetalhe() {
  const { p } = Route.useLoaderData();
  const idxFase = Math.max(0, fases.indexOf(p.fase));
  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8 space-y-6">
      <Link to="/portal/processos" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Meus processos
      </Link>

      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Scale className="h-6 w-6" /></div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{p.area}</p>
              <h1 className="font-mono text-2xl font-semibold">{p.numero}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.vara}</span>
                <span>Valor: <strong className="text-foreground">{fmtBRL(p.valor)}</strong></span>
                <StatusPill tone="info">{p.status}</StatusPill>
              </div>
            </div>
          </div>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
            <MessageSquare className="h-3.5 w-3.5" /> Falar com meu advogado
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center">
            {fases.map((f, i) => {
              const done = i <= idxFase;
              return (
                <div key={f} className="flex-1 flex items-center">
                  <div className={`grid h-7 w-7 place-items-center rounded-full border-2 text-[11px] font-semibold ${done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</div>
                  {i < fases.length - 1 && <div className={`h-0.5 flex-1 ${i < idxFase ? "bg-primary" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10.5px] uppercase tracking-wider text-muted-foreground">
            {fases.map((f) => <span key={f} className="flex-1 text-center">{f}</span>)}
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-4">Últimas atualizações</p>
        <ol className="relative border-l-2 border-border ml-3 space-y-6">
          {[
            { d: "01/07/2026", t: "Manifestação do autor protocolada", desc: "Petição enviada em resposta ao laudo pericial." },
            { d: "28/06/2026", t: "Laudo pericial disponibilizado", desc: "Documento anexado ao processo para análise." },
            { d: "15/06/2026", t: "Perícia deferida pelo juiz", desc: "Perito nomeado para exame técnico." },
          ].map((e) => (
            <li key={e.d} className="ml-4">
              <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{e.d}</p>
              <p className="mt-0.5 font-medium">{e.t}</p>
              <p className="text-[13px] text-muted-foreground">{e.desc}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="surface-card p-6">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-4">Documentos disponíveis</p>
        <div className="grid gap-2">
          {["Petição inicial.pdf", "Laudo pericial.pdf", "Comprovante protocolo.pdf"].map((f) => (
            <div key={f} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-[13px]">
              <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {f}</span>
              <button className="text-[12.5px] text-primary hover:underline">Baixar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}