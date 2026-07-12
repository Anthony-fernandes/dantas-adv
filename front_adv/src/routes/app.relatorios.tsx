import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { pageTitle } from "@/lib/brand";
export const Route = createFileRoute("/app/relatorios")({
  head: () => ({ meta: [{ title: pageTitle("Relatórios") }] }),
  component: () => (
    <ModuleScaffold eyebrow="Gestão" title="Relatórios executivos"
      description="BI e relatórios para sócios: produtividade, financeiro, contencioso e desempenho da equipe." icon={BarChart3}
      stats={[
        { label: "Relatórios", value: "24" },
        { label: "Agendados", value: "6", tone: "info" },
        { label: "Este mês", value: "12", tone: "success" },
        { label: "Favoritos", value: "8" },
      ]}
    />
  ),
});