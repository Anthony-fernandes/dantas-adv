import { createFileRoute } from "@tanstack/react-router";
import { Plus, MapPin, Video, User } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { audiencias, fmtDate } from "@/lib/mock";
import { FolderOpen } from "lucide-react";

export const Route = createFileRoute("/app/audiencias/")({
  head: () => ({ meta: [{ title: "Audiências — JurisFlow" }] }),
  component: AudienciasPage,
});

function AudienciasPage() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Audiências"
        description="Todas as audiências agendadas, com modalidade e responsável."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Nova audiência
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Nesta semana" value="4" icon={FolderOpen} />
        <StatCard label="Presenciais" value="2" tone="warning" />
        <StatCard label="Virtuais" value="2" tone="info" />
        <StatCard label="Realizadas (mês)" value="18" tone="success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audiencias.map((a) => (
          <div key={a.id} className="surface-card p-5 hover:shadow-[var(--shadow-elevated)] transition">
            <div className="flex items-start gap-4">
              <div className="text-center rounded-md border border-border bg-muted/40 px-3 py-2.5 min-w-[64px]">
                <p className="font-display text-2xl font-semibold leading-none">{a.data.split("-")[2]}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Jul</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusPill tone={a.modalidade === "Virtual" ? "info" : "warning"}>
                    {a.modalidade === "Virtual" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {a.modalidade}
                  </StatusPill>
                  <span className="text-[12px] font-medium">{a.hora}</span>
                </div>
                <p className="font-display text-lg font-semibold">{a.tipo}</p>
                <p className="text-[12.5px] font-mono text-muted-foreground mt-1">{a.processo}</p>
                <p className="text-[13px] text-muted-foreground mt-1">{a.forum}</p>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[12px] text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {a.responsavel}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}