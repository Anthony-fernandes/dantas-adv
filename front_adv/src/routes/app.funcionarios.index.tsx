import { createFileRoute, Link } from "@tanstack/react-router";
import { UserSquare2, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtDate } from "@/lib/resources";

export const Route = createFileRoute("/app/funcionarios/")({
  head: () => ({ meta: [{ title: "Funcionários — JurisFlow" }] }),
  component: FuncionariosPage,
});

function FuncionariosPage() {
  const employees = useList<any>("employees");
  const rows = employees.data ?? [];

  return (
    <ModuleScaffold
      eyebrow="Gestão" title="Funcionários"
      description="Equipe do escritório, com cargo, contato e vínculo de login."
      icon={UserSquare2}
      stats={[
        { label: "Total", value: String(rows.length) },
        { label: "Ativos", value: String(rows.filter((e) => e.is_active !== false).length), tone: "success" },
      ]}
      actions={
        <Link to="/app/funcionarios/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Novo funcionário
        </Link>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Funcionário</th>
                <th className="px-4 py-2.5 text-left font-medium">Cargo</th>
                <th className="px-4 py-2.5 text-left font-medium">Contato</th>
                <th className="px-4 py-2.5 text-left font-medium">Admissão</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!employees.isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhum funcionário cadastrado.</td></tr>}
              {rows.map((e) => {
                const name = e.full_name || e.name || e.email || "Sem nome";
                return (
                  <tr key={e.id} className="hover:bg-muted/30 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/8 text-primary text-[11px] font-semibold">{name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}</span>
                        <span className="min-w-0"><p className="font-medium truncate">{name}</p><p className="text-[11.5px] text-muted-foreground truncate">{e.email || "—"}</p></span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.position_name || e.cargo || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(e.hire_date)}</td>
                    <td className="px-5 py-3"><StatusPill tone={e.is_active !== false ? "success" : "muted"}>{e.is_active !== false ? "Ativo" : "Inativo"}</StatusPill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
