import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Plus, Search, MoreHorizontal, Eye, Loader2 } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { ClienteDialog } from "@/components/shell/ClienteDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useList, clientName } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/clientes/")({
  head: () => ({ meta: [{ title: pageTitle("Clientes") }] }),
  component: ClientesPage,
});

function typeOf(c: any): "PF" | "PJ" {
  const t = String(c.type || c.tipo || "").toUpperCase();
  if (t === "PJ" || c.razao_social || c.cnpj) return "PJ";
  return "PF";
}
function statusOf(c: any) {
  return String(c.status || "ativo").toLowerCase();
}

function ClientesPage() {
  const navigate = useNavigate();
  const clients = useList<any>("clients");
  const processes = useList<any>("processes");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);

  const procByClient = useMemo(() => {
    const m: Record<string, number> = {};
    (processes.data ?? []).forEach((p) => {
      const cid = String(p.client || p.client_id || "");
      if (cid) m[cid] = (m[cid] || 0) + 1;
    });
    return m;
  }, [processes.data]);

  const rows = clients.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (typeFilter !== "all" && typeOf(c) !== typeFilter) return false;
      if (statusFilter !== "all" && statusOf(c) !== statusFilter) return false;
      if (!q) return true;
      return [clientName(c), c.document, c.doc, c.cpf, c.cnpj, c.email, c.city, c.cidade]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, search, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    ativos: rows.filter((c) => statusOf(c) !== "inativo").length,
    pj: rows.filter((c) => typeOf(c) === "PJ").length,
    pf: rows.filter((c) => typeOf(c) === "PF").length,
  }), [rows]);

  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        description="Pessoas físicas e jurídicas atendidas pelo escritório."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Novo cliente
          </button>
        }
      />

      <ClienteDialog open={open} onOpenChange={setOpen} onCreated={(c) => navigate({ to: "/app/clientes/$id", params: { id: String(c.id) } })} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={String(stats.total)} icon={Users} />
        <StatCard label="Ativos" value={String(stats.ativos)} tone="success" />
        <StatCard label="Pessoa jurídica" value={String(stats.pj)} tone="info" />
        <StatCard label="Pessoa física" value={String(stats.pf)} tone="warning" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ, cidade…" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-[13px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-[13px]">
            <option value="all">Todos os tipos</option><option value="PF">Pessoa Física</option><option value="PJ">Pessoa Jurídica</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-[13px]">
            <option value="all">Todos os status</option><option value="ativo">Ativo</option><option value="prospecto">Prospecto</option><option value="inativo">Inativo</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-4 py-2.5 text-left font-medium">Documento</th>
                <th className="px-4 py-2.5 text-left font-medium">Cidade</th>
                <th className="px-4 py-2.5 text-right font-medium">Processos</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.isLoading && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!clients.isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>
              )}
              {filtered.map((c) => {
                const name = clientName(c);
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition cursor-pointer" onClick={() => navigate({ to: "/app/clientes/$id", params: { id: String(c.id) } })}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/8 text-primary text-[11px] font-semibold">
                          {name.split(" ").slice(0, 2).map((s) => s[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium truncate hover:text-primary">{name}</span>
                          <p className="text-[11.5px] text-muted-foreground">{typeOf(c) === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-muted-foreground">{c.document || c.doc || c.cpf || c.cnpj || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.city || c.cidade || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{procByClient[String(c.id)] || 0}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={statusOf(c) === "inativo" ? "muted" : statusOf(c) === "prospecto" ? "info" : "success"}>{c.status || "Ativo"}</StatusPill>
                    </td>
                    <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted transition"><MoreHorizontal className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate({ to: "/app/clientes/$id", params: { id: String(c.id) } })}>
                            <Eye className="mr-2 h-4 w-4" /> Abrir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
