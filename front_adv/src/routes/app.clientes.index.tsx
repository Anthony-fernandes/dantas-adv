import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Plus, Filter, Download, Search, MoreHorizontal } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { clientes } from "@/lib/mock";

export const Route = createFileRoute("/app/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — JurisFlow" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const ativos = clientes.filter((c) => c.status === "Ativo").length;
  const prospects = clientes.filter((c) => c.status === "Prospect").length;
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        description="Pessoas físicas e jurídicas atendidas pelo escritório."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
            <Link to="/app/clientes/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              <Plus className="h-3.5 w-3.5" /> Novo cliente
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(clientes.length)} icon={Users} />
        <StatCard label="Ativos" value={String(ativos)} tone="success" />
        <StatCard label="Prospects" value={String(prospects)} tone="info" />
        <StatCard label="Novos (30d)" value="4" tone="warning" trend="+2" hint="vs. mês passado" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar por nome, CPF/CNPJ, cidade…" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] hover:bg-muted transition"><Filter className="h-3.5 w-3.5" /> Filtros</button>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-[13px]">
              <option>Todos os tipos</option><option>Pessoa Física</option><option>Pessoa Jurídica</option>
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-[13px]">
              <option>Todos os status</option><option>Ativo</option><option>Prospect</option><option>Inativo</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Documento</th>
                <th className="px-4 py-2.5 text-left font-medium">Cidade</th>
                <th className="px-4 py-2.5 text-right font-medium">Processos</th>
                <th className="px-4 py-2.5 text-left font-medium">Responsável</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition cursor-pointer">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/8 text-primary text-[11px] font-semibold">
                        {c.nome.split(" ").slice(0, 2).map((s) => s[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <Link to="/app/clientes/$id" params={{ id: c.id }} className="font-medium truncate hover:text-primary">{c.nome}</Link>
                        <p className="text-[11.5px] text-muted-foreground">{c.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-muted-foreground">{c.documento}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.cidade}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{c.processos}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.responsavel}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={c.status === "Ativo" ? "success" : c.status === "Prospect" ? "info" : "muted"}>{c.status}</StatusPill>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted transition"><MoreHorizontal className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12px] text-muted-foreground">
          <span>Mostrando 1–{clientes.length} de {clientes.length}</span>
          <div className="flex items-center gap-1">
            <button className="rounded-md border border-border px-2 py-1 disabled:opacity-40" disabled>‹</button>
            <span className="px-2">Página 1 de 1</span>
            <button className="rounded-md border border-border px-2 py-1 disabled:opacity-40" disabled>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}