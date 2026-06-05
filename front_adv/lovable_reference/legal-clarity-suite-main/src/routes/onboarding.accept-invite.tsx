import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryButton } from "@/components/shells/AuthShell";

export const Route = createFileRoute("/onboarding/accept-invite")({ component: Accept });

function Accept() {
  return (
    <AuthShell
      eyebrow="Onboarding · Convite"
      title="Você foi convidado"
      subtitle="Dr. Daniel Marques convidou você para participar do escritório Silva & Bastos como Advogado Pleno."
    >
      <div className="card-flat p-5 mb-6">
        <div className="eyebrow mb-2">Detalhes do convite</div>
        <div className="text-sm space-y-1">
          <div><span className="text-ink-soft">Escritório:</span> Silva & Bastos · Matriz SP</div>
          <div><span className="text-ink-soft">Cargo:</span> Advogado Pleno</div>
          <div><span className="text-ink-soft">E-mail:</span> ana.lima@silvabastos.adv</div>
        </div>
      </div>
      <Field label="Nome completo" placeholder="Ana Lima de Oliveira" />
      <Field label="Crie uma senha" type="password" hint="Mínimo de 12 caracteres com letras, números e símbolos." />
      <PrimaryButton>Aceitar convite e entrar</PrimaryButton>
      <div className="mt-4 text-center text-[11px] text-ink-soft">Quer recusar? <Link to="/" className="text-gold">Voltar ao início</Link></div>
    </AuthShell>
  );
}
