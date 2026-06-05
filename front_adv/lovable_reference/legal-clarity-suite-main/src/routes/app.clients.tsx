import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, FilterBar, FilterChip, Badge } from "@/components/ui-kit/PageKit";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/app/clients")({ component: ClientList });

const clients = [
  { id: "C-0001", name: "Indústria Têxtil Andradina S.A.", type: "PJ", since: "2014", proc: 38, value: "R$ 12,4M", status: "active" },
  { id: "C-0002", name: "NorteSul Logística Ltda", type: "PJ", since: "2018", proc: 22, value: "R$ 4,8M", status: "active" },
  { id: "C-0003", name: "Banco Aurora Financiamentos", type: "PJ", since: "2021", proc: 154, value: "R$ 28,1M", status: "active" },
  { id: "C-0004", name: "Mariana Costa de Almeida", type: "PF", since: "2024", proc: 3, value: "R$ 280k", status: "active" },
  { id: "C-0005", name: "Construtora Alfa S.A.", type: "PJ", since: "2019", proc: 18, value: "R$ 5,2M", status: "warning" },
  { id: "C-0006", name: "Holding Vasconcellos & Cia", type: "PJ", since: "2009", proc: 45, value: "R$ 18,8M", status: "active" },
  { id: "C-0007", name: "Roberto Yamaguchi", type: "PF", since: "2015", proc: 6, value: "R$ 720k", status: "neutral" },
];

function ClientList() {
  return (
    <AppShell
      eyebrow="Jurídico · Clientes"
      title="Carteira de clientes"
      actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest font-medium inline-flex items-center gap-2 rounded-md"><Plus className="size-3.5" /> Novo cliente</button>}
    >
      <FilterBar>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
          <input placeholder="Nome, CPF/CNPJ, e-mail..." className="w-full bg-surface border border-rule rounded-md pl-9 pr-3 h-9 text-[13px]" />
        </div>
        <FilterChip active>Todos · 240</FilterChip>
        <FilterChip>PJ · 184</FilterChip>
        <FilterChip>PF · 56</FilterChip>
        <FilterChip>Inadimplentes · 8</FilterChip>
      </FilterBar>
      <Card>
        <table className="table-editorial">
          <thead><tr><th>ID</th><th>Cliente</th><th>Tipo</th><th>Desde</th><th>Processos</th><th>Valor agregado</th><th>Status</th></tr></thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="font-mono-ui text-[11px] text-ink-soft">{c.id}</td>
                <td className="font-medium"><Link to="/app/clients/$id" params={{ id: c.id }} className="hover:text-gold">{c.name}</Link></td>
                <td><Badge tone="neutral">{c.type}</Badge></td>
                <td className="text-ink-soft">{c.since}</td>
                <td className="font-mono-ui text-xs">{c.proc}</td>
                <td className="font-mono-ui text-xs">{c.value}</td>
                <td><Badge tone={c.status as any}>{c.status === "active" ? "Ativo" : c.status === "warning" ? "Atenção" : "Inativo"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
