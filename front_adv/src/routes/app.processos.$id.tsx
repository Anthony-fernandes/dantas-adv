import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Scale, MapPin, Briefcase, Users, FileText, Loader2 } from "lucide-react";
import { StatusPill, StatCard } from "@/components/shell/PageHeader";
import { useDetail, useList, fmtBRL, fmtDate, fmtDateTime, clientName, humanize } from "@/lib/resources";

export const Route = createFileRoute("/app/processos/$id")({
  head: ({ params }) => ({ meta: [{ title: `Processo — JurisFlow` }] }),
  component: ProcessoDetalhe,
});

const TABS = ["Andamentos", "Prazos", "Audiências", "Documentos", "Tarefas"] as const;

function linkedTo(item: any, id: string) {
  return String(item.process || item.process_id || "") === id;
}

function ProcessoDetalhe() {
  const { id } = useParams({ from: "/app/processos/$id" });
  const { data: p, isLoading } = useDetail<any>("processes", id);
  const clients = useList<any>("clients");
  const deadlines = useList<any>("deadlines", { ordering: "due_date" });
  const hearings = useList<any>("hearings", { ordering: "hearing_date" });
  const tasks = useList<any>("tasks");
  const movements = useList<any>("movements", { ordering: "-date" });
  const documents = useList<any>("documents");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Andamentos");

  const clientMap = useMemo(
    () => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])),
    [clients.data],
  );

  const relPrazos = useMemo(() => (deadlines.data ?? []).filter((x) => linkedTo(x, id)), [deadlines.data, id]);
  const relAud = useMemo(() => (hearings.data ?? []).filter((x) => linkedTo(x, id)), [hearings.data, id]);
  const relTar = useMemo(() => (tasks.data ?? []).filter((x) => linkedTo(x, id)), [tasks.data, id]);
  const relMov = useMemo(() => (movements.data ?? []).filter((x) => linkedTo(x, id)), [movements.data, id]);
  const relDoc = useMemo(() => (documents.data ?? []).filter((x) => linkedTo(x, id)), [documents.data, id]);

  if (isLoading) {
    return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  }
  if (!p) {
    return <div className="p-10 text-center text-muted-foreground">Processo não encontrado.</div>;
  }

  const cName = p.client_name || clientMap[String(p.client)] || "Sem cliente";

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
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Processo · {p.area || "—"}</p>
              <h1 className="font-mono text-2xl font-semibold tracking-tight">{p.cnj || "Sem CNJ"}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cName}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {[p.court_division, p.court].filter(Boolean).join(" · ") || "—"}</span>
                <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {humanize(p.phase)}</span>
                <StatusPill tone={String(p.status).toLowerCase() === "suspenso" ? "warning" : String(p.status).toLowerCase().match(/finalizado|arquivado/) ? "muted" : "info"}>{p.status || "—"}</StatusPill>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Valor da causa" value={fmtBRL(p.cause_value)} tone="info" />
        <StatCard label="Prazos abertos" value={String(relPrazos.length)} tone="warning" />
        <StatCard label="Audiências" value={String(relAud.length)} tone="info" />
        <StatCard label="Parte contrária" value={p.defendant || "—"} />
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
            {relMov.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-[13px]">Sem andamentos registrados.</p>
            ) : (
              <ol className="relative border-l-2 border-border ml-3 space-y-6">
                {relMov.map((e) => (
                  <li key={e.id} className="ml-4">
                    <span className="absolute -left-[7px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{fmtDateTime(e.date || e.created_at)}</p>
                    <p className="mt-0.5 font-medium text-[13.5px]">{e.title || e.type || "Andamento"}</p>
                    <p className="text-[13px] text-muted-foreground">{e.description || e.content || ""}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "Prazos" && (
          <SimpleList empty="Sem prazos vinculados." rows={relPrazos.map((d) => ({
            title: d.description || d.title || "Prazo",
            sub: `Vence em ${fmtDate(d.due_date)} · ${humanize(d.priority)}`,
            right: <StatusPill tone={String(d.status).toLowerCase() === "concluido" ? "success" : "info"}>{d.status || "aberto"}</StatusPill>,
          }))} />
        )}
        {tab === "Audiências" && (
          <SimpleList empty="Sem audiências." rows={relAud.map((a) => ({
            title: `${a.type || "Audiência"} — ${fmtDateTime(a.hearing_date)}`,
            sub: `${a.location || "Local a definir"} · ${a.modality || "Presencial"}`,
            right: <StatusPill tone={String(a.modality).toLowerCase().includes("virtual") ? "info" : "muted"}>{a.modality || "Presencial"}</StatusPill>,
          }))} />
        )}
        {tab === "Documentos" && (
          <SimpleList empty="Sem documentos anexados." rows={relDoc.map((f) => ({
            title: f.title || f.filename || "Documento",
            sub: fmtDate(f.created_at),
            right: <FileText className="h-4 w-4 text-muted-foreground" />,
          }))} />
        )}
        {tab === "Tarefas" && (
          <SimpleList empty="Sem tarefas." rows={relTar.map((t) => ({
            title: t.title,
            sub: `Vence ${fmtDate(t.due_date)}`,
            right: <StatusPill tone={String(t.status).toLowerCase() === "concluida" ? "success" : "muted"}>{humanize(t.status)}</StatusPill>,
          }))} />
        )}
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
          <div className="min-w-0"><p className="font-medium text-[13.5px] truncate">{r.title}</p><p className="text-[12.5px] text-muted-foreground truncate">{r.sub}</p></div>
          {r.right}
        </li>
      ))}
    </ul>
  );
}
