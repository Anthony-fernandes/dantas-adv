import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { processos, fmtBRL } from "@/lib/mock";
import { Search } from "lucide-react";

export const Route = createFileRoute("/portal/processos/")({
  head: () => ({ meta: [{ title: "Meus processos — Portal" }] }),
  component: PortalProcessos,
});

function PortalProcessos() {
  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Meus processos" description="Acompanhe cada processo em andamento, com fase atual e último andamento." />
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar por número ou área…" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Número</th>
                <th className="px-4 py-2.5 text-left font-medium">Área</th>
                <th className="px-4 py-2.5 text-left font-medium">Fase</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Último andamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processos.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="px-5 py-3 font-mono text-[12.5px]"><Link to="/portal/processos/$id" params={{ id: p.id }} className="text-primary hover:underline">{p.numero}</Link></td>
                  <td className="px-4 py-3 font-medium">{p.area}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.fase}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(p.valor)}</td>
                  <td className="px-4 py-3"><StatusPill tone={p.status === "Em andamento" ? "info" : "muted"}>{p.status}</StatusPill></td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{p.ultimoAndamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}