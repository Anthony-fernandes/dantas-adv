import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { useAuth } from "@/lib/auth";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: pageTitle("Perfil") }] }),
  component: PerfilPage,
});

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Proprietário", ADMIN: "Administrador", LAWYER: "Advogado(a)",
  ASSISTANT: "Assistente", FINANCE: "Financeiro", CLIENT: "Cliente",
};

function PerfilPage() {
  const { profile, roles, isSuperuser } = useAuth();
  const name = profile?.full_name || "Usuário";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  const roleLabel = isSuperuser ? "Superusuário" : ROLE_LABEL[roles[0] || ""] || "Equipe interna";

  const fields = [
    { l: "Nome completo", v: name },
    { l: "E-mail", v: profile?.email || "—" },
    { l: "Telefone", v: profile?.phone || "—" },
    { l: "Perfil", v: roleLabel },
  ];

  return (
    <div className="mx-auto max-w-[900px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Conta" title="Meu perfil" description="Suas informações pessoais." />
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="surface-card p-6 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary font-display text-3xl font-semibold">{initials}</div>
          <p className="mt-4 font-display text-lg font-semibold">{name}</p>
          <p className="text-[12.5px] text-muted-foreground">{roleLabel}</p>
        </div>
        <div className="surface-card p-6 space-y-4">
          {fields.map((f) => (
            <div key={f.l}>
              <label className="text-[12px] font-medium text-muted-foreground">{f.l}</label>
              <input defaultValue={f.v} readOnly className="mt-1 w-full h-10 rounded-md border border-input bg-muted/40 px-3 text-[13.5px] text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
