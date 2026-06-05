import { createFileRoute } from "@tanstack/react-router";
import { MasterShell } from "@/components/shells/MasterShell";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/master/permissions")({ component: Perms });

const perms = [
  ["Gerenciar empresas", true, true, false, false],
  ["Suspender empresas", true, false, false, false],
  ["Acessar dados de empresa", true, true, true, false],
  ["Gerenciar planos & faturamento", true, false, false, true],
  ["Gerenciar usuários master", true, false, false, false],
  ["Auditoria & logs", true, true, true, true],
];
const roles = ["Root", "Master", "Support", "Billing"];

function Perms() {
  return (
    <MasterShell eyebrow="Master · Permissões" title="Matriz de permissões">
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr className="text-[10px] font-mono-ui uppercase tracking-widest text-white/50">
            <th className="text-left px-5 py-3">Permissão</th>
            {roles.map((r) => <th key={r} className="px-5 py-3 text-center">{r}</th>)}
          </tr></thead>
          <tbody>{perms.map((p, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="px-5 py-3.5 text-white">{p[0]}</td>
              {p.slice(1).map((v, j) => (
                <td key={j} className="px-5 py-3.5 text-center">
                  {v ? <Check className="size-4 text-emerald-400 inline" /> : <X className="size-4 text-white/20 inline" />}
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </MasterShell>
  );
}
