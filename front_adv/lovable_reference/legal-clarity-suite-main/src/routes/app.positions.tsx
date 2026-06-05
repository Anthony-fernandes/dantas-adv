import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, Badge, CardHeader } from "@/components/ui-kit/PageKit";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/positions")({ component: Positions });

const positions = [
  { n: "Sócio-Diretor", c: 2, p: "Acesso total · Gestão financeira" },
  { n: "Sócio", c: 8, p: "Gestão de carteira · Aprovação de minutas" },
  { n: "Advogado Sênior", c: 18, p: "Condução de casos · Audiências" },
  { n: "Advogado Pleno", c: 22, p: "Operação processual" },
  { n: "Estagiário", c: 24, p: "Apoio · Visualização restrita" },
  { n: "Administrativo", c: 12, p: "Gestão de cadastros e financeiro" },
];

function Positions() {
  return (
    <AppShell eyebrow="Cadastros · Cargos" title="Cargos e responsabilidades" actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Plus className="size-3.5" /> Novo cargo</button>}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((p) => (
          <Card key={p.n}>
            <CardHeader title={p.n} eyebrow={`${p.c} pessoas`} />
            <div className="p-5 text-sm text-ink-soft leading-relaxed">{p.p}</div>
            <div className="rule-t px-5 py-3 flex items-center justify-between"><Badge tone="neutral">Permissões padrão</Badge><button className="text-[11px] font-mono-ui uppercase tracking-widest text-gold">Editar →</button></div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
