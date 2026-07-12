import { createFileRoute } from "@tanstack/react-router";
import { BookOpenText } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { pageTitle } from "@/lib/brand";
export const Route = createFileRoute("/app/blog")({
  head: () => ({ meta: [{ title: pageTitle("Blog") }] }),
  component: () => (
    <ModuleScaffold eyebrow="Marketing" title="Blog jurídico"
      description="Publicações do escritório: artigos, notícias e análises." icon={BookOpenText}
      stats={[
        { label: "Publicações", value: "68" },
        { label: "Rascunhos", value: "4", tone: "warning" },
        { label: "Leitores/mês", value: "9.2K", tone: "info" },
        { label: "Categorias", value: "12" },
      ]}
    />
  ),
});