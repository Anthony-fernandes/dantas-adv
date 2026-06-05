import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, FilterChip } from "@/components/ui-kit/PageKit";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/agenda")({ component: Agenda });

const events: Record<number, { time: string; title: string; tone: string }[]> = {
  6: [{ time: "09h", title: "Reunião Andradina", tone: "active" }],
  10: [{ time: "14h30", title: "Audiência Cunha v. TechCorp", tone: "warning" }],
  16: [{ time: "18h", title: "Prazo: Réplica Andradina", tone: "danger" }],
  22: [{ time: "14h30", title: "Audiência Andradina v. União", tone: "warning" }, { time: "16h", title: "Reunião sócios", tone: "neutral" }],
  28: [{ time: "10h", title: "Julgamento Aurora v. Fintech", tone: "warning" }],
};

function Agenda() {
  const [view, setView] = useState<"Mês" | "Semana" | "Dia" | "Lista">("Mês");
  return (
    <AppShell eyebrow="Painel · Agenda" title="Agenda integrada">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="size-9 border border-rule rounded grid place-items-center"><ChevronLeft className="size-4" /></button>
          <div className="font-display text-xl">Maio · 2026</div>
          <button className="size-9 border border-rule rounded grid place-items-center"><ChevronRight className="size-4" /></button>
          <button className="ml-2 px-3 h-9 border border-rule rounded text-xs">Hoje</button>
        </div>
        <div className="flex gap-2">
          {(["Mês","Semana","Dia","Lista"] as const).map((v) => (
            <FilterChip key={v} active={v===view}><span onClick={() => setView(v)}>{v}</span></FilterChip>
          ))}
        </div>
      </div>

      {view === "Mês" && (
        <Card>
          <div className="grid grid-cols-7 border-b border-rule">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
              <div key={d} className="px-4 py-2.5 text-[10px] font-mono-ui uppercase tracking-widest text-ink-soft border-r border-rule last:border-r-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 4;
              const inMonth = day >= 1 && day <= 31;
              const today = day === 16;
              const evs = events[day] || [];
              return (
                <div key={i} className={`min-h-[110px] border-r border-b border-rule p-2 last:border-r-0 ${!inMonth?"bg-surface-2/30":""}`}>
                  <div className={`text-xs ${today?"font-display text-2xl text-gold":"text-ink-soft font-mono-ui"}`}>{inMonth ? day : day < 1 ? 30 + day : day - 31}</div>
                  <div className="space-y-1 mt-1">
                    {evs.map((e, j) => (
                      <div key={j} className={`text-[10px] px-1.5 py-1 rounded truncate ${e.tone==="danger"?"bg-danger/10 text-danger":e.tone==="warning"?"bg-warning/10 text-amber-700":e.tone==="active"?"bg-info/10 text-info":"bg-surface-2"}`}>
                        <span className="font-mono-ui">{e.time}</span> {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view !== "Mês" && (
        <Card>
          <div className="p-10 text-center text-ink-soft">
            <div className="font-display text-2xl mb-2">Visão "{view}"</div>
            <div className="text-sm">Calendário detalhado para o intervalo selecionado.</div>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
