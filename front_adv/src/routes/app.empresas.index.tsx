import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";
import { useAuth } from "@/lib/auth";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/empresas/")({
  head: () => ({ meta: [{ title: pageTitle("Empresas") }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { tenants, activeTenantId } = useAuth();

  return (
    <ModuleScaffold
      eyebrow="Administração" title="Empresas"
      description="Escritórios (tenants) aos quais você tem acesso."
      icon={Building2}
      stats={[{ label: "Empresas", value: String(tenants.length) }]}
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Empresa</th>
                <th className="px-4 py-2.5 text-left font-medium">Identificador</th>
                <th className="px-5 py-2.5 text-left font-medium">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.length === 0 && <tr><td colSpan={3} className="px-5 py-10 text-center text-muted-foreground">Nenhuma empresa disponível.</td></tr>}
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{t.slug || t.id}</td>
                  <td className="px-5 py-3">
                    <StatusPill tone={t.id === activeTenantId ? "success" : "muted"}>{t.id === activeTenantId ? "Ativa (atual)" : "Disponível"}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
