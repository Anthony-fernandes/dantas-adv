import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, Badge } from "@/components/ui-kit/PageKit";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/users")({ component: Users });

const users = [
  ["daniel@silvabastos.adv", "Sócio-Diretor", "Todas", "active", "agora"],
  ["helena@silvabastos.adv", "Sócia", "SP, RJ", "active", "5 min"],
  ["clara@silvabastos.adv", "Advogada Sênior", "SP", "active", "1h"],
  ["marcos@silvabastos.adv", "Advogado Sênior", "SP", "active", "ontem"],
  ["andre@silvabastos.adv", "Advogado Pleno", "SP, BH", "active", "ontem"],
  ["ana@silvabastos.adv", "Estagiária", "SP", "neutral", "convite enviado"],
];

function Users() {
  return (
    <AppShell eyebrow="Cadastros · Usuários" title="Usuários da plataforma" actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Plus className="size-3.5" /> Convidar</button>}>
      <Card>
        <table className="table-editorial">
          <thead><tr><th>E-mail</th><th>Cargo</th><th>Escritórios</th><th>Status</th><th>Último acesso</th></tr></thead>
          <tbody>{users.map((u, i) => <tr key={i}><td className="font-mono-ui text-[12px]">{u[0]}</td><td>{u[1]}</td><td className="text-ink-soft">{u[2]}</td><td><Badge tone={u[3] as any}>{u[3]==="active"?"Ativo":"Pendente"}</Badge></td><td className="text-xs text-ink-soft">{u[4]}</td></tr>)}</tbody>
        </table>
      </Card>
    </AppShell>
  );
}
