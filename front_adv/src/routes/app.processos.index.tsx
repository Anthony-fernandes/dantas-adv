import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Plus, Filter, Download, Search, MoreHorizontal, Kanban, List } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { processos, fmtBRL } from "@/lib/mock";

export const Route = createFileRoute("/app/processos/")({
  head: () => ({ meta: [{ title: "Processos — JurisFlow" }] }),
  component: ProcessosPage,
});

function ProcessosPage() {
  const total = processos.reduce((s, p) => s + p.valor, 0);
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Processos"
        description="Gestão completa do contencioso: andamentos, prazos, valor da causa e responsáveis."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
            <Link to="/app/processos/novo" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              <Plus className="h-3.5 w-3.5" /> Novo processo
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(processos.length)} icon={Gavel} />
        <StatCard label="Em andamento" value="4" tone="info" />
        <StatCard label="Suspensos" value="1" tone="warning" />
        <StatCard label="Valor total das causas" value={fmtBRL(total)} tone="success" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar por número, cliente, vara…" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] hover:bg-muted transition"><Filter className="h-3.5 w-3.5" /> Filtros avançados</button>
            <div className="flex rounded-md border border-border bg-card overflow-hidden">
              <button className="px-2.5 py-1.5 bg-primary text-primary-foreground"><List className="h-3.5 w-3.5" /></button>
              <button className="px-2.5 py-1.5 text-muted-foreground hover:bg-muted"><Kanban className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Número CNJ</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Área</th>
                <th className="px-4 py-2.5 text-left font-medium">Vara / Foro</th>
                <th className="px-4 py-2.5 text-left font-medium">Fase</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-left font-medium">Responsável</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processos.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-mono text-[12.5px] whitespace-nowrap"><Link to="/app/processos/$id" params={{ id: p.id }} className="text-primary hover:underline">{p.numero}</Link></td>
                  <td className="px-4 py-3 font-medium truncate max-w-[220px]">{p.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.area}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.vara}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-medium">{p.fase}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(p.valor)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={p.status === "Em andamento" ? "info" : p.status === "Novo" ? "success" : p.status === "Suspenso" ? "warning" : "muted"}>{p.status}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">{p.responsavel}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted transition"><MoreHorizontal className="h-4 w-4" /></button>
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