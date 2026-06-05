import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryButton } from "@/components/shells/AuthShell";

export const Route = createFileRoute("/portal/login")({ component: PortalLogin });

function PortalLogin() {
  return (
    <AuthShell
      eyebrow="Portal do Cliente"
      title="Bem-vindo de volta"
      subtitle="Acompanhe processos, documentos e mensagens em um único lugar."
      footer={<>É da equipe? <Link to="/app/login" className="text-gold underline">Acesse a área interna</Link>.</>}
    >
      <Field label="CPF / CNPJ" placeholder="000.000.000-00" />
      <Field label="Senha" type="password" />
      <div className="flex items-center justify-between mb-6 text-xs">
        <label className="flex items-center gap-2 text-ink-soft"><input type="checkbox" className="accent-ink" /> Manter conectado</label>
        <a href="#" className="text-gold">Esqueci a senha</a>
      </div>
      <PrimaryButton>Entrar no portal</PrimaryButton>
    </AuthShell>
  );
}
