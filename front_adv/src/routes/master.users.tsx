import { createFileRoute } from "@tanstack/react-router";
import { Users, Search, Plus, Shield, Mail } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/master/users")({
  head: () => ({ meta: [{ title: pageTitle("Usuários — Admin Master") }] }),
  component: MasterUsersPage,
});

const users = [
  { nome: "Marina Souza", email: "marina@souzaepalma.com.br", tenant: "Souza & Palma", papel: "Owner", mfa: true, status: "Ativo", ultimoAcesso: "há 12 min" },
  { nome: "Ricardo Lima", email: "ricardo@souzaepalma.com.br", tenant: "Souza & Palma", papel: "Admin", mfa: true, status: "Ativo", ultimoAcesso: "há 2 h" },
  { nome: "Beatriz Marinho", email: "beatriz@meridiano.adv.br", tenant: "Meridiano", papel: "Owner", mfa: false, status: "Ativo", ultimoAcesso: "há 1 dia" },
  { nome: "Carlos Menezes", email: "carlos@vertice.legal", tenant: "Vértice M&A", papel: "Admin", mfa: true, status: "Suspenso", ultimoAcesso: "há 12 dias" },
  { nome: "Ana Beatriz Oliveira", email: "ana@independente.adv.br", tenant: "Independente", papel: "User", mfa: false, status: "Convidado", ultimoAcesso: "—" },
];

function MasterUsersPage() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Console Master" title="Usuários globais" description="Todos os usuários da plataforma, agrupados por tenant."
        actions={<button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"><Plus className="h-3.5 w-3.5" /> Convidar usuário</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value="1.284" icon={Users} />
        <StatCard label="Ativos (30d)" value="967" tone="success" trend="+8.2%" hint="vs. mês passado" />
        <StatCard label="Com MFA" value="76%" tone="info" hint="978 usuários" />
        <StatCard label="Suspensos" value="14" tone="destructive" />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar por nome, e-mail ou tenant..." className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-[13px]" />
          </div>
          <select className="rounded-md border border-border bg-background px-3 py-2 text-[13px]"><option>Todos os papéis</option><option>Owner</option><option>Admin</option><option>User</option></select>
          <select className="rounded-md border border-border bg-background px-3 py-2 text-[13px]"><option>Todos os status</option><option>Ativo</option><option>Suspenso</option><option>Convidado</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-3 text-left">Usuário</th><th className="px-5 py-3 text-left">Tenant</th><th className="px-5 py-3 text-left">Papel</th><th className="px-5 py-3 text-left">MFA</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Último acesso</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.email} className="hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary font-medium text-[11px]">{u.nome.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                      <div>
                        <p className="font-medium">{u.nome}</p>
                        <p className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{u.tenant}</td>
                  <td className="px-5 py-3.5"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${u.papel === "Owner" ? "bg-warning/15 text-warning-foreground" : u.papel === "Admin" ? "bg-info/12 text-info" : "bg-muted text-muted-foreground"}`}>{u.papel}</span></td>
                  <td className="px-5 py-3.5">{u.mfa ? <span className="inline-flex items-center gap-1 text-success text-[12px]"><Shield className="h-3.5 w-3.5" /> Ativo</span> : <span className="text-muted-foreground text-[12px]">—</span>}</td>
                  <td className="px-5 py-3.5"><StatusPill tone={u.status === "Ativo" ? "success" : u.status === "Suspenso" ? "destructive" : "info"}>{u.status}</StatusPill></td>
                  <td className="px-5 py-3.5 text-muted-foreground text-[12.5px]">{u.ultimoAcesso}</td>
                  <td className="px-5 py-3.5 text-right"><button className="text-[12.5px] text-primary hover:underline">Gerenciar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}