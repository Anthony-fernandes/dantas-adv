import { createFileRoute } from "@tanstack/react-router";
import { MasterShell } from "@/components/shells/MasterShell";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/master/companies")({ component: Companies });

const rows = [
  ["Silva & Bastos", "silvabastos.jurisdictum.app", "Enterprise", 86, "active"],
  ["Macedo Advocacia", "macedo.jurisdictum.app", "Pro", 24, "active"],
  ["Andrade ME", "andrade.jurisdictum.app", "Starter", 8, "danger"],
  ["Vasconcellos & Cia", "vasconcellos.jurisdictum.app", "Pro", 32, "active"],
];

function Companies() {
  return (
    <MasterShell eyebrow="Master · Empresas" title="Empresas globais" actions={<button className="px-4 h-10 bg-gold text-white text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Plus className="size-3.5" /> Nova empresa</button>}>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr className="text-[10px] font-mono-ui uppercase tracking-widest text-white/50">
            <th className="text-left px-5 py-3">Empresa</th><th className="text-left px-5 py-3">Subdomínio</th><th className="text-left px-5 py-3">Plano</th><th className="text-left px-5 py-3">Usuários</th><th className="text-left px-5 py-3">Status</th>
          </tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10 hover:bg-white/5">
              <td className="px-5 py-3.5 font-medium text-white">{r[0]}</td>
              <td className="px-5 py-3.5 font-mono-ui text-[11px] text-white/60">{r[1]}</td>
              <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-mono-ui uppercase">{r[2]}</span></td>
              <td className="px-5 py-3.5 font-mono-ui text-xs">{r[3]}</td>
              <td className="px-5 py-3.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-ui uppercase ${r[4]==="danger"?"bg-red-500/15 text-red-300":"bg-emerald-500/15 text-emerald-300"}`}>{r[4]==="danger"?"Inadimplente":"Ativa"}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </MasterShell>
  );
}
