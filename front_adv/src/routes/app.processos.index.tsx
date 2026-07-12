import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Gavel, Plus, Search, MoreHorizontal, Eye, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { ProcessoDialog } from "@/components/shell/ProcessoDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useList, fmtBRL, clientName } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/processos/")({
  head: () => ({ meta: [{ title: pageTitle("Processos") }] }),
  component: ProcessosPage,
});

function isOpen(status?: string | null) {
  const s = String(status || "").toLowerCase();
  return !["finalizado", "arquivado", "encerrado"].includes(s);
}

function statusTone(status?: string | null) {
  const s = String(status || "").toLowerCase();
  if (s === "suspenso") return "warning";
  if (s === "novo" || s === "pre_processual") return "success";
  if (["finalizado", "arquivado", "encerrado"].includes(s)) return "muted";
  return "info";
}

function ProcessosPage() {
  const navigate = useNavigate();
  const processes = useList<any>("processes", { ordering: "-updated_at" });
  const clients = useList<any>("clients");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const clientMap = useMemo(
    () => Object.fromEntries((clients.data ?? []).map((c) => [String(c.id), clientName(c)])),
    [clients.data],
  );

  const rows = processes.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (statusFilter !== "all" && String(p.status || "").toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      const client = p.client_name || clientMap[String(p.client)] || "";
      return [p.cnj, client, p.court, p.court_division, p.area, p.defendant]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, search, statusFilter, clientMap]);

  const stats = useMemo(() => {
    const total = rows.length;
    const emAndamento = rows.filter((p) => String(p.status || "").toLowerCase() === "em_andamento").length;
    const suspensos = rows.filter((p) => String(p.status || "").toLowerCase() === "suspenso").length;
    const valor = rows.reduce((s, p) => s + Number(p.cause_value || 0), 0);
    return { total, emAndamento, suspensos, valor };
  }, [rows]);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Contencioso"
        title="Processos"
        description="Gestão completa do contencioso: andamentos, prazos, valor da causa e responsáveis."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo processo
          </button>
        }
      />

      <ProcessoDialog open={open} onOpenChange={setOpen} onCreated={(p) => navigate({ to: "/app/processos/$id", params: { id: String(p.id) } })} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(stats.total)} icon={Gavel} />
        <StatCard label="Em andamento" value={String(stats.emAndamento)} tone="info" />
        <StatCard label="Suspensos" value={String(stats.suspensos)} tone="warning" />
        <StatCard label="Valor total das causas" value={fmtBRL(stats.valor)} tone="success" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por CNJ, cliente, vara, área…"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:border-ring"
          >
            <option value="all">Todos os status</option>
            <option value="em_andamento">Em andamento</option>
            <option value="pre_processual">Pré-processual</option>
            <option value="suspenso">Suspenso</option>
            <option value="finalizado">Finalizado</option>
            <option value="arquivado">Arquivado</option>
          </select>
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
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processes.isLoading && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td></tr>
              )}
              {!processes.isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">Nenhum processo encontrado.</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition cursor-pointer" onClick={() => navigate({ to: "/app/processos/$id", params: { id: String(p.id) } })}>
                  <td className="px-5 py-3 font-mono text-[12.5px] whitespace-nowrap">
                    <span className="text-primary hover:underline">{p.cnj || "—"}</span>
                  </td>
                  <td className="px-4 py-3 font-medium truncate max-w-[220px]">{p.client_name || clientMap[String(p.client)] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.area || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px]">{[p.court_division, p.court].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-medium capitalize">{p.phase || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{fmtBRL(p.cause_value)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(p.status) as any}>{p.status || "—"}</StatusPill>
                  </td>
                  <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted transition"><MoreHorizontal className="h-4 w-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate({ to: "/app/processos/$id", params: { id: String(p.id) } })}>
                          <Eye className="mr-2 h-4 w-4" /> Abrir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
