import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, FilterBar, FilterChip, Badge } from "@/components/ui-kit/PageKit";
import { Search, SlidersHorizontal, Plus, Download } from "lucide-react";

export const Route = createFileRoute("/app/processes")({ component: ProcessList });

const rows = [
  { code: "1002345-82.2023.8.26.0100", title: "Indústria Têxtil Andradina vs. União Federal", area: "Tributário", status: "active", deadline: "Hoje · 18h", responsible: "Dr. Marcos Vinícius", value: "R$ 1.240.000" },
  { code: "5098122-11.2024.4.03.0100", title: "Banco do Brasil vs. Fintech Aurora S.A.", area: "Empresarial", status: "warning", deadline: "Amanhã · 23h59", responsible: "Dra. Clara Nunes", value: "R$ 4.880.000" },
  { code: "0044290-15.2023.5.02.0301", title: "Costa, F. M. vs. NorteSul Logística Ltda", area: "Trabalhista", status: "active", deadline: "18/05", responsible: "Dr. André Salles", value: "R$ 320.000" },
  { code: "1029384-55.2023.8.26.0100", title: "Cunha vs. TechCorp International Ltda.", area: "Cível", status: "success", deadline: "—", responsible: "Dra. Helena Vasconcellos", value: "R$ 450.000" },
  { code: "0029981-72.2024.8.19.0001", title: "Construtora Alfa S.A. vs. Condomínio Sol Poente", area: "Cível", status: "warning", deadline: "22/05", responsible: "Dr. Marcos Vinícius", value: "R$ 880.000" },
  { code: "5012003-90.2024.4.03.6182", title: "Holding Vasconcellos & Cia vs. Fazenda Nacional", area: "Tributário", status: "active", deadline: "30/05", responsible: "Dra. Clara Nunes", value: "R$ 12.400.000" },
  { code: "0099182-44.2022.5.15.0011", title: "Sindicato Têxtil vs. Confecções Andradina", area: "Trabalhista", status: "neutral", deadline: "—", responsible: "Dr. André Salles", value: "R$ 2.100.000" },
  { code: "1099221-08.2023.8.26.0100", title: "Vasconcellos & Cia vs. Cliente PF", area: "Cível", status: "danger", deadline: "Atrasado · 2d", responsible: "Dra. Helena Vasconcellos", value: "R$ 88.000" },
];

const tone = (s: string) => s === "active" ? "active" : s === "success" ? "success" : s === "warning" ? "warning" : s === "danger" ? "danger" : "neutral";
const label = (s: string) => s === "active" ? "Em andamento" : s === "success" ? "Sentenciado" : s === "warning" ? "Com prazo" : s === "danger" ? "Atrasado" : "Suspenso";

function ProcessList() {
  return (
    <AppShell
      eyebrow="Jurídico · Processos"
      title="Carteira de processos"
      actions={
        <>
          <button className="px-4 h-10 border border-rule text-xs hover:bg-surface inline-flex items-center gap-2 rounded-md"><Download className="size-3.5" /> Exportar</button>
          <button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest font-medium inline-flex items-center gap-2 rounded-md"><Plus className="size-3.5" /> Novo processo</button>
        </>
      }
    >
      <FilterBar>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-soft" />
          <input placeholder="Número, parte, advogado..." className="w-full bg-surface border border-rule rounded-md pl-9 pr-3 h-9 text-[13px]" />
        </div>
        <FilterChip active>Todos · 1.284</FilterChip>
        <FilterChip>Ativos · 982</FilterChip>
        <FilterChip>Suspensos · 124</FilterChip>
        <FilterChip>Sentenciados · 156</FilterChip>
        <FilterChip>Arquivados · 22</FilterChip>
        <button className="ml-auto px-3 h-9 border border-rule rounded-md text-xs inline-flex items-center gap-2"><SlidersHorizontal className="size-3.5" /> Filtros avançados</button>
      </FilterBar>

      <Card>
        <table className="table-editorial">
          <thead>
            <tr>
              <th>Número CNJ</th>
              <th>Processo / Partes</th>
              <th>Área</th>
              <th>Status</th>
              <th>Próximo prazo</th>
              <th>Responsável</th>
              <th className="text-right">Valor da causa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code}>
                <td className="font-mono-ui text-[11px] text-ink-soft whitespace-nowrap">{r.code}</td>
                <td className="font-medium max-w-md">
                  <Link to="/app/processes/$id" params={{ id: r.code }} className="hover:text-gold">{r.title}</Link>
                </td>
                <td className="text-ink-soft">{r.area}</td>
                <td><Badge tone={tone(r.status) as any}>{label(r.status)}</Badge></td>
                <td className={r.status === "danger" ? "text-danger font-medium" : r.status === "warning" ? "font-medium" : ""}>{r.deadline}</td>
                <td className="text-ink-soft text-xs">{r.responsible}</td>
                <td className="text-right font-mono-ui text-xs">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 rule-t flex items-center justify-between text-xs text-ink-soft bg-surface-2/40">
          <span>Mostrando 1–8 de 1.284 processos</span>
          <div className="flex gap-1">
            <button className="px-2.5 h-7 border border-rule rounded">←</button>
            {[1,2,3,4,5].map(p => <button key={p} className={`px-2.5 h-7 border rounded ${p===1?"bg-ink text-paper border-ink":"border-rule"}`}>{p}</button>)}
            <button className="px-2.5 h-7 border border-rule rounded">→</button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
