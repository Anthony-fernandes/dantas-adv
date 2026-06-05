import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalShell } from "@/components/shells/PortalShell";
import { Card, CardHeader, Kpi, Badge } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/portal/")({ component: PortalHome });

function PortalHome() {
  return (
    <PortalShell eyebrow="Portal · Bem-vinda" title="Olá, Mariana.">
      <p className="text-ink-soft mb-8 max-w-2xl">Acompanhe o andamento de seus processos, documentos e pagamentos. Sua equipe responsável é a Dra. Helena Vasconcellos.</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Kpi label="Processos ativos" value="3" />
        <Kpi label="Próxima audiência" value="22 mai" hint="Andradina v. União" />
        <Kpi label="Em aberto" value="R$ 4.200" hint="1 fatura" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Atualizações recentes" eyebrow="Últimos 7 dias" />
          <div className="divide-y divide-rule">
            {[
              ["Réplica protocolada", "Andradina v. União", "hoje"],
              ["Nova mensagem da equipe", "Sobre estratégia de defesa", "ontem"],
              ["Documento compartilhado", "Parecer pericial", "12 mai"],
            ].map((r, i) => (
              <div key={i} className="px-5 py-4">
                <div className="text-sm font-medium">{r[0]}</div>
                <div className="text-xs text-ink-soft">{r[1]} · {r[2]}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Meus processos" eyebrow="Acesso rápido" />
          <div className="divide-y divide-rule">
            {[
              { c: "1002345-82.2023", t: "Andradina v. União", s: "active" },
              { c: "5012003-90.2024", t: "v. Fazenda Nacional", s: "active" },
              { c: "0044290-15.2023", t: "v. Costa, F.M.", s: "neutral" },
            ].map((p) => (
              <Link to="/portal/processes/$id" params={{ id: p.c }} key={p.c} className="flex items-center justify-between px-5 py-4 hover:bg-paper">
                <div>
                  <div className="text-sm font-medium">{p.t}</div>
                  <div className="font-mono-ui text-[10px] text-ink-soft">{p.c}</div>
                </div>
                <Badge tone={p.s as any}>{p.s === "active" ? "Em andamento" : "Suspenso"}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}
