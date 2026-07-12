import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserCog, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { FormDialog } from "@/components/shell/FormDialog";
import { StatusPill } from "@/components/shell/PageHeader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useList } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/usuarios/")({
  head: () => ({ meta: [{ title: pageTitle("Usuários") }] }),
  component: UsuariosPage,
});

function roleLabel(u: any): string {
  const roles = Array.isArray(u.roles) ? u.roles : u.role ? [u.role] : [];
  return roles.join(", ") || "—";
}

function UsuariosPage() {
  const users = useList<any>("users");
  const { activeTenantId } = useAuth();
  const [open, setOpen] = useState(false);
  const rows = users.data ?? [];

  return (
    <ModuleScaffold
      eyebrow="Administração" title="Usuários e permissões"
      description="Gestão de acessos, perfis e permissões por módulo."
      icon={UserCog}
      stats={[
        { label: "Usuários", value: String(rows.length) },
        { label: "Ativos", value: String(rows.filter((u) => u.is_active !== false).length), tone: "success" },
      ]}
      actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Novo usuário
        </button>
      }
    >
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Convidar usuário"
        description="Envie um convite de acesso ao escritório."
        submitLabel="Enviar convite"
        fields={[
          { label: "Nome", name: "full_name", type: "text", required: true },
          { label: "E-mail", name: "email", type: "email", required: true },
          { label: "Perfil", name: "role", type: "select", required: true, options: [
            { value: "ADMIN", label: "Administrador" }, { value: "LAWYER", label: "Advogado(a)" },
            { value: "ASSISTANT", label: "Assistente" }, { value: "FINANCE", label: "Financeiro" },
          ] },
        ]}
        onSubmit={async (v) => {
          if (!v.email) {
            toast.error("Informe o e-mail do convidado.");
            return;
          }
          if (!activeTenantId) {
            toast.error("Selecione um escritório antes de convidar.");
            return;
          }
          try {
            await api.post(`/tenants/${activeTenantId}/invite/`, {
              email: v.email,
              full_name: v.full_name || "",
              role: v.role,
              roles: [v.role],
            });
            toast.success("Convite enviado.");
            setOpen(false);
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível enviar o convite.");
          }
        }}
      />
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Usuário</th>
                <th className="px-4 py-2.5 text-left font-medium">E-mail</th>
                <th className="px-4 py-2.5 text-left font-medium">Perfis</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.isLoading && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!users.isLoading && rows.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Nenhum usuário cadastrado.</td></tr>}
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3 font-medium">{u.full_name || u.name || u.email || "Sem nome"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{roleLabel(u)}</td>
                  <td className="px-5 py-3"><StatusPill tone={u.is_active !== false ? "success" : "muted"}>{u.is_active !== false ? "Ativo" : "Inativo"}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
