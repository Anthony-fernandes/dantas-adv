import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Loader2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { FormDialog } from "@/components/shell/FormDialog";
import { useList, useCreate, fmtDate, humanize } from "@/lib/resources";

export const Route = createFileRoute("/app/modelos/")({
  head: () => ({ meta: [{ title: "Modelos — JurisFlow" }] }),
  component: ModelosPage,
});

function ModelosPage() {
  const templates = useList<any>("legal-templates");
  const create = useCreate<any>("legal-templates");
  const [open, setOpen] = useState(false);
  const rows = templates.data ?? [];

  const stats = useMemo(() => ({
    total: rows.length,
    categorias: new Set(rows.map((t) => t.category).filter(Boolean)).size,
  }), [rows]);

  return (
    <ModuleScaffold
      eyebrow="Jurídico" title="Modelos de documento"
      description="Templates versionados para petições, contratos e pareceres."
      icon={FileText}
      stats={[
        { label: "Modelos", value: String(stats.total) },
        { label: "Categorias", value: String(stats.categorias), tone: "info" },
      ]}
      actions={
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
          <Plus className="h-3.5 w-3.5" /> Novo modelo
        </button>
      }
    >
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Novo modelo"
        description="Crie um modelo reutilizável com variáveis dinâmicas."
        submitLabel="Criar modelo"
        wide
        fields={[
          { label: "Nome do modelo", name: "name", type: "text", required: true, full: true },
          { label: "Categoria", name: "category", type: "select", options: ["peticao", "contrato", "parecer", "procuracao", "notificacao", "geral"] },
          { label: "Formato", name: "format", type: "select", options: ["docx", "pdf", "html"] },
          { label: "Conteúdo (variáveis: {{cliente}}, {{processo}})", name: "content", type: "textarea", required: true, full: true },
        ]}
        onSubmit={async (v) => {
          if (!v.name || !v.content) {
            toast.error("Informe nome e conteúdo do modelo.");
            return;
          }
          try {
            await create.mutateAsync({ name: v.name, category: v.category, format: v.format, content: v.content, version: 1 });
            toast.success("Modelo criado.");
            setOpen(false);
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível criar o modelo.");
          }
        }}
      />
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Modelo</th>
                <th className="px-4 py-2.5 text-left font-medium">Categoria</th>
                <th className="px-4 py-2.5 text-left font-medium">Formato</th>
                <th className="px-4 py-2.5 text-left font-medium">Versão</th>
                <th className="px-5 py-2.5 text-left font-medium">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.isLoading && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!templates.isLoading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Nenhum modelo cadastrado.</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition">
                  <td className="px-5 py-3">
                    <p className="font-medium">{t.name || "Modelo"}</p>
                    {t.description && <p className="text-[11.5px] text-muted-foreground truncate max-w-[320px]">{t.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{humanize(t.category)}</td>
                  <td className="px-4 py-3 text-muted-foreground uppercase">{t.format || "—"}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">v{t.version || 1}</td>
                  <td className="px-5 py-3 text-muted-foreground">{fmtDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}
