import { createFileRoute } from "@tanstack/react-router";
import { MasterShell } from "@/components/shells/MasterShell";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/master/users")({ component: MasterUsers });

const users = [
  ["root@jurisdictum.com", "Root Admin", "Master", "agora"],
  ["rodrigo@jurisdictum.com", "Operações", "Master", "1h"],
  ["beatriz@jurisdictum.com", "Suporte", "Support", "ontem"],
  ["financeiro@jurisdictum.com", "Financeiro", "Billing", "3 dias"],
];

function MasterUsers() {
  return (
    <MasterShell eyebrow="Master · Usuários globais" title="Operadores da plataforma" actions={<button className="px-4 h-10 bg-gold text-white text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Plus className="size-3.5" /> Convidar</button>}>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr className="text-[10px] font-mono-ui uppercase tracking-widest text-white/50">
            <th className="text-left px-5 py-3">E-mail</th><th className="text-left px-5 py-3">Nome</th><th className="text-left px-5 py-3">Papel</th><th className="text-left px-5 py-3">Último acesso</th>
          </tr></thead>
          <tbody>{users.map((u, i) => (
            <tr key={i} className="border-t border-white/10 hover:bg-white/5">
              <td className="px-5 py-3.5 font-mono-ui text-[12px]">{u[0]}</td>
              <td className="px-5 py-3.5 text-white">{u[1]}</td>
              <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-mono-ui uppercase">{u[2]}</span></td>
              <td className="px-5 py-3.5 text-xs text-white/50">{u[3]}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </MasterShell>
  );
}
