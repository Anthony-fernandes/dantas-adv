import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/empresas/")({
  head: () => ({ meta: [{ title: "Empresas — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Administração" title="Empresas"
      description="Multi-empresa: matriz, filiais e configurações fiscais." icon={Building2}
      stats={[
        { label: "Empresas", value: "3" },
        { label: "Ativas", value: "3", tone: "success" },
        { label: "Matriz", value: "SP" },
        { label: "Filiais", value: "2", tone: "info" },
      ]}
    />
  ),
});