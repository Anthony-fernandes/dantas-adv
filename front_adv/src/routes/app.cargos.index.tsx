import { createFileRoute, Link } from "@tanstack/react-router";
import { BriefcaseBusiness, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList } from "@/lib/resources";

export const Route = createFileRoute("/app/cargos/")({
  head: () => ({ meta: [{ title: "Cargos — JurisFlow" }] }),
  component: CargosPage,
});

function CargosPage() {
  const positions = useList<any>("job-positions");
  const rows = positions.data ?? [];

  return (
    <ModuleScaffold
      eyebrow="Gestão" title="Cargos"
      description="Cadastro de cargos e políticas de acesso."
      icon={BriefcaseBusiness}
      stats={[
        { label: "Cargos", value: String(rows.length) },
        { label: "Ativos", value: String(rows.filter((p) => p.is_active !== false).length), tone: "success" },
      ]}
      actions={
        <Link to="/app/cargos/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Novo cargo
        </Link>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Cargo</th>
                <th className="px-4 py-2.5 text-left font-medium">Descrição</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positions.isLoading && <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!positions.isLoading && rows.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">Nenhum cargo cadastrado.</td></tr>}
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{p.name || "Cargo"}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[420px]">{p.description || "—"}</td>
                  <td className="px-5 py-3"><StatusPill tone={p.is_active !== false ? "success" : "muted"}>{p.is_active !== false ? "Ativo" : "Inativo"}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
