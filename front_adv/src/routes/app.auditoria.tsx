import { createFileRoute } from "@tanstack/react-router";
import { Shield, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { useList, fmtDateTime, humanize } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/auditoria")({
  head: () => ({ meta: [{ title: pageTitle("Auditoria") }] }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const events = useList<any>("audit-events", { ordering: "-created_at" });
  const rows = events.data ?? [];

  return (
    <ModuleScaffold
      eyebrow="Compliance" title="Log de auditoria"
      description="Trilha de acessos e alterações no sistema."
      icon={Shield}
      stats={[{ label: "Eventos", value: String(rows.length) }]}
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Data / Hora</th>
                <th className="px-4 py-2.5 text-left font-medium">Usuário</th>
                <th className="px-4 py-2.5 text-left font-medium">Ação</th>
                <th className="px-5 py-2.5 text-left font-medium">Recurso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.isLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!events.isLoading && rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Nenhum evento registrado.</td></tr>}
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{fmtDateTime(e.created_at || e.timestamp)}</td>
                  <td className="px-4 py-3">{e.user_name || e.user || e.actor || "Sistema"}</td>
                  <td className="px-4 py-3">{humanize(e.action || e.event_type)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.resource || e.target || e.entity || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
