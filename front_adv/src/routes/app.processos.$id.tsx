import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Scale, MapPin, Briefcase, Clock, FileText, Users, Wallet, MessageSquare, Edit3, Plus, Gavel, CheckCircle2 } from "lucide-react";
import { StatusPill, StatCard } from "@/components/shell/PageHeader";
import { processos, prazos, audiencias, financeiro, tarefas, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/processos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Processo ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const processo = processos.find((p) => p.id === params.id);
    if (!processo) throw notFound();
    return { processo };
  },
  component: ProcessoDetalhe,
  notFoundComponent: () => <div className="p-10 text-center text-muted-foreground">Processo não encontrado.</div>,
});

const TABS = ["Andamentos", "Partes", "Prazos", "Audiências", "Documentos", "Financeiro", "Tarefas"] as const;

const fases = ["Petição inicial", "Contestação", "Instrução", "Sentença", "Recurso", "Arquivado"];

function ProcessoDetalhe() {
  const { processo: p } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Andamentos");
  const relPrazos = prazos.filter((x) => x.processo === p.numero);
  const relAud = audiencias.filter((x) => x.processo === p.numero);
  const relFin = financeiro.filter((x) => x.cliente.startsWith(p.cliente.split(" ")[0]));
  const relTar = tarefas.filter((x) => x.processo === p.numero);
  const idxFase = Math.max(0, fases.indexOf(p.fase));

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <Link to="/app/processos" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para processos
      </Link>

      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Processo · {p.area}</p>
              <h1 className="font-mono text-2xl font-semibold tracking-tight">{p.numero}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.cliente}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.vara}</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {p.responsavel}</span>
                <StatusPill tone={p.status === "Em andamento" ? "info" : p.status === "Suspenso" ? "warning" : p.status === "Novo" ? "success" : "muted"}>{p.status}</StatusPill>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[13px] hover:bg-muted"><MessageSquare className="h-3.5 w-3.5" /> Notificar cliente</button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"><Edit3 className="h-3.5 w-3.5" /> Editar</button>
          </div>
        </div>

        {/* Progress bar of phases */}
        <div className="mt-6">
          <div className="flex items-center">
            {fases.map((f, i) => {
              const done = i <= idxFase;
              return (
                <div key={f} className="flex-1 flex items-center">
                  <div className={`grid h-7 w-7 place-items-center rounded-full border-2 text-[11px] font-semibold ${done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Valor da causa" value={fmtBRL(p.valor)} tone="info" />
        <StatCard label="Prazos abertos" value={String(relPrazos.length)} tone="warning" />
        <StatCard label="Audiências" value={String(relAud.length)} tone="info" />
        <StatCard label="Último andamento" value={p.ultimoAndamento} />
      </div>

      <div className="surface-card">
        <div className="flex items-center gap-1 border-b border-border px-4 pt-3 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative rounded-t-md px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {tab === "Andamentos" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">Timeline processual — sincronizado com tribunal.</p>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Novo andamento</button>
            </div>
            <ol className="relative border-l-2 border-border ml-3 space-y-6">
              {[
                { d: "01/07/2026 · 14:22", t: "Juntada de petição — Manifestação do autor", desc: "Autor manifestou-se sobre o laudo pericial, requerendo esclarecimentos.", tone: "info" as const },
                { d: "28/06/2026 · 09:00", t: "Laudo pericial juntado aos autos", desc: "Perito nomeado apresentou laudo com 42 páginas.", tone: "success" as const },
                { d: "15/06/2026 · 11:40", t: "Decisão interlocutória", desc: "Deferida a produção de prova pericial. Nomeado perito e fixado prazo.", tone: "warning" as const },
                { d: "02/06/2026 · 16:12", t: "Contestação protocolada pela ré", desc: "Ré apresentou preliminares e contestação de mérito.", tone: "muted" as const },
                { d: "10/05/2026 · 09:00", t: "Distribuição do processo", desc: `Distribuído por sorteio à ${p.vara}.`, tone: "default" as const },
              ].map((e) => (
                <li key={e.d} className="ml-4">
                  <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{e.d}</p>
                  <p className="mt-0.5 font-medium text-[13.5px]">{e.t}</p>
                  <p className="text-[13px] text-muted-foreground">{e.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === "Partes" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
            {[
              { papel: "Autor", nome: p.cliente, doc: "12.345.678/0001-90", adv: "Dra. Marina Souza — OAB/SP 234.567" },
              { papel: "Ré", nome: "Contraparte Empresarial Ltda.", doc: "88.777.666/0001-55", adv: "Dr. Carlos Menezes — OAB/SP 145.909" },
              { papel: "Perito", nome: "Eng. Roberto Andrade", doc: "CPF 111.222.333-44", adv: "—" },
              { papel: "Ministério Público", nome: "Promotoria de Justiça Cível", doc: "—", adv: "Dra. Paula Vinhas" },
            ].map((prt) => (
              <div key={prt.papel} className="surface-card p-5">
                <div className="flex items-center justify-between">
                  <StatusPill tone={prt.papel === "Autor" ? "success" : prt.papel === "Ré" ? "destructive" : "info"}>{prt.papel}</StatusPill>
                  <button className="text-[12px] text-muted-foreground hover:text-foreground">Editar</button>
                </div>
                <p className="mt-3 font-semibold">{prt.nome}</p>
                <p className="text-[12.5px] text-muted-foreground">{prt.doc}</p>
                <p className="mt-2 text-[12.5px]"><span className="text-muted-foreground">Advogado(a): </span>{prt.adv}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "Prazos" && <SimpleList empty="Sem prazos vinculados." rows={relPrazos.map((d) => ({ title: d.titulo, sub: `Vence em ${fmtDate(d.vencimento)} · ${d.tipo}`, right: <StatusPill tone={d.status === "Atrasado" ? "destructive" : d.status === "Urgente" ? "warning" : "info"}>{d.status}</StatusPill> }))} />}
        {tab === "Audiências" && <SimpleList empty="Sem audiências." rows={relAud.map((a) => ({ title: `${a.tipo} — ${fmtDate(a.data)} às ${a.hora}`, sub: `${a.forum} · ${a.modalidade}`, right: <StatusPill tone={a.modalidade === "Virtual" ? "info" : "default"}>{a.modalidade}</StatusPill> }))} />}

        {tab === "Documentos" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">Peças e documentos anexados.</p>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Anexar</button>
            </div>
            <div className="grid gap-2">
              {["Petição inicial.pdf", "Procuração.pdf", "Contestação.pdf", "Laudo pericial.pdf", "Réplica.pdf"].map((f) => (
                <div key={f} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-[13px]">
                  <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {f}</span>
                  <span className="text-[11.5px] text-muted-foreground">1,4 MB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Financeiro" && <SimpleList empty="Sem lançamentos." rows={relFin.map((f) => ({ title: f.descricao, sub: `Vence ${fmtDate(f.vencimento)}`, right: <span className="tabular-nums font-medium">{fmtBRL(f.valor)}</span> }))} />}
        {tab === "Tarefas" && <SimpleList empty="Sem tarefas." rows={relTar.map((t) => ({ title: t.titulo, sub: `${t.responsavel} · vence ${fmtDate(t.vencimento)}`, right: <StatusPill tone={t.status === "Concluída" ? "success" : t.status === "Em andamento" ? "info" : "muted"}>{t.status}</StatusPill> }))} />}
      </div>
    </div>
  );
}

function SimpleList({ rows, empty }: { rows: { title: string; sub: string; right?: React.ReactNode }[]; empty: string }) {
  if (rows.length === 0) return <p className="p-10 text-center text-muted-foreground text-[13px]">{empty}</p>;
  return (
    <ul className="divide-y divide-border">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20">
          <div><p className="font-medium text-[13.5px]">{r.title}</p><p className="text-[12.5px] text-muted-foreground">{r.sub}</p></div>
          {r.right}
        </li>
      ))}
    </ul>
  );
}