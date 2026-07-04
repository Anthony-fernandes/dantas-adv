import { createFileRoute } from "@tanstack/react-router";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { financeiro, stats, fmtBRL, fmtBRLPreciso, fmtDate } from "@/lib/mock";

export const Route = createFileRoute("/app/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro — JurisFlow" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title="Fluxo financeiro"
        description="Contas a receber, contas a pagar, honorários e DRE do escritório."
        actions={
          <>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
              <Download className="h-3.5 w-3.5" /> Exportar DRE
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              <Plus className="h-3.5 w-3.5" /> Novo lançamento
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Receita do mês" value={fmtBRL(stats.receitaMes)} icon={DollarSign} tone="success" trend="+18%" />
        <StatCard label="A receber (30d)" value={fmtBRL(stats.aReceber)} icon={TrendingUp} tone="info" />
        <StatCard label="A pagar (30d)" value={fmtBRL(stats.aPagar)} icon={TrendingDown} tone="warning" />
        <StatCard label="Saldo projetado" value={fmtBRL(stats.aReceber - stats.aPagar)} icon={Wallet} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface-card lg:col-span-2 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Receita vs. Despesa</h2>
              <p className="text-[12px] text-muted-foreground">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Receita</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive/70" /> Despesa</span>
            </div>
          </div>
          <div className="mt-6 flex items-end gap-3 h-56">
            {[
              { m: "Fev", r: 62, d: 30 }, { m: "Mar", r: 58, d: 32 },
              { m: "Abr", r: 74, d: 34 }, { m: "Mai", r: 80, d: 36 },
              { m: "Jun", r: 88, d: 38 }, { m: "Jul", r: 95, d: 40 },
            ].map((b) => (
              <div key={b.m} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end gap-1 h-full">
                  <div className="flex-1 rounded-t bg-gradient-to-t from-success/70 to-success" style={{ height: `${b.r}%` }} />
                  <div className="flex-1 rounded-t bg-destructive/60" style={{ height: `${b.d}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{b.m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-[15px] font-semibold">Composição do mês</h2>
          <div className="mt-6 space-y-4">
            {[
              { l: "Honorários contratuais", v: 65, c: "bg-primary" },
              { l: "Sucumbência / êxito", v: 22, c: "bg-accent" },
              { l: "Consultoria", v: 10, c: "bg-info" },
              { l: "Outros", v: 3, c: "bg-muted-foreground/40" },
            ].map((s) => (
              <div key={s.l}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-foreground">{s.l}</span>
                  <span className="font-medium tabular-nums">{s.v}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${s.c} rounded-full`} style={{ width: `${s.v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">Lançamentos recentes</h2>
          <div className="flex rounded-md border border-border overflow-hidden text-[12.5px]">
            <button className="px-3 py-1.5 bg-primary text-primary-foreground">Todos</button>
            <button className="px-3 py-1.5 text-muted-foreground hover:bg-muted">A receber</button>
            <button className="px-3 py-1.5 text-muted-foreground hover:bg-muted">A pagar</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-4 py-2.5 text-left font-medium">Descrição</th>
                <th className="px-4 py-2.5 text-left font-medium">Cliente/Fornecedor</th>
                <th className="px-4 py-2.5 text-left font-medium">Vencimento</th>
                <th className="px-4 py-2.5 text-right font-medium">Valor</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {financeiro.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <div className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${f.tipo === "Receber" ? "text-success" : "text-destructive"}`}>
                      {f.tipo === "Receber" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {f.tipo}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{f.descricao}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(f.vencimento)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${f.tipo === "Receber" ? "text-success" : ""}`}>
                    {f.tipo === "Receber" ? "+" : "−"}{fmtBRLPreciso(f.valor)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill tone={f.status === "Pago" ? "success" : f.status === "Atrasado" ? "destructive" : "warning"}>{f.status}</StatusPill>
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