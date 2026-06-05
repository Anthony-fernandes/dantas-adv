import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader, Tabs, Badge, Kpi } from "@/components/ui-kit/PageKit";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";

export const Route = createFileRoute("/app/clients/$id")({ component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
  return (
    <AppShell>
      <div className="-mx-8 -mt-8 px-8 py-8 rule-b bg-surface mb-8">
        <div className="flex items-start gap-6">
          <div className="size-20 bg-ink text-paper grid place-items-center rounded-sm font-display text-3xl italic">A</div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge tone="dark">Pessoa Jurídica</Badge>
              <span className="font-mono-ui text-[11px] text-ink-soft">Cliente {id} · Desde 2014</span>
              <Badge tone="active">Ativo</Badge>
            </div>
            <h1 className="font-display text-4xl">Indústria Têxtil Andradina S.A.</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5"><Building2 className="size-3.5" /> CNPJ 12.334.556/0001-90</span>
              <span className="flex items-center gap-1.5"><Mail className="size-3.5" /> juridico@andradina.com.br</span>
              <span className="flex items-center gap-1.5"><Phone className="size-3.5" /> +55 11 4002-8922</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> Av. Paulista 1230, SP</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 h-9 border border-rule text-xs rounded-md">Enviar mensagem</button>
            <button className="px-3 h-9 bg-ink text-paper text-xs uppercase tracking-widest rounded-md">Novo processo</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Kpi label="Processos ativos" value="38" />
        <Kpi label="Valor em causas" value="R$ 12,4M" />
        <Kpi label="Honorários (ano)" value="R$ 1,8M" trend="↑ 14%" />
        <Kpi label="Em aberto (financeiro)" value="R$ 124k" hint="2 faturas vencidas" />
      </div>

      <Tabs items={["Resumo", "Processos", "Audiências", "Documentos", "Financeiro", "Portal", "Histórico"]} active="Resumo" />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8">
          <CardHeader title="Carteira de processos" eyebrow="Resumo executivo" />
          <table className="table-editorial">
            <thead><tr><th>CNJ</th><th>Processo</th><th>Status</th><th>Próximo prazo</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {[
                ["1002345-82.2023", "vs. União Federal", "active", "Hoje · 18h", "R$ 1.240.000"],
                ["5012003-90.2024", "vs. Fazenda Nacional", "active", "30/05", "R$ 12.400.000"],
                ["0098221-15.2022", "vs. Sindicato Têxtil", "neutral", "—", "R$ 880.000"],
                ["0044182-44.2021", "vs. Fornecedor Y", "success", "—", "R$ 320.000"],
              ].map((r, i) => (
                <tr key={i}>
                  <td className="font-mono-ui text-[11px] text-ink-soft">{r[0]}</td>
                  <td className="font-medium">{r[1]}</td>
                  <td><Badge tone={r[2] as any}>{r[2]==="active"?"Em andamento":r[2]==="success"?"Sentenciado":"Suspenso"}</Badge></td>
                  <td>{r[3]}</td>
                  <td className="text-right font-mono-ui text-xs">{r[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader title="Interlocutores" eyebrow="Cliente" />
            <div className="divide-y divide-rule">
              {[["Renata Vieira", "Diretora Jurídica"], ["Felipe Santos", "Gerente de Compliance"], ["Leila Mendes", "Financeiro"]].map(([n, c], i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="size-9 rounded-full bg-gold-soft grid place-items-center text-xs font-semibold">{(n as string).split(" ").map(w=>w[0]).join("")}</div>
                  <div><div className="text-sm font-medium">{n}</div><div className="text-[11px] text-ink-soft">{c}</div></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Histórico de relacionamento" eyebrow="Notas internas" />
            <div className="p-5 text-xs space-y-3 text-ink-soft">
              <p><span className="font-mono-ui uppercase">12 mai 2026:</span> Reunião trimestral com diretoria jurídica. Definida estratégia consolidada para passivo tributário.</p>
              <p><span className="font-mono-ui uppercase">02 abr 2026:</span> Renovação contratual aprovada — escopo expandido para compliance LGPD.</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
