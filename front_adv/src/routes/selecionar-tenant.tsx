import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Scale, Building2, Check, LogOut, Plus } from "lucide-react";

export const Route = createFileRoute("/selecionar-tenant")({
  head: () => ({ meta: [{ title: "Selecionar escritório — JurisFlow" }, { name: "robots", content: "noindex" }] }),
  component: SelecionarTenant,
});

const workspaces = [
  { id: "t1", nome: "Souza & Palma Advogados", plano: "Business", usuarios: 24, papel: "Sócia", atual: true },
  { id: "t2", nome: "Meridiano Consultoria Jurídica", plano: "Professional", usuarios: 8, papel: "Advogada externa" },
  { id: "t3", nome: "Vértice Jurídico M&A", plano: "Enterprise", usuarios: 64, papel: "Correspondente" },
];

function SelecionarTenant() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background p-6 grid place-items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Scale className="h-4 w-4" /></div>
          <span className="font-display font-semibold text-lg">JurisFlow</span>
        </div>

        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Multi-tenant</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Escolha o workspace</h1>
          <p className="mt-2 text-[14px] text-muted-foreground">Você tem acesso a mais de um escritório. Selecione qual deseja entrar.</p>
        </div>

        <ul className="space-y-3">
          {workspaces.map((w) => (
            <li key={w.id}>
              <button onClick={() => nav({ to: "/app" })}
                className="w-full surface-card p-5 flex items-center justify-between hover:border-primary transition group">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                  <div className="text-left">
                    <p className="font-display font-semibold text-[15px]">{w.nome}</p>
                    <p className="text-[12.5px] text-muted-foreground">Plano {w.plano} · {w.usuarios} usuários · Seu papel: {w.papel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {w.atual && <span className="rounded-full bg-success/12 text-success px-2 py-0.5 text-[11px] font-medium">Atual</span>}
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition"><Check className="h-4 w-4" /></span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <button className="mt-4 w-full rounded-lg border-2 border-dashed border-border py-4 text-[13px] text-muted-foreground hover:border-primary hover:text-primary transition inline-flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Criar novo escritório
        </button>

        <div className="mt-8 text-center">
          <button onClick={() => nav({ to: "/login" })} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" /> Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}