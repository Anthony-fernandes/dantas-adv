import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, FileText, Loader2 } from "lucide-react";
import { StatusPill, StatCard } from "@/components/shell/PageHeader";
import { useDetail, useList, fmtBRL, fmtDate, clientName, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/clientes/$id")({
  head: () => ({ meta: [{ title: pageTitle(`Cliente`) }] }),
  component: ClienteDetalhe,
});

const TABS = ["Resumo", "Processos", "Contratos", "Documentos"] as const;

function typeOf(c: any): "PF" | "PJ" {
  const t = String(c?.type || c?.tipo || "").toUpperCase();
  if (t === "PJ" || c?.razao_social || c?.cnpj) return "PJ";
  return "PF";
}

function ClienteDetalhe() {
  const { id } = useParams({ from: "/app/clientes/$id" });
  const { data: c, isLoading } = useDetail<any>("clients", id);
  const processes = useList<any>("processes");
  const contracts = useList<any>("contracts");
  const documents = useList<any>("documents");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumo");

  const procs = useMemo(
    () => (processes.data ?? []).filter((p) => String(p.client || p.client_id || "") === id),
    [processes.data, id],
  );
  const ctrs = useMemo(
    () => (contracts.data ?? []).filter((x) => String(x.client || x.client_id || "") === id),
    [contracts.data, id],
  );
  const docs = useMemo(
    () => (documents.data ?? []).filter((x) => String(x.client || x.client_id || "") === id),
    [documents.data, id],
  );

  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!c) return <div className="p-10 text-center text-muted-foreground">Cliente não encontrado.</div>;

  const isPJ = typeOf(c) === "PJ";
  const name = clientName(c);
  const address = c.address || {};

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
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{isPJ ? "Pessoa Jurídica" : "Pessoa Física"}</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">{name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {c.document || c.doc || "—"}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.city || address.city || "—"}</span>
                <StatusPill tone={String(c.status || "ativo").toLowerCase() === "inativo" ? "muted" : "success"}>{c.status || "Ativo"}</StatusPill>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Processos" value={String(procs.length)} tone="info" />
        <StatCard label="Contratos" value={String(ctrs.length)} tone="success" />
        <StatCard label="Documentos" value={String(docs.length)} tone="warning" />
        <StatCard label="Tipo" value={isPJ ? "PJ" : "PF"} />
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
              { icon: Mail, label: "E-mail", value: c.email || "—" },
              { icon: Phone, label: "Telefone", value: c.phone || c.whatsapp || "—" },
              { icon: MapPin, label: "Endereço", value: [address.street, c.city || address.city, c.state || address.state].filter(Boolean).join(", ") || "—" },
            ]} />
            <InfoBlock title="Dados jurídicos" rows={[
              { icon: FileText, label: isPJ ? "CNPJ" : "CPF", value: c.document || c.doc || "—" },
              { icon: User, label: "Status", value: humanize(c.status || "ativo") },
            ]} />
            {c.notes && (
              <div className="surface-card lg:col-span-2 p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-3">Notas internas</p>
                <p className="text-[13.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">{typeof c.notes === "string" ? c.notes : ""}</p>
              </div>
            )}
          </div>
        )}

        {tab === "Processos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 text-left">Número CNJ</th><th className="px-5 py-3 text-left">Área</th><th className="px-5 py-3 text-left">Fase</th><th className="px-5 py-3 text-right">Valor</th><th className="px-5 py-3 text-left">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {procs.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5 font-mono text-[12px]">
                      <Link to="/app/processos/$id" params={{ id: String(p.id) }} className="text-primary hover:underline">{p.cnj || "—"}</Link>
                    </td>
                    <td className="px-5 py-3.5">{p.area || "—"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">{p.phase || "—"}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{fmtBRL(p.cause_value)}</td>
                    <td className="px-5 py-3.5"><StatusPill tone="info">{p.status || "—"}</StatusPill></td>
                  </tr>
                ))}
                {procs.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Sem processos vinculados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Contratos" && (
          <div className="p-6 space-y-3">
            {ctrs.map((c2) => (
              <div key={c2.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{humanize(c2.type)}</p>
                  <p className="text-[12px] text-muted-foreground">{fmtDate(c2.start_date)} {c2.end_date ? `→ ${fmtDate(c2.end_date)}` : ""}</p>
                </div>
                <StatusPill tone={String(c2.status).toLowerCase() === "vigente" ? "success" : "muted"}>{c2.status}</StatusPill>
              </div>
            ))}
            {ctrs.length === 0 && <p className="text-center text-muted-foreground py-8">Sem contratos.</p>}
          </div>
        )}

        {tab === "Documentos" && (
          <div className="p-6 grid gap-2">
            {docs.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-[13px]">
                <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {f.title || f.filename || "Documento"}</span>
                <span className="text-[11.5px] text-muted-foreground">{fmtDate(f.created_at)}</span>
              </div>
            ))}
            {docs.length === 0 && <p className="text-center text-muted-foreground py-8">Sem documentos.</p>}
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
              <div className="min-w-0"><p className="text-[11.5px] uppercase tracking-wider text-muted-foreground">{r.label}</p><p className="text-[13.5px] font-medium break-words">{r.value}</p></div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
