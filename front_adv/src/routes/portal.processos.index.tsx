import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/shell/PageHeader";
import { useList, fmtBRL, humanize } from "@/lib/resources";

export const Route = createFileRoute("/portal/processos/")({
  head: () => ({ meta: [{ title: "Meus processos — Portal" }] }),
  component: PortalProcessos,
});

function PortalProcessos() {
  const processes = useList<any>("processes");
  const [search, setSearch] = useState("");
  const rows = processes.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => [p.cnj, p.area].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Portal" title="Meus processos" description="Acompanhe cada processo em andamento, com fase atual." />
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número ou área…" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Número CNJ</th>
                <th className="px-4 py-2.5 text-left font-medium">Área</th>
                <th className="px-4 py-2.5 text-left font-medium">Fase</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processes.isLoading && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!processes.isLoading && filtered.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhum processo encontrado.</td></tr>}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 cursor-pointer">
                  <td className="px-5 py-3 font-mono text-[12.5px]"><Link to="/portal/processos/$id" params={{ id: String(p.id) }} className="text-primary hover:underline">{p.cnj || "—"}</Link></td>
                  <td className="px-4 py-3 font-medium">{p.area || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{humanize(p.phase)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(p.cause_value)}</td>
                  <td className="px-5 py-3"><StatusPill tone="info">{p.status || "—"}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
