import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryButton } from "@/components/shells/AuthShell";

export const Route = createFileRoute("/master/login")({ component: MasterLogin });

function MasterLogin() {
  return (
    <AuthShell
      eyebrow="Console Master · Restrito"
      title="Acesso global"
      subtitle="Painel de administração da plataforma JurisDictum. Requer 2FA."
      footer={<>Voltar para <Link to="/" className="text-gold underline">o site institucional</Link>.</>}
    >
      <Field label="E-mail master" type="email" placeholder="root@jurisdictum.com" />
      <Field label="Senha" type="password" />
      <Field label="Código 2FA" placeholder="000 000" hint="Token gerado pelo Google Authenticator." />
      <PrimaryButton>Entrar no Console</PrimaryButton>
    </AuthShell>
  );
}
