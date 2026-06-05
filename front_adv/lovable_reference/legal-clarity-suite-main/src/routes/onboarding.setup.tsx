import { createFileRoute } from "@tanstack/react-router";
import { AuthShell, Field, PrimaryButton } from "@/components/shells/AuthShell";

export const Route = createFileRoute("/onboarding/setup")({ component: Setup });

function Setup() {
  return (
    <AuthShell
      eyebrow="Onboarding · Novo Escritório"
      title="Configure seu escritório"
      subtitle="Esses dados aparecerão em documentos, e-mails e no portal do cliente."
    >
      <Field label="Razão social" placeholder="Silva & Bastos Advogados Associados" />
      <Field label="Nome fantasia" placeholder="Silva & Bastos" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="CNPJ" placeholder="00.000.000/0001-00" />
        <Field label="OAB" placeholder="OAB/SP 12.345" />
      </div>
      <Field label="Subdomínio do portal" placeholder="silvabastos" hint="Seu portal: silvabastos.jurisdictum.app" />
      <PrimaryButton>Criar escritório</PrimaryButton>
    </AuthShell>
  );
}
