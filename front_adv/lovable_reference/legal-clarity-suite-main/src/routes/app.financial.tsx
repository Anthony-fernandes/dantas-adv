import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader, Kpi, Tabs, Badge } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/app/financial")({ component: Financial });

function Financial() {
  return (
    <AppShell eyebrow="Financeiro · Visão Geral" title="Saúde financeira">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Kpi label="Faturamento (mês)" value="R$ 412k" trend="↑ 8,1%" hint="meta: R$ 480k" />
        <Kpi label="A receber" value="R$ 1,8M" hint="124 faturas" />
        <Kpi label="A pagar (30d)" value="R$ 280k" hint="42 lançamentos" />
        <Kpi label="Inadimplência" value="3,4%" trend="↓ 0,8pp" hint="vs trimestre" />
      </div>

      <Card className="mb-6">
        <CardHeader title="Faturamento × Recebimento" eyebrow="Últimos 12 meses" />
        <div className="p-6">
          <div className="grid grid-cols-12 gap-3 h-52 items-end">
            {[280, 312, 295, 340, 318, 360, 388, 372, 401, 395, 420, 412].map((v, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group">
                <div className="w-full flex gap-0.5 items-end h-44">
                  <div className="flex-1 bg-ink rounded-t-sm" style={{ height: `${(v/450)*100}%` }} />
                  <div className="flex-1 bg-gold/70 rounded-t-sm" style={{ height: `${((v*0.85)/450)*100}%` }} />
                </div>
                <div className="text-[9px] font-mono-ui text-ink-soft">{["JUN","JUL","AGO","SET","OUT","NOV","DEZ","JAN","FEV","MAR","ABR","MAI"][i]}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-6 text-xs text-ink-soft">
            <div className="flex items-center gap-2"><span className="size-3 bg-ink rounded-sm" /> Faturado</div>
            <div className="flex items-center gap-2"><span className="size-3 bg-gold/70 rounded-sm" /> Recebido</div>
          </div>
        </div>
      </Card>

      <Tabs items={["A Receber", "A Pagar", "Pagamentos"]} active="A Receber" />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8">
          <CardHeader title="Contas a receber" eyebrow="Próximos 30 dias" />
          <table className="table-editorial">
            <thead><tr><th>Fatura</th><th>Cliente</th><th>Vencimento</th><th>Status</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {[
                ["#4421", "Indústria Andradina", "16/05", "danger", "Vencida 2d", "R$ 88.000"],
                ["#4422", "NorteSul Logística", "20/05", "warning", "Vence em 4d", "R$ 42.000"],
                ["#4423", "Banco Aurora", "25/05", "active", "Em dia", "R$ 188.000"],
                ["#4424", "Holding Vasconcellos", "30/05", "active", "Em dia", "R$ 124.000"],
                ["#4425", "Construtora Alfa", "05/06", "active", "Em dia", "R$ 96.000"],
              ].map((r, i) => (
                <tr key={i}>
                  <td className="font-mono-ui text-xs">{r[0]}</td>
                  <td className="font-medium">{r[1]}</td>
                  <td>{r[2]}</td>
                  <td><Badge tone={r[3] as any}>{r[4]}</Badge></td>
                  <td className="text-right font-mono-ui text-xs">{r[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="col-span-4">
          <CardHeader title="Agenda da semana" eyebrow="Movimentações financeiras" />
          <div className="p-5 space-y-3">
            {[
              { d: "Seg 18", t: "Recebimento Aurora", v: "+ R$ 188k", neg: false },
              { d: "Ter 19", t: "Folha de pagamento", v: "− R$ 124k", neg: true },
              { d: "Qua 20", t: "Recebimento NorteSul", v: "+ R$ 42k", neg: false },
              { d: "Qui 21", t: "Aluguel sede SP", v: "− R$ 38k", neg: true },
              { d: "Sex 22", t: "INSS / Tributos", v: "− R$ 22k", neg: true },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-rule pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-xs font-mono-ui text-ink-soft uppercase">{r.d}</div>
                  <div>{r.t}</div>
                </div>
                <div className={`font-mono-ui text-sm ${r.neg ? "text-danger" : "text-success"}`}>{r.v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
