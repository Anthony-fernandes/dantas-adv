import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, Briefcase, FileText, Wallet, MessageSquare, Edit3, MoreHorizontal, Plus } from "lucide-react";
import { StatusPill, StatCard } from "@/components/shell/PageHeader";
import { clientes, processos, contratos, financeiro, fmtBRL, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/clientes/$id")({
  head: ({ params }) => ({ meta: [{ title: `Cliente ${params.id} — JurisFlow` }] }),
  loader: ({ params }) => {
    const cliente = clientes.find((c) => c.id === params.id);
    if (!cliente) throw notFound();
    return { cliente };
  },
  component: ClienteDetalhe,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Cliente não encontrado.</div>
  ),
});

const TABS = ["Resumo", "Processos", "Contratos", "Financeiro", "Documentos", "Interações"] as const;

function ClienteDetalhe() {
  const { cliente } = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumo");
  const procs = processos.filter((p) => p.cliente.startsWith(cliente.nome.split(" ")[0]));
  const ctrs = contratos.filter((c) => c.cliente.startsWith(cliente.nome.split(" ")[0]));
  const fins = financeiro.filter((f) => f.cliente.startsWith(cliente.nome.split(" ")[0]));
  const isPJ = cliente.tipo === "PJ";

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <Link to="/app/clientes" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para clientes
      </Link>

      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary">
              {isPJ ? <Building2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {isPJ ? "Pessoa Jurídica" : "Pessoa Física"} · {cliente.id}
              </p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {cliente.documento}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {cliente.cidade}</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {cliente.responsavel}</span>
                <StatusPill tone={cliente.status === "Ativo" ? "success" : cliente.status === "Prospect" ? "info" : "muted"}>{cliente.status}</StatusPill>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[13px] hover:bg-muted">
              <MessageSquare className="h-3.5 w-3.5" /> Mensagem
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
              <Edit3 className="h-3.5 w-3.5" /> Editar
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-md border border-border hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos" value={String(cliente.processos)} tone="info" />
        <StatCard label="Contratos ativos" value={String(ctrs.length)} tone="success" />
        <StatCard label="A receber" value={fmtBRL(fins.filter(f => f.tipo === "Receber" && f.status !== "Pago").reduce((a, b) => a + b.valor, 0))} tone="warning" />
        <StatCard label="Último contato" value="2 dias" hint="via WhatsApp" />
      </div>

      <div className="surface-card">
        <div className="flex items-center gap-1 border-b border-border px-4 pt-3">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative rounded-t-md px-3.5 py-2.5 text-[13px] font-medium transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
              {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {tab === "Resumo" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <InfoBlock title="Dados de contato" rows={[
              { icon: Mail, label: "E-mail", value: `contato@${cliente.nome.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)}.com.br` },
              { icon: Phone, label: "Telefone", value: "(11) 3200-4500" },
              { icon: MapPin, label: "Endereço", value: `Av. Paulista, 1200 — ${cliente.cidade}` },
            ]} />
            <InfoBlock title="Dados jurídicos" rows={[
              { icon: FileText, label: isPJ ? "CNPJ" : "CPF", value: cliente.documento },
              { icon: Briefcase, label: "Responsável", value: cliente.responsavel },
              { icon: User, label: "Origem", value: "Indicação — parceria" },
            ]} />
            <div className="surface-card lg:col-span-2 p-5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">Notas internas</p>
              <p className="text-[13.5px] leading-relaxed text-foreground/85">
                Cliente estratégico com histórico de bom relacionamento. Prefere comunicação por e-mail
                nas segundas pela manhã. Contrato em revisão para renovação anual em dezembro.
              </p>
            </div>
          </div>
        )}

        {tab === "Processos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 text-left">Número</th><th className="px-5 py-3 text-left">Área</th><th className="px-5 py-3 text-left">Fase</th><th className="px-5 py-3 text-right">Valor</th><th className="px-5 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {procs.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5 font-mono text-[12px]">
                      <Link to="/app/processos/$id" params={{ id: p.id }} className="text-primary hover:underline">{p.numero}</Link>
                    </td>
                    <td className="px-5 py-3.5">{p.area}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{p.fase}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{fmtBRL(p.valor)}</td>
                    <td className="px-5 py-3.5"><StatusPill tone={p.status === "Em andamento" ? "info" : p.status === "Suspenso" ? "warning" : "success"}>{p.status}</StatusPill></td>
                  </tr>
                ))}
                {procs.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Sem processos vinculados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Contratos" && (
          <div className="p-6 space-y-3">
            {ctrs.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{c.numero} · {c.objeto}</p>
                  <p className="text-[12px] text-muted-foreground">{fmtDate(c.inicio)} → {fmtDate(c.fim)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-medium">{fmtBRL(c.valor)}</span>
                  <StatusPill tone={c.status === "Ativo" ? "success" : "warning"}>{c.status}</StatusPill>
                </div>
              </div>
            ))}
            {ctrs.length === 0 && <p className="text-center text-muted-foreground py-8">Sem contratos.</p>}
          </div>
        )}

        {tab === "Financeiro" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 text-left">Descrição</th><th className="px-5 py-3 text-left">Vencimento</th><th className="px-5 py-3 text-right">Valor</th><th className="px-5 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fins.map((f) => (
                  <tr key={f.id}><td className="px-5 py-3.5">{f.descricao}</td><td className="px-5 py-3.5">{fmtDate(f.vencimento)}</td><td className="px-5 py-3.5 text-right tabular-nums">{fmtBRL(f.valor)}</td><td className="px-5 py-3.5"><StatusPill tone={f.status === "Pago" ? "success" : f.status === "Atrasado" ? "destructive" : "warning"}>{f.status}</StatusPill></td></tr>
                ))}
                {fins.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Sem lançamentos.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Documentos" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">4 arquivos · 12,4 MB</p>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Anexar</button>
            </div>
            <div className="grid gap-2">
              {["Contrato social 2024.pdf", "Procuração ad judicia.pdf", "Comprovante endereço.pdf", "RG diretoria.pdf"].map((f) => (
                <div key={f} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-[13px]">
                  <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {f}</span>
                  <span className="text-[11.5px] text-muted-foreground">3,1 MB · há 4 dias</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Interações" && (
          <div className="p-6 space-y-3">
            {[
              { d: "hoje, 09:14", t: "Marina Souza registrou reunião presencial", desc: "Alinhamento sobre estratégia recursal." },
              { d: "ontem, 16:20", t: "E-mail enviado", desc: "Encaminhada minuta do acordo para revisão do cliente." },
              { d: "há 3 dias", t: "Ligação recebida", desc: "Cliente solicitou status do processo trabalhista." },
              { d: "há 1 semana", t: "Contrato assinado", desc: "CT-2026-014 · Consultoria mensal renovada." },
            ].map((i) => (
              <div key={i.d} className="flex gap-3 rounded-md border border-border bg-card p-4">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-[11.5px] uppercase tracking-wide text-muted-foreground">{i.d}</p>
                  <p className="font-medium text-[13.5px]">{i.t}</p>
                  <p className="text-[13px] text-muted-foreground">{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBlock({ title, rows }: { title: string; rows: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] }) {
  return (
    <div className="surface-card p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">{title}</p>
      <ul className="space-y-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li key={r.label} className="flex items-start gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-muted text-muted-foreground shrink-0"><Icon className="h-4 w-4" /></div>
              <div><p className="text-[11.5px] uppercase tracking-wider text-muted-foreground">{r.label}</p><p className="text-[13.5px] font-medium">{r.value}</p></div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}