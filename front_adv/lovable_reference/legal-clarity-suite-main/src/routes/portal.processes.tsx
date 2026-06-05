import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalShell } from "@/components/shells/PortalShell";
import { Card, Badge } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/portal/processes")({ component: PortalProcesses });

const procs = [
  { c: "1002345-82.2023.8.26.0100", t: "Indústria Andradina v. União Federal", s: "active", n: "Réplica protocolada · hoje" },
  { c: "5012003-90.2024.4.03.6182", t: "Holding Andradina v. Fazenda Nacional", s: "active", n: "Aguardando despacho · 5 dias" },
  { c: "0044290-15.2023.5.02.0301", t: "Andradina v. Costa, F.M.", s: "neutral", n: "Suspenso por acordo" },
];

function PortalProcesses() {
  return (
    <PortalShell eyebrow="Portal" title="Meus processos">
      <Card>
        <table className="table-editorial">
          <thead><tr><th>Processo</th><th>CNJ</th><th>Última movimentação</th><th>Status</th></tr></thead>
          <tbody>
            {procs.map((p) => (
              <tr key={p.c}>
                <td className="font-medium"><Link to="/portal/processes/$id" params={{ id: p.c }} className="hover:text-gold">{p.t}</Link></td>
                <td className="font-mono-ui text-[11px] text-ink-soft">{p.c}</td>
                <td className="text-ink-soft text-xs">{p.n}</td>
                <td><Badge tone={p.s as any}>{p.s==="active"?"Em andamento":"Suspenso"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PortalShell>
  );
}
