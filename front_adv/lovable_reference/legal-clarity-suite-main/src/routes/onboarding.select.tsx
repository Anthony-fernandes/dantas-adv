import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/shells/AuthShell";
import { ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/onboarding/select")({ component: Select });

const tenants = [
  { name: "Silva & Bastos", office: "Matriz SP", role: "Sócio · Daniel Marques" },
  { name: "Silva & Bastos", office: "Filial RJ", role: "Sócio · Daniel Marques" },
  { name: "Macedo Advocacia", office: "Belo Horizonte", role: "Of counsel" },
];

function Select() {
  return (
    <AuthShell
      eyebrow="Onboarding · Selecionar Escritório"
      title="Para qual escritório vamos?"
      subtitle="Você tem acesso a múltiplos escritórios. Escolha um para continuar."
    >
      <div className="space-y-2">
        {tenants.map((t) => (
          <Link key={t.office} to="/app/dashboard" className="flex items-center gap-4 p-4 border border-rule rounded-md hover:bg-surface transition-colors">
            <div className="size-10 bg-ink text-paper grid place-items-center rounded-sm font-display italic">{t.name[0]}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">{t.name}</div>
              <div className="text-xs text-ink-soft">{t.office} · {t.role}</div>
            </div>
            <ChevronRight className="size-4 text-ink-soft" />
          </Link>
        ))}
        <Link to="/onboarding/setup" className="flex items-center gap-4 p-4 border border-dashed border-rule rounded-md hover:bg-surface transition-colors text-ink-soft">
          <div className="size-10 grid place-items-center"><Plus className="size-5" /></div>
          <div className="flex-1 text-sm">Criar um novo escritório</div>
        </Link>
      </div>
    </AuthShell>
  );
}
