import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";

export const Route = createFileRoute("/app/perfil")({
  head: () => ({ meta: [{ title: "Perfil — JurisFlow" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  return (
    <div className="mx-auto max-w-[900px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Conta" title="Meu perfil" description="Suas informações pessoais e preferências." />
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <div className="surface-card p-6 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-primary/10 text-primary font-display text-3xl font-semibold">MS</div>
          <p className="mt-4 font-display text-lg font-semibold">Marina Souza</p>
          <p className="text-[12.5px] text-muted-foreground">Sócia sênior</p>
          <p className="mt-2 text-[11.5px] font-mono text-muted-foreground">OAB/SP 123.456</p>
          <button className="mt-4 w-full rounded-md border border-border bg-card px-3 py-2 text-[12.5px] hover:bg-muted">Alterar foto</button>
        </div>
        <div className="surface-card p-6 space-y-4">
          {[
            { l: "Nome completo", v: "Marina Vasconcelos Souza" },
            { l: "E-mail", v: "marina.souza@jurisflow.com.br" },
            { l: "Telefone", v: "+55 (11) 98765-4321" },
            { l: "Cargo", v: "Sócia sênior — Cível" },
          ].map((f) => (
            <div key={f.l}>
              <label className="text-[12px] font-medium text-muted-foreground">{f.l}</label>
              <input defaultValue={f.v} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-[13.5px]" />
            </div>
          ))}
          <div className="pt-2 flex justify-end gap-2">
            <button className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted">Cancelar</button>
            <button className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">Salvar alterações</button>
          </div>
        </div>
      </div>
    </div>
  );
}