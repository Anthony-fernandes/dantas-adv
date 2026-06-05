import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryButton } from "@/components/shells/AuthShell";

export const Route = createFileRoute("/app/login")({ component: AppLogin });

function AppLogin() {
  return (
    <AuthShell
      eyebrow="Área Interna · Escritório"
      title="Acesso da equipe"
      subtitle="Use seu e-mail corporativo para entrar na plataforma de gestão jurídica."
      footer={<>É cliente? <Link to="/portal/login" className="text-gold underline">Acesse o portal</Link>.</>}
    >
      <Field label="E-mail corporativo" type="email" placeholder="nome@silvabastos.adv" />
      <Field label="Senha" type="password" />
      <div className="flex items-center justify-between mb-6 text-xs">
        <label className="flex items-center gap-2 text-ink-soft"><input type="checkbox" className="accent-ink" /> Manter conectado</label>
        <a href="#" className="text-gold">Esqueci a senha</a>
      </div>
      <PrimaryButton>Entrar</PrimaryButton>
      <div className="mt-4 text-center text-[11px] text-ink-soft">Recebeu um convite? <Link to="/onboarding/accept-invite" className="text-gold">Aceitar convite</Link></div>
    </AuthShell>
  );
}
