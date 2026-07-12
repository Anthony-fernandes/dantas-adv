import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { audiencias, prazos } from "@/lib/mock";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/agenda")({
  head: () => ({ meta: [{ title: pageTitle("Agenda") }] }),
  component: AgendaPage,
});

const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function AgendaPage() {
  // Build events for the week
  const events: Record<string, Array<{ hora: string; titulo: string; tone: any }>> = {
    "07": [{ hora: "09:00", titulo: "Audiência — Aurora S.A.", tone: "info" }],
    "08": [{ hora: "14:00", titulo: "Contestação — Aurora", tone: "destructive" }],
    "09": [{ hora: "14:30", titulo: "Conciliação — Ana B.", tone: "info" }, { hora: "16:00", titulo: "Reunião interna", tone: "muted" }],
    "10": [{ hora: "10:00", titulo: "Audiência — Petro Sul", tone: "info" }],
    "11": [{ hora: "11:00", titulo: "Réplica — Freitas", tone: "warning" }],
  };
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Produtividade"
        title="Agenda"
        description="Audiências, reuniões e compromissos do escritório em uma única visão."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo compromisso
          </button>
        }
      />

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-border hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
            <button className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] hover:bg-muted">Hoje</button>
            <h2 className="ml-3 font-display text-lg font-semibold">Julho 2026 · Semana 27</h2>
          </div>
          <div className="flex rounded-md border border-border overflow-hidden text-[12.5px]">
            <button className="px-3 py-1.5 text-muted-foreground hover:bg-muted">Dia</button>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground">Semana</button>
            <button className="px-3 py-1.5 text-muted-foreground hover:bg-muted">Mês</button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {dias.map((d, i) => {
            const dayNum = String(7 + i).padStart(2, "0");
            const isToday = dayNum === "07";
            return (
              <div key={d} className={`px-4 py-3 border-r border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{d}</p>
                <p className={`mt-1 font-display text-2xl font-semibold ${isToday ? "text-accent" : ""}`}>{dayNum}</p>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {dias.map((_, i) => {
            const dayNum = String(7 + i).padStart(2, "0");
            const ev = events[dayNum] || [];
            return (
              <div key={i} className="border-r border-border last:border-r-0 p-2 space-y-1.5">
                {ev.map((e, idx) => (
                  <div key={idx} className={`rounded-md border p-2 text-[11.5px] cursor-pointer transition hover:shadow-[var(--shadow-card)] ${
                    e.tone === "info" ? "bg-info/8 border-info/20" :
                    e.tone === "destructive" ? "bg-destructive/8 border-destructive/20" :
                    e.tone === "warning" ? "bg-warning/12 border-warning/25" :
                    "bg-muted/60 border-border"
                  }`}>
                    <p className="font-medium text-foreground truncate">{e.hora}</p>
                    <p className="text-muted-foreground truncate">{e.titulo}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Próximas audiências</h3>
          <ul className="space-y-3">
            {audiencias.slice(0,3).map((a) => (
              <li key={a.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="text-center rounded-md border border-border bg-muted/40 px-2 py-1.5 min-w-[50px]">
                  <p className="font-display text-base font-semibold leading-none">{a.data.split("-")[2]}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Jul</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{a.tipo} · {a.hora}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">{a.forum}</p>
                </div>
                <StatusPill tone={a.modalidade === "Virtual" ? "info" : "muted"}>{a.modalidade}</StatusPill>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-5">
          <h3 className="text-[14px] font-semibold mb-3">Prazos da semana</h3>
          <ul className="space-y-3">
            {prazos.slice(0,3).map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{p.titulo}</p>
                  <p className="text-[11.5px] text-muted-foreground font-mono truncate">{p.processo}</p>
                </div>
                <StatusPill tone={p.dias < 0 ? "destructive" : p.dias <= 3 ? "warning" : "info"}>
                  {p.dias < 0 ? `${Math.abs(p.dias)}d atraso` : `${p.dias}d`}
                </StatusPill>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}