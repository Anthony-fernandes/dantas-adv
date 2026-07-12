import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UserSquare2, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { FormDialog } from "@/components/shell/FormDialog";
import { RowActions } from "@/components/shell/RowActions";
import { StatusPill } from "@/components/shell/PageHeader";
import { useList, useCreate, fmtDate } from "@/lib/resources";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/app/funcionarios/")({
  head: () => ({ meta: [{ title: pageTitle("Funcionários") }] }),
  component: FuncionariosPage,
});

function FuncionariosPage() {
  const employees = useList<any>("employees");
  const create = useCreate<any>("employees");
  const [open, setOpen] = useState(false);
  const rows = employees.data ?? [];

  return (
    <ModuleScaffold
      eyebrow="Gestão" title="Funcionários"
      description="Equipe do escritório, com cargo, contato e vínculo de login."
      icon={UserSquare2}
      stats={[
        { label: "Total", value: String(rows.length) },
        { label: "Ativos", value: String(rows.filter((e) => e.is_active !== false).length), tone: "success" },
      ]}
      actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Novo funcionário
        </button>
      }
    >
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Novo funcionário"
        description="Cadastre um integrante da equipe do escritório."
        submitLabel="Criar funcionário"
        fields={[
          { label: "Nome completo", name: "full_name", type: "text", required: true, full: true },
          { label: "E-mail", name: "email", type: "email" },
          { label: "Telefone", name: "phone", type: "tel" },
          { label: "Data de admissão", name: "hire_date", type: "date" },
        ]}
        onSubmit={async (v) => {
          if (!v.full_name) {
            toast.error("Informe o nome completo.");
            return;
          }
          try {
            await create.mutateAsync({ full_name: v.full_name, email: v.email || null, phone: v.phone || null, hire_date: v.hire_date || null, is_active: true });
            toast.success("Funcionário cadastrado.");
            setOpen(false);
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível cadastrar o funcionário.");
          }
        }}
      />
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Funcionário</th>
                <th className="px-4 py-2.5 text-left font-medium">Cargo</th>
                <th className="px-4 py-2.5 text-left font-medium">Contato</th>
                <th className="px-4 py-2.5 text-left font-medium">Admissão</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.isLoading && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!employees.isLoading && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Nenhum funcionário cadastrado.</td></tr>}
              {rows.map((e) => {
                const name = e.full_name || e.name || e.email || "Sem nome";
                return (
                  <tr key={e.id} className="hover:bg-muted/30 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/8 text-primary text-[11px] font-semibold">{name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}</span>
                        <span className="min-w-0"><p className="font-medium truncate">{name}</p><p className="text-[11.5px] text-muted-foreground truncate">{e.email || "—"}</p></span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.position_name || e.cargo || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.phone || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(e.hire_date)}</td>
                    <td className="px-5 py-3"><StatusPill tone={e.is_active !== false ? "success" : "muted"}>{e.is_active !== false ? "Ativo" : "Inativo"}</StatusPill></td>
                    <td className="px-5 py-3 text-right">
                      <RowActions
                        resource="employees"
                        id={String(e.id)}
                        editTitle="Editar funcionário"
                        fields={[
                          { label: "Nome completo", name: "full_name", type: "text", required: true, full: true },
                          { label: "E-mail", name: "email", type: "email" },
                          { label: "Telefone", name: "phone", type: "tel" },
                          { label: "Data de admissão", name: "hire_date", type: "date" },
                          { label: "Status", name: "is_active", type: "select", options: [{ value: "true", label: "Ativo" }, { value: "false", label: "Inativo" }] },
                        ]}
                        initial={{ full_name: e.full_name || e.name || "", email: e.email || "", phone: e.phone || "", hire_date: e.hire_date || "", is_active: e.is_active !== false ? "true" : "false" }}
                        buildPayload={(v) => ({ full_name: v.full_name, email: v.email || null, phone: v.phone || null, hire_date: v.hire_date || null, is_active: v.is_active !== "false" })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
