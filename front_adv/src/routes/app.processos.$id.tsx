import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft, Scale, MapPin, Briefcase, Users, FileText, Loader2, Plus,
  Timer, Gavel, CheckSquare, Clock, Upload, ShieldAlert, Trash2, Download,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { StatusPill, StatCard } from "@/components/shell/PageHeader";
import { FormDialog } from "@/components/shell/FormDialog";
import { DocumentoDialog } from "@/components/shell/DocumentoDialog";
import { useDetail, useList, useCreate, useRemove, fmtBRL, fmtDate, fmtDateTime, clientName, humanize } from "@/lib/resources";
import { api, apiDownload } from "@/lib/api";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/processos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Processo") }] }),
  component: ProcessoDetalhe,
});

const TABS = ["Timeline", "Partes", "Prazos", "Audiências", "Documentos", "Tarefas", "Horas"] as const;
type Tab = (typeof TABS)[number];

type TimelineItem = {
  type: string; id: string; date: string; title: string;
  description?: string; status?: string | null; meta?: Record<string, any>; actor?: string | null;
};

const TL_ICON: Record<string, any> = { movement: FileText, deadline: Timer, hearing: Gavel, task: CheckSquare, document: Upload };

const ROLE_OPTIONS = [
  { value: "autor", label: "Autor / Requerente" }, { value: "reu", label: "Réu / Requerido" },
  { value: "terceiro", label: "Terceiro interessado" }, { value: "assistente", label: "Assistente" },
  { value: "testemunha", label: "Testemunha" }, { value: "perito", label: "Perito" },
  { value: "mp", label: "Ministério Público" }, { value: "outro", label: "Outro" },
];

function ProcessoDetalhe() {
  const { id } = useParams({ from: "/app/processos/$id" });
  const { data: p, isLoading } = useDetail<any>("processes", id);
  const clients = useList<any>("clients");

  // Dados vinculados ao processo (filtro server-side por ?process=)
  const deadlines = useList<any>("deadlines", { process: id, ordering: "due_date" });
  const hearings = useList<any>("hearings", { process: id, ordering: "hearing_date" });
  const tasks = useList<any>("tasks", { process: id });
  const documents = useList<any>("documents", { process: id });
  const hours = useList<any>("time-entries", { process: id, ordering: "-date" });
  const parties = useList<any>("process-parties", { process: id });

  // Timeline unificada do backend
  const timeline = useQuery<TimelineItem[]>({
    queryKey: ["process-timeline", id],
    queryFn: () => api.get<TimelineItem[]>(`/processes/${id}/timeline/`),
  });

  const createMovement = useCreate<any>("movements", ["deadlines", "hearings"]);
  const createDeadline = useCreate<any>("deadlines");
  const createHearing = useCreate<any>("hearings");
  const createTask = useCreate<any>("tasks");
  const createHour = useCreate<any>("time-entries");
  const createParty = useCreate<any>("process-parties");
  const removeParty = useRemove("process-parties");

  const [tab, setTab] = useState<Tab>("Timeline");
  const [dialog, setDialog] = useState<null | "movement" | "deadline" | "hearing" | "task" | "hour" | "party" | "doc">(null);

  // Checagem de conflito de interesses sobre a parte contrária
  const conflict = useQuery<any>({
    queryKey: ["conflict-check", id, p?.defendant],
    queryFn: () => api.get<any>("/conflict-check/", { name: p?.defendant }),
    enabled: Boolean(p?.defendant && String(p.defendant).trim().length >= 4),
    staleTime: 5 * 60 * 1000,
  });

  const clientMap = useMemo(
    () => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])),
    [clients.data],
  );

  if (isLoading) return <div className="p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>;
  if (!p) return <div className="p-10 text-center text-muted-foreground">Processo não encontrado.</div>;

  const cName = p.client_name || clientMap[String(p.client)] || "Sem cliente";
  const refreshTimeline = () => timeline.refetch();

  const quickActions: { key: typeof dialog; label: string; icon: any }[] = [
    { key: "movement", label: "Andamento", icon: FileText },
    { key: "deadline", label: "Prazo", icon: Timer },
    { key: "hearing", label: "Audiência", icon: Gavel },
    { key: "task", label: "Tarefa", icon: CheckSquare },
    { key: "hour", label: "Horas", icon: Clock },
    { key: "doc", label: "Documento", icon: Upload },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <Link to="/app/processos" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para processos
      </Link>

      {/* Capa */}
      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary"><Scale className="h-6 w-6" /></div>
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
          {/* Ações rápidas: o processo é o centro de trabalho */}
          <div className="flex flex-wrap items-center gap-1.5">
            {quickActions.map((a) => (
              <button key={String(a.key)} onClick={() => setDialog(a.key)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium hover:bg-muted transition">
                <Plus className="h-3 w-3 text-primary" /> {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alerta de conflito de interesses */}
        {conflict.data?.has_conflict && (
          <div className="mt-4 flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/8 px-4 py-3">
            <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-[12.5px]">
              <p className="font-semibold text-destructive">Possível conflito de interesses com a parte contrária "{p.defendant}".</p>
              <p className="text-muted-foreground mt-0.5">
                {(conflict.data.clients ?? []).slice(0, 3).map((c: any) => `Cliente do escritório: ${c.name}`).join(" · ")}
                {(conflict.data.parties ?? []).filter((x: any) => x.is_client).slice(0, 3).map((x: any) => ` · Parte em ${x.process_cnj || "outro processo"}`)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Valor da causa" value={fmtBRL(p.cause_value)} tone="info" />
        <StatCard label="Prazos abertos" value={String((deadlines.data ?? []).filter((d) => !String(d.status).toLowerCase().match(/concluido|cumprido/)).length)} tone="warning" />
        <StatCard label="Audiências" value={String((hearings.data ?? []).length)} tone="info" />
        <StatCard label="Parte contrária" value={p.defendant || "—"} tone={conflict.data?.has_conflict ? "destructive" : "default"} />
      </div>

      {/* Abas */}
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

        {tab === "Timeline" && (
          <div className="p-6">
            {timeline.isLoading && <p className="py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>}
            {!timeline.isLoading && (timeline.data ?? []).length === 0 && (
              <p className="py-8 text-center text-muted-foreground text-[13px]">Nada registrado ainda — use as ações rápidas acima.</p>
            )}
            <ol className="relative border-l-2 border-border ml-3 space-y-6">
              {(timeline.data ?? []).map((e) => {
                const Icon = TL_ICON[e.type] || FileText;
                return (
                  <li key={`${e.type}-${e.id}`} className="ml-5">
                    <span className="absolute -left-[11px] grid h-5 w-5 place-items-center rounded-full bg-background ring-2 ring-border">
                      <Icon className="h-3 w-3 text-primary" />
                    </span>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {fmtDateTime(e.date)} {e.actor ? `· ${e.actor}` : ""}
                    </p>
                    <p className="mt-0.5 font-medium text-[13.5px]">{e.title || humanize(e.type)}</p>
                    {e.description && <p className="text-[13px] text-muted-foreground">{e.description}</p>}
                    {e.status && <StatusPill tone="muted">{humanize(e.status)}</StatusPill>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {tab === "Partes" && (
          <div>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border">
              <p className="text-[13px] text-muted-foreground">Partes e envolvidos no processo.</p>
              <button onClick={() => setDialog("party")} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3 w-3" /> Nova parte
              </button>
            </div>
            {(parties.data ?? []).length === 0 ? (
              <p className="p-10 text-center text-muted-foreground text-[13px]">Nenhuma parte cadastrada.</p>
            ) : (
              <ul className="divide-y divide-border">
                {(parties.data ?? []).map((pt) => (
                  <li key={pt.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[13.5px]">{pt.name} {pt.is_client && <StatusPill tone="success">Cliente</StatusPill>}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {ROLE_OPTIONS.find((r) => r.value === pt.role)?.label || humanize(pt.role)}
                        {pt.doc ? ` · ${pt.doc}` : ""}
                        {pt.lawyer_name ? ` · Adv.: ${pt.lawyer_name}${pt.lawyer_oab ? ` (OAB ${pt.lawyer_oab})` : ""}` : ""}
                      </p>
                    </div>
                    <button aria-label="Remover parte"
                      onClick={async () => {
                        try { await removeParty.mutateAsync(String(pt.id)); toast.success("Parte removida."); }
                        catch (e: any) { toast.error(e?.detail || "Não foi possível remover."); }
                      }}
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "Prazos" && (
          <SimpleList empty="Sem prazos vinculados." rows={(deadlines.data ?? []).map((d) => ({
            title: d.description || d.title || "Prazo",
            sub: `Vence em ${fmtDate(d.due_date)} · ${humanize(d.priority)}`,
            right: <StatusPill tone={String(d.status).toLowerCase() === "concluido" ? "success" : "info"}>{d.status || "aberto"}</StatusPill>,
          }))} />
        )}
        {tab === "Audiências" && (
          <SimpleList empty="Sem audiências." rows={(hearings.data ?? []).map((a) => ({
            title: `${a.type || "Audiência"} — ${fmtDateTime(a.hearing_date)}`,
            sub: `${a.location || "Local a definir"} · ${a.modality || "Presencial"}`,
            right: <StatusPill tone={String(a.modality).toLowerCase().includes("virtual") ? "info" : "muted"}>{a.modality || "Presencial"}</StatusPill>,
          }))} />
        )}
        {tab === "Documentos" && (
          (documents.data ?? []).length === 0
            ? <p className="p-10 text-center text-muted-foreground text-[13px]">Sem documentos anexados.</p>
            : <ul className="divide-y divide-border">
                {(documents.data ?? []).map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20">
                    <div className="min-w-0">
                      <p className="font-medium text-[13.5px] truncate">{f.title || f.filename || "Documento"}</p>
                      <p className="text-[12.5px] text-muted-foreground truncate">{fmtDate(f.created_at)} · {humanize(f.category)}</p>
                    </div>
                    {f.file_download_url && (
                      <button aria-label="Baixar" onClick={() => apiDownload(f.file_download_url, f.filename || f.title || "documento").catch((e: any) => toast.error(e?.detail || "Falha no download."))}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted">
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
        )}
        {tab === "Tarefas" && (
          <SimpleList empty="Sem tarefas." rows={(tasks.data ?? []).map((t) => ({
            title: t.title,
            sub: `Vence ${fmtDate(t.due_date)}`,
            right: <StatusPill tone={String(t.status).toLowerCase() === "concluida" ? "success" : "muted"}>{humanize(t.status)}</StatusPill>,
          }))} />
        )}
        {tab === "Horas" && (
          <SimpleList empty="Sem horas lançadas." rows={(hours.data ?? []).map((h) => ({
            title: h.description || "Apontamento",
            sub: `${fmtDate(h.date)} · ${h.hours ?? 0}h ${h.billable === false ? "(não faturável)" : ""}`,
            right: <span className="text-[13px] font-medium tabular-nums">{fmtBRL(h.amount)}</span>,
          }))} />
        )}
      </div>

      {/* ---- Pop-ups de ação rápida (todos pré-vinculados ao processo) ---- */}
      <FormDialog
        open={dialog === "movement"} onOpenChange={(o) => !o && setDialog(null)}
        title="Novo andamento" description="Registre um andamento na timeline do processo." submitLabel="Registrar"
        fields={[
          { label: "Data", name: "date", type: "date", required: true, defaultValue: new Date().toISOString().slice(0, 10) },
          { label: "Tipo", name: "type", type: "text", placeholder: "Ex.: Despacho, Publicação, Juntada" },
          { label: "Descrição", name: "description", type: "textarea", required: true },
        ]}
        onSubmit={async (v) => {
          try {
            await createMovement.mutateAsync({ process: id, date: v.date, type: v.type || "Andamento", description: v.description });
            toast.success("Andamento registrado."); setDialog(null); refreshTimeline();
          } catch (e: any) { toast.error(e?.detail || "Não foi possível registrar."); }
        }}
      />

      <FormDialog
        open={dialog === "deadline"} onOpenChange={(o) => !o && setDialog(null)}
        title="Novo prazo" description={`Prazo vinculado ao processo ${p.cnj || ""}.`} submitLabel="Criar prazo"
        fields={[
          { label: "Descrição", name: "description", type: "text", required: true, full: true },
          { label: "Vencimento", name: "due_date", type: "date", required: true },
          { label: "Prioridade", name: "priority", type: "select", options: [
            { value: "urgente", label: "Urgente" }, { value: "alta", label: "Alta" }, { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" } ] },
        ]}
        onSubmit={async (v) => {
          try {
            await createDeadline.mutateAsync({ process: id, description: v.description, due_date: v.due_date, priority: v.priority || "media", status: "aberto" });
            toast.success("Prazo criado."); setDialog(null); refreshTimeline();
          } catch (e: any) { toast.error(e?.detail || "Não foi possível criar."); }
        }}
      />

      <FormDialog
        open={dialog === "hearing"} onOpenChange={(o) => !o && setDialog(null)}
        title="Nova audiência" description={`Audiência do processo ${p.cnj || ""}.`} submitLabel="Agendar"
        fields={[
          { label: "Tipo", name: "type", type: "select", required: true, options: ["Instrução", "Conciliação", "Una", "Julgamento"] },
          { label: "Data e hora", name: "hearing_date", type: "text", required: true, placeholder: "AAAA-MM-DD HH:MM" },
          { label: "Local", name: "location", type: "text" },
          { label: "Modalidade", name: "modality", type: "select", options: ["Presencial", "Virtual", "Híbrida"] },
        ]}
        onSubmit={async (v) => {
          try {
            await createHearing.mutateAsync({ process: id, type: v.type, hearing_date: v.hearing_date.replace(" ", "T"), location: v.location || null, modality: v.modality, status: "agendada" });
            toast.success("Audiência agendada."); setDialog(null); refreshTimeline();
          } catch (e: any) { toast.error(e?.detail || "Não foi possível agendar."); }
        }}
      />

      <FormDialog
        open={dialog === "task"} onOpenChange={(o) => !o && setDialog(null)}
        title="Nova tarefa" description={`Tarefa vinculada ao processo ${p.cnj || ""}.`} submitLabel="Criar tarefa"
        fields={[
          { label: "Título", name: "title", type: "text", required: true, full: true },
          { label: "Prioridade", name: "priority", type: "select", options: [
            { value: "urgente", label: "Urgente" }, { value: "alta", label: "Alta" }, { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" } ] },
          { label: "Vencimento", name: "due_date", type: "date" },
        ]}
        onSubmit={async (v) => {
          try {
            await createTask.mutateAsync({ process: id, title: v.title, priority: v.priority || "media", due_date: v.due_date || null, status: "pendente" });
            toast.success("Tarefa criada."); setDialog(null);
          } catch (e: any) { toast.error(e?.detail || "Não foi possível criar."); }
        }}
      />

      <FormDialog
        open={dialog === "hour"} onOpenChange={(o) => !o && setDialog(null)}
        title="Lançar horas" description={`Horas trabalhadas no processo ${p.cnj || ""}.`} submitLabel="Lançar"
        fields={[
          { label: "Data", name: "date", type: "date", required: true, defaultValue: new Date().toISOString().slice(0, 10) },
          { label: "Horas", name: "hours", type: "number", required: true },
          { label: "Descrição", name: "description", type: "text", required: true, full: true },
          { label: "Faturável", name: "billable", type: "select", options: [{ value: "true", label: "Sim" }, { value: "false", label: "Não" }] },
        ]}
        onSubmit={async (v) => {
          try {
            await createHour.mutateAsync({ process: id, date: v.date, hours: Number(v.hours), description: v.description, billable: v.billable !== "false" });
            toast.success("Horas lançadas."); setDialog(null);
          } catch (e: any) { toast.error(e?.detail || "Não foi possível lançar."); }
        }}
      />

      <FormDialog
        open={dialog === "party"} onOpenChange={(o) => !o && setDialog(null)}
        title="Nova parte" description="Cadastre uma parte ou envolvido no processo." submitLabel="Adicionar parte" wide
        fields={[
          { label: "Nome", name: "name", type: "text", required: true, full: true },
          { label: "Papel", name: "role", type: "select", options: ROLE_OPTIONS },
          { label: "CPF/CNPJ", name: "doc", type: "text", mono: true },
          { label: "Advogado da parte", name: "lawyer_name", type: "text" },
          { label: "OAB", name: "lawyer_oab", type: "text", placeholder: "SP 123456" },
        ]}
        onSubmit={async (v) => {
          try {
            await createParty.mutateAsync({ process: id, name: v.name, role: v.role || "outro", doc: v.doc || null, lawyer_name: v.lawyer_name || "", lawyer_oab: v.lawyer_oab || "" });
            toast.success("Parte adicionada."); setDialog(null);
          } catch (e: any) { toast.error(e?.detail || "Não foi possível adicionar."); }
        }}
      />

      <DocumentoDialog open={dialog === "doc"} onOpenChange={(o) => !o && setDialog(null)} defaultProcess={id} onCreated={refreshTimeline} />
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
