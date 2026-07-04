import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, DollarSign, Users, Building2, Zap } from "lucide-react";
import { PageHeader, StatCard } from "@/components/shell/PageHeader";

export const Route = createFileRoute("/master/metrics")({
  head: () => ({ meta: [{ title: "Métricas — Master JurisFlow" }] }),
  component: MasterMetrics,
});

function MasterMetrics() {
  const monthly = [22, 34, 41, 39, 48, 55, 63, 71, 68, 82, 91, 104];
  const max = Math.max(...monthly);
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Console Master" title="Métricas do produto" description="MRR, crescimento, engajamento e saúde da plataforma."
        actions={<select className="rounded-md border border-border bg-card px-3 py-2 text-[13px]"><option>Últimos 12 meses</option><option>Últimos 30 dias</option><option>Este ano</option></select>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MRR" value="R$ 284.500" tone="success" icon={DollarSign} trend="+12.4%" hint="MoM" />
        <StatCard label="Tenants ativos" value="187" tone="info" icon={Building2} trend="+8" hint="este mês" />
        <StatCard label="Usuários ativos (DAU)" value="1.024" icon={Users} trend="+6.1%" />
        <StatCard label="Churn" value="1.8%" tone="warning" icon={TrendingUp} hint="dentro da meta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-[15px]">Novos tenants por mês</h3>
              <p className="text-[12px] text-muted-foreground">Últimos 12 meses</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-end gap-2 h-56">
            {monthly.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition" style={{ height: `${(v / max) * 100}%` }} />
                <span className="text-[10.5px] text-muted-foreground">{["Jul","Ago","Set","Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai","Jun"][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display font-semibold text-[15px] mb-4">Distribuição por plano</h3>
          <ul className="space-y-4">
            {[
              { p: "Starter", pct: 42, cor: "bg-info" },
              { p: "Professional", pct: 34, cor: "bg-primary" },
              { p: "Business", pct: 18, cor: "bg-success" },
              { p: "Enterprise", pct: 6, cor: "bg-warning" },
            ].map((r) => (
              <li key={r.p}>
                <div className="flex justify-between text-[12.5px] mb-1"><span>{r.p}</span><span className="tabular-nums font-medium">{r.pct}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full ${r.cor}`} style={{ width: `${r.pct}%` }} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-primary mb-2"><Zap className="h-4 w-4" /><p className="text-[11px] uppercase tracking-wider">Engajamento</p></div>
          <p className="font-display text-3xl font-semibold tabular-nums">73%</p>
          <p className="text-[12.5px] text-muted-foreground mt-1">DAU/MAU no último mês</p>
        </div>
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-info mb-2"><TrendingUp className="h-4 w-4" /><p className="text-[11px] uppercase tracking-wider">NPS</p></div>
          <p className="font-display text-3xl font-semibold tabular-nums">62</p>
          <p className="text-[12.5px] text-muted-foreground mt-1">Excelente para SaaS jurídico.</p>
        </div>
        <div className="surface-card p-5">
          <div className="flex items-center gap-2 text-success mb-2"><DollarSign className="h-4 w-4" /><p className="text-[11px] uppercase tracking-wider">LTV/CAC</p></div>
          <p className="font-display text-3xl font-semibold tabular-nums">4.8×</p>
          <p className="text-[12.5px] text-muted-foreground mt-1">Payback em 6,2 meses.</p>
        </div>
      </div>
    </div>
  );
}