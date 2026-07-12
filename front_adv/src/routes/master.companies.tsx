import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, MoreHorizontal } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { BRAND, pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/master/companies")({
  head: () => ({ meta: [{ title: pageTitle("Empresas — Admin Master") }] }),
  component: MasterCompanies,
});

const empresas = [
  { id: "e-01", nome: "Souza & Advogados Associados", plano: "Enterprise", usuarios: 24, criado: "12/01/2024", mrr: "R$ 4.980", status: "Ativo" },
  { id: "e-02", nome: "Lima Advocacia Tributária", plano: "Business", usuarios: 12, criado: "03/08/2024", mrr: "R$ 2.480", status: "Ativo" },
  { id: "e-03", nome: "Palma & Meireles", plano: "Business", usuarios: 8, criado: "22/11/2024", mrr: "R$ 1.680", status: "Ativo" },
  { id: "e-04", nome: "Prado Advocacia", plano: "Starter", usuarios: 3, criado: "18/03/2026", mrr: "R$ 480", status: "Trial" },
  { id: "e-05", nome: "Freitas Escritório Jurídico", plano: "Business", usuarios: 15, criado: "05/06/2025", mrr: "R$ 2.480", status: "Suspenso" },
];

function MasterCompanies() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Master" title="Empresas na plataforma" description={`Todos os escritórios que utilizam o ${BRAND.name}.`}
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Cadastrar empresa
          </button>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Empresas ativas" value="1.204" icon={Building2} tone="success" />
        <StatCard label="Em trial" value="42" tone="warning" />
        <StatCard label="MRR total" value="R$ 4,8M" tone="info" />
        <StatCard label="Churn (30d)" value="1,2%" tone="destructive" />
      </div>

      <div className="surface-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 text-left font-medium">Empresa</th>
              <th className="px-4 py-2.5 text-left font-medium">Plano</th>
              <th className="px-4 py-2.5 text-right font-medium">Usuários</th>
              <th className="px-4 py-2.5 text-right font-medium">MRR</th>
              <th className="px-4 py-2.5 text-left font-medium">Criado em</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {empresas.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/8 text-primary text-[11px] font-semibold">
                      {e.nome.split(" ").slice(0, 2).map((s) => s[0]).join("")}
                    </div>
                    <p className="font-medium">{e.nome}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-medium">{e.plano}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{e.usuarios}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{e.mrr}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.criado}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={e.status === "Ativo" ? "success" : e.status === "Trial" ? "info" : "destructive"}>{e.status}</StatusPill>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}