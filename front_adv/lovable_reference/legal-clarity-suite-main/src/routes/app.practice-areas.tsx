import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader, Kpi } from "@/components/ui-kit/PageKit";
import { Scale, Briefcase, Building2, Gavel, FileText, Shield, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/practice-areas")({ component: PracticeAreas });

const areas = [
  { i: Scale, n: "Contencioso Cível", v: 412, e: 72, r: "R$ 8,4M", l: "Dr. Marcos Vinícius" },
  { i: Briefcase, n: "Empresarial & M&A", v: 156, e: 81, r: "R$ 12,1M", l: "Dr. Daniel Marques" },
  { i: Building2, n: "Tributário", v: 184, e: 64, r: "R$ 5,8M", l: "Dra. Clara Nunes" },
  { i: Gavel, n: "Trabalhista", v: 298, e: 68, r: "R$ 4,2M", l: "Dr. André Salles" },
  { i: FileText, n: "Contratos", v: 88, e: 92, r: "R$ 2,9M", l: "Dra. Helena Vasconcellos" },
  { i: Shield, n: "Compliance & LGPD", v: 42, e: 88, r: "R$ 1,8M", l: "Dra. Eliana Macedo" },
];

function PracticeAreas() {
  const [sel, setSel] = useState(0);
  const a = areas[sel];
  return (
    <AppShell eyebrow="Jurídico · Áreas de Atuação" title="Distribuição por especialidade">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Kpi label="Áreas ativas" value="6" />
        <Kpi label="Total de processos" value="1.180" />
        <Kpi label="Tx. êxito média" value="77,5%" trend="↑ 2,1pp" />
        <Kpi label="Faturamento agregado" value="R$ 35,2M" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <Card>
            <CardHeader title="Áreas de atuação" eyebrow="Lista" />
            <div className="divide-y divide-rule">
              {areas.map((ar, i) => (
                <button key={ar.n} onClick={() => setSel(i)} className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-paper transition-colors ${i===sel?"bg-paper":""}`}>
                  <div className={`size-10 grid place-items-center rounded-sm border ${i===sel?"bg-ink text-paper border-ink":"border-rule"}`}>
                    <ar.i className="size-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{ar.n}</div>
                    <div className="text-xs text-ink-soft">{ar.v} processos · {ar.e}% êxito · Lider: {ar.l}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono-ui">{ar.r}</div>
                    <div className="text-ink-soft text-[10px]">faturamento</div>
                  </div>
                  <ChevronRight className="size-4 text-ink-soft" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-5 space-y-4">
          <Card>
            <CardHeader title={a.n} eyebrow="Detalhe da área" />
            <div className="p-5 grid grid-cols-2 gap-4">
              <div><div className="eyebrow mb-1">Processos</div><div className="font-display text-3xl">{a.v}</div></div>
              <div><div className="eyebrow mb-1">Êxito</div><div className="font-display text-3xl">{a.e}%</div></div>
              <div><div className="eyebrow mb-1">Faturamento</div><div className="font-display text-2xl">{a.r}</div></div>
              <div><div className="eyebrow mb-1">Líder</div><div className="text-sm font-medium pt-2">{a.l}</div></div>
            </div>
            <div className="rule-t p-5">
              <div className="eyebrow mb-3">Equipe alocada</div>
              <div className="flex -space-x-2">
                {["DM","CN","MV","HV","AS"].map((n, i) => (
                  <div key={i} className="size-9 rounded-full bg-gold-soft border-2 border-surface grid place-items-center text-[11px] font-semibold">{n}</div>
                ))}
                <div className="size-9 rounded-full bg-surface-2 border-2 border-surface grid place-items-center text-[10px]">+8</div>
              </div>
            </div>
            <div className="rule-t p-5">
              <div className="eyebrow mb-3">Distribuição por status</div>
              <div className="space-y-2">
                {[["Em andamento", 68], ["Suspenso", 12], ["Sentenciado", 18], ["Arquivado", 2]].map(([l, p]) => (
                  <div key={l as string}>
                    <div className="flex justify-between text-xs mb-1"><span>{l}</span><span className="text-ink-soft font-mono-ui">{p}%</span></div>
                    <div className="h-1 bg-surface-2 rounded"><div className="h-full bg-ink rounded" style={{ width: `${p}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
