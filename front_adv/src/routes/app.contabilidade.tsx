import { createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { pageTitle } from "@/lib/brand";
export const Route = createFileRoute("/app/contabilidade")({
  head: () => ({ meta: [{ title: pageTitle("Contabilidade") }] }),
  component: () => (
    <ModuleScaffold eyebrow="Financeiro" title="Contabilidade"
      description="DRE, plano de contas, apuração de impostos e conciliação bancária." icon={BookOpenCheck}
      stats={[
        { label: "Receita bruta (YTD)", value: "R$ 2,84M", tone: "success" },
        { label: "Impostos", value: "R$ 486K" },
        { label: "Resultado líquido", value: "R$ 1,72M", tone: "info" },
        { label: "Margem", value: "60,4%", tone: "success" },
      ]}
    />
  ),
});