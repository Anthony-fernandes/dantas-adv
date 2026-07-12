import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Timer, Gavel, Loader2 } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { useList, daysUntil } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/agenda")({
  head: () => ({ meta: [{ title: pageTitle("Agenda") }] }),
  component: AgendaPage,
});

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Evento = { key: string; date: Date; hora: string; titulo: string; tipo: "prazo" | "audiencia"; tone: "info" | "warning" | "destructive" };

function startOfWeek(base: Date) {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira
  return d;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function AgendaPage() {
  const deadlines = useList<any>("deadlines", { ordering: "due_date" });
  const hearings = useList<any>("hearings", { ordering: "hearing_date" });
  const [offset, setOffset] = useState(0); // semanas a partir da atual

  const weekStart = useMemo(() => {
    const s = startOfWeek(new Date());
    s.setDate(s.getDate() + offset * 7);
    return s;
  }, [offset]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }),
    [weekStart],
  );

  const eventos = useMemo<Evento[]>(() => {
    const evs: Evento[] = [];
    (deadlines.data ?? []).forEach((p) => {
      if (!p.due_date) return;
      const d = new Date(`${String(p.due_date).slice(0, 10)}T12:00:00`);
      const dd = daysUntil(p.due_date);
      evs.push({
        key: `d-${p.id}`, date: d, hora: "Prazo",
        titulo: p.description || p.title || "Prazo",
        tipo: "prazo",
        tone: dd !== null && dd < 0 ? "destructive" : dd !== null && dd <= 3 ? "warning" : "info",
      });
    });
    (hearings.data ?? []).forEach((a) => {
      if (!a.hearing_date) return;
      const d = new Date(a.hearing_date);
      evs.push({
        key: `h-${a.id}`, date: d,
        hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        titulo: a.type ? `Audiência — ${a.type}` : "Audiência",
        tipo: "audiencia", tone: "info",
      });
    });
    return evs;
  }, [deadlines.data, hearings.data]);

  const loading = deadlines.isLoading || hearings.isLoading;
  const rangeLabel = `${days[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${days[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Agenda"
        description="Prazos e audiências da semana, integrados aos módulos."
        actions={
          <div className="flex items-center gap-2">
            <button aria-label="Semana anterior" onClick={() => setOffset((o) => o - 1)} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setOffset(0)} className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] hover:bg-muted">Hoje</button>
            <button aria-label="Próxima semana" onClick={() => setOffset((o) => o + 1)} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
            <span className="ml-2 text-[13px] text-muted-foreground">{rangeLabel}</span>
          </div>
        }
      />

      {loading ? (
        <div className="surface-card p-16 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((d) => {
            const hoje = sameDay(d, new Date());
            const evs = eventos.filter((e) => sameDay(e.date, d)).sort((a, b) => a.date.getTime() - b.date.getTime());
            return (
              <div key={d.toISOString()} className={`surface-card p-3 min-h-[160px] ${hoje ? "ring-2 ring-primary/40" : ""}`}>
                <p className={`text-[11px] uppercase tracking-[0.14em] ${hoje ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {DIAS[d.getDay()]} · {d.getDate().toString().padStart(2, "0")}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {evs.length === 0 && <li className="text-[11.5px] text-muted-foreground/60">—</li>}
                  {evs.map((e) => (
                    <li key={e.key} className="rounded-md border border-border bg-card px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {e.tipo === "prazo" ? <Timer className="h-3 w-3 text-muted-foreground shrink-0" /> : <Gavel className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span className="text-[10.5px] text-muted-foreground">{e.hora}</span>
                        <StatusPill tone={e.tone}>{e.tipo === "prazo" ? "Prazo" : "Aud."}</StatusPill>
                      </div>
                      <p className="mt-0.5 text-[11.5px] font-medium leading-tight line-clamp-2">{e.titulo}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
