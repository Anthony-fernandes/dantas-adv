import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Plus, MapPin, Video, FolderOpen, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtDateTime, daysUntil } from "@/lib/resources";

export const Route = createFileRoute("/app/audiencias/")({
  head: () => ({ meta: [{ title: "Audiências — JurisFlow" }] }),
  component: AudienciasPage,
});

function isVirtual(m?: string | null) {
  return String(m || "").toLowerCase().includes("virtual");
}

function AudienciasPage() {
  const hearings = useList<any>("hearings", { ordering: "hearing_date" });
  const rows = hearings.data ?? [];

  const stats = useMemo(() => {
    const week = rows.filter((h) => {
      const d = daysUntil(h.hearing_date);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    const presencial = rows.filter((h) => !isVirtual(h.modality)).length;
    const virtual = rows.filter((h) => isVirtual(h.modality)).length;
    return { week, presencial, virtual, total: rows.length };
  }, [rows]);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Audiências"
        description="Todas as audiências agendadas, com modalidade e responsável."
        actions={
          <Link to="/app/audiencias/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Nova audiência
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(stats.total)} icon={FolderOpen} />
        <StatCard label="Próximos 7 dias" value={String(stats.week)} tone="warning" />
        <StatCard label="Presenciais" value={String(stats.presencial)} tone="info" />
        <StatCard label="Virtuais" value={String(stats.virtual)} tone="success" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Data / Hora</th>
                <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">Local</th>
                <th className="px-4 py-2.5 text-left font-medium">Modalidade</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {hearings.isLoading && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!hearings.isLoading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhuma audiência agendada.</td></tr>
              )}
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 whitespace-nowrap font-medium">{fmtDateTime(a.hearing_date)}</td>
                  <td className="px-4 py-3">{a.type || "Audiência"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.location || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={isVirtual(a.modality) ? "info" : "warning"}>
                      {isVirtual(a.modality) ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      {a.modality || "Presencial"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={String(a.status).toLowerCase() === "realizada" ? "success" : String(a.status).toLowerCase() === "cancelada" ? "muted" : "info"}>{a.status || "agendada"}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
