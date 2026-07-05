import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList } from "@/lib/resources";

export const Route = createFileRoute("/app/areas/")({
  head: () => ({ meta: [{ title: "Áreas de atuação — JurisFlow" }] }),
  component: AreasPage,
});

function AreasPage() {
  const areas = useList<any>("causes");
  const processes = useList<any>("processes");
  const rows = areas.data ?? [];

  const procByArea = useMemo(() => {
    const m: Record<string, number> = {};
    (processes.data ?? []).forEach((p) => {
      const a = String(p.area || "").toLowerCase();
      if (a) m[a] = (m[a] || 0) + 1;
    });
    return m;
  }, [processes.data]);

  return (
    <ModuleScaffold
      eyebrow="Cadastros" title="Áreas de atuação"
      description="Áreas do direito atendidas pelo escritório."
      icon={FolderKanban}
      stats={[
        { label: "Áreas", value: String(rows.length) },
        { label: "Ativas", value: String(rows.filter((a) => a.is_active !== false).length), tone: "success" },
      ]}
      actions={
        <Link to="/app/areas/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Nova área
        </Link>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Área</th>
                <th className="px-4 py-2.5 text-right font-medium">Processos</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {areas.isLoading && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!areas.isLoading && rows.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">Nenhuma área cadastrada.</td></tr>
              )}
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{a.name || a.area || "Área"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{procByArea[String(a.area || "").toLowerCase()] || 0}</td>
                  <td className="px-5 py-3"><StatusPill tone={a.is_active !== false ? "success" : "muted"}>{a.is_active !== false ? "Ativa" : "Inativa"}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
