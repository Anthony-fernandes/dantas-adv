import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, Badge, FilterBar, FilterChip } from "@/components/ui-kit/PageKit";
import { Plus, Search } from "lucide-react";

export const Route = createFileRoute("/app/employees")({ component: Employees });

const rows = [
  ["Dr. Daniel Marques", "Sócio-Diretor", "Empresarial", "daniel@silvabastos.adv", "active"],
  ["Dra. Helena Vasconcellos", "Sócia", "Cível", "helena@silvabastos.adv", "active"],
  ["Dra. Clara Nunes", "Advogada Sênior", "Tributário", "clara@silvabastos.adv", "active"],
  ["Dr. Marcos Vinícius", "Advogado Sênior", "Cível", "marcos@silvabastos.adv", "active"],
  ["Dr. André Salles", "Advogado Pleno", "Trabalhista", "andre@silvabastos.adv", "active"],
  ["Ana Lima", "Estagiária", "Cível", "ana@silvabastos.adv", "neutral"],
];
function Employees() {
  return (
    <AppShell eyebrow="Cadastros · Funcionários" title="Equipe do escritório" actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Plus className="size-3.5" /> Novo funcionário</button>}>
      <FilterBar>
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" /><input placeholder="Buscar por nome, cargo, área..." className="w-full bg-surface border border-rule rounded-md pl-9 pr-3 h-9 text-[13px]" /></div>
        <FilterChip active>Ativos · 86</FilterChip><FilterChip>Inativos · 4</FilterChip>
      </FilterBar>
      <Card>
        <table className="table-editorial">
          <thead><tr><th>Nome</th><th>Cargo</th><th>Área</th><th>E-mail</th><th>Status</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}><td className="font-medium">{r[0]}</td><td>{r[1]}</td><td className="text-ink-soft">{r[2]}</td><td className="font-mono-ui text-[11px] text-ink-soft">{r[3]}</td><td><Badge tone={r[4] as any}>{r[4]==="active"?"Ativo":"Pendente"}</Badge></td></tr>)}</tbody>
        </table>
      </Card>
    </AppShell>
  );
}
