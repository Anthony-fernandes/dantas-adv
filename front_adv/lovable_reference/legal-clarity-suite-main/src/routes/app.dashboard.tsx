import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Kpi, Card, CardHeader, Badge } from "@/components/ui-kit/PageKit";
import { TrendingUp, AlertTriangle, ArrowUpRight, Download } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const alerts = [
  { l: "danger", t: "3 prazos fatais nas próximas 24h", c: "Veja em Agenda · Prazos Críticos" },
  { l: "warning", t: "12 processos sem movimentação há mais de 30 dias", c: "Revisar carteira" },
  { l: "info", t: "5 novas publicações no DJE de São Paulo", c: "Importadas automaticamente" },
];

const activity = [
  { who: "Dra. Clara Nunes", what: "Protocolou réplica em", target: "1002345-82.2023 · Unilever S.A.", when: "há 12 min" },
  { who: "Dr. Marcos Vinícius", what: "Anexou parecer técnico em", target: "5098122-11.2024 · Banco do Brasil", when: "há 38 min" },
  { who: "Sistema", what: "Importou 14 publicações do", target: "DJE-SP", when: "há 1h" },
  { who: "Dr. Daniel Marques", what: "Aprovou minuta de", target: "Contrato de honorários #4421", when: "há 2h" },
  { who: "Dra. Helena Vasconcellos", what: "Registrou audiência de", target: "Cunha v. TechCorp", when: "há 3h" },
];

const distribuicao = [
  { area: "Cível", v: 412, p: 72 },
  { area: "Trabalhista", v: 298, p: 52 },
  { area: "Tributário", v: 184, p: 32 },
  { area: "Empresarial", v: 156, p: 27 },
  { area: "Família", v: 88, p: 15 },
];

function Dashboard() {
  return (
    <AppShell
      eyebrow="Painel · Visão Geral"
      title="Bom dia, Dr. Daniel."
      actions={
        <>
          <button className="px-4 h-10 border border-rule text-xs hover:bg-surface inline-flex items-center gap-2 rounded-md"><Download className="size-3.5" /> Relatório executivo</button>
          <button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest font-medium rounded-md">Novo processo</button>
        </>
      }
    >
      {/* Filtros */}
      <div className="mb-6 flex items-center gap-2 text-xs">
        <span className="eyebrow mr-2">Período:</span>
        {["Hoje", "7d", "30d", "Trimestre", "Ano"].map((p, i) => (
          <button key={p} className={`px-3 h-8 border rounded-md ${i===2?"bg-ink text-paper border-ink":"border-rule hover:bg-surface"}`}>{p}</button>
        ))}
        <span className="ml-4 text-ink-soft">Comparando com período anterior</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Processos Ativos" value="1.284" trend="↑ 4,2%" hint="vs mês anterior" />
        <Kpi label="Prazos em Aberto" value="42" hint="8 urgentes nas próximas 48h" />
        <Kpi label="Audiências (semana)" value="12" hint="3 fora da capital" />
        <Kpi label="Faturamento (mês)" value="R$ 412k" trend="↑ 8,1%" hint="meta: R$ 480k" />
      </div>

      {/* Alertas */}
      <Card className="mb-8">
        <CardHeader title="Alertas operacionais" eyebrow="Atenção imediata" />
        <div className="divide-y divide-rule">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Badge tone={a.l as any}>{a.l === "danger" ? "Crítico" : a.l === "warning" ? "Atenção" : "Info"}</Badge>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.t}</div>
                <div className="text-xs text-ink-soft">{a.c}</div>
              </div>
              <button className="text-[11px] font-mono-ui uppercase tracking-widest text-gold">Resolver →</button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Distribuição */}
        <Card className="lg:col-span-2">
          <CardHeader title="Distribuição por área de atuação" eyebrow="Carteira ativa" action={<button className="text-[11px] text-gold font-mono-ui uppercase tracking-widest">Detalhar →</button>} />
          <div className="p-6 space-y-5">
            {distribuicao.map((d) => (
              <div key={d.area}>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="font-medium">{d.area}</span>
                  <span className="text-ink-soft font-mono-ui text-xs">{d.v} processos · {d.p}% êxito</span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${(d.v/412)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rule-t p-6 grid grid-cols-3 gap-4 bg-surface-2/40">
            <div><div className="eyebrow mb-1">Tx. Êxito Geral</div><div className="font-display text-2xl">68,4%</div></div>
            <div><div className="eyebrow mb-1">Tempo médio</div><div className="font-display text-2xl">1,8 anos</div></div>
            <div><div className="eyebrow mb-1">Valor em causas</div><div className="font-display text-2xl">R$ 412M</div></div>
          </div>
        </Card>

        {/* Atividade */}
        <Card>
          <CardHeader title="Atividade recente" eyebrow="Últimas 24h" />
          <div className="divide-y divide-rule">
            {activity.map((a, i) => (
              <div key={i} className="px-5 py-4 text-xs">
                <div className="leading-relaxed">
                  <span className="font-semibold">{a.who}</span>{" "}
                  <span className="text-ink-soft">{a.what}</span>{" "}
                  <span className="font-mono-ui text-[11px]">{a.target}</span>
                </div>
                <div className="text-[10px] text-ink-soft mt-1 font-mono-ui uppercase tracking-wider">{a.when}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gráfico financeiro */}
      <Card className="mt-6">
        <CardHeader title="Faturamento × Inadimplência" eyebrow="Últimos 12 meses" action={<button className="text-[11px] text-gold font-mono-ui uppercase tracking-widest">Ver financeiro →</button>} />
        <div className="p-6">
          <div className="grid grid-cols-12 gap-2 h-44 items-end">
            {[280, 312, 295, 340, 318, 360, 388, 372, 401, 395, 420, 412].map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-full bg-ink rounded-t-sm" style={{ height: `${(v/450)*100}%` }} />
                <div className="text-[9px] font-mono-ui text-ink-soft">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
