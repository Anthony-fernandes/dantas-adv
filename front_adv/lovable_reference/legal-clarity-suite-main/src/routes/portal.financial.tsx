import { createFileRoute } from "@tanstack/react-router";
import { PortalShell } from "@/components/shells/PortalShell";
import { Card, Kpi, Badge } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/portal/financial")({ component: PortalFin });

function PortalFin() {
  return (
    <PortalShell eyebrow="Portal" title="Financeiro">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Kpi label="Em aberto" value="R$ 4.200" hint="1 fatura" />
        <Kpi label="Pago no ano" value="R$ 28.400" />
        <Kpi label="Próximo vencimento" value="20/05" />
      </div>
      <Card>
        <table className="table-editorial">
          <thead><tr><th>Fatura</th><th>Descrição</th><th>Vencimento</th><th>Status</th><th className="text-right">Valor</th></tr></thead>
          <tbody>{[
            ["#4422", "Honorários · maio/2026", "20/05", "warning", "R$ 4.200"],
            ["#4380", "Honorários · abril/2026", "20/04", "success", "R$ 4.200"],
            ["#4321", "Honorários · março/2026", "20/03", "success", "R$ 4.200"],
          ].map((r, i) => (
            <tr key={i}><td className="font-mono-ui text-xs">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td><Badge tone={r[3] as any}>{r[3]==="warning"?"A vencer":"Pago"}</Badge></td><td className="text-right font-mono-ui text-xs">{r[4]}</td></tr>
          ))}</tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
