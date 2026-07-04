import { createFileRoute } from "@tanstack/react-router";
import { UserSquare2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/funcionarios/")({
  head: () => ({ meta: [{ title: "Funcionários — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Gestão" title="Funcionários"
      description="Equipe do escritório, com hierarquia, cargos e alocação por área." icon={UserSquare2}
      stats={[
        { label: "Total", value: "24" },
        { label: "Advogados", value: "12", tone: "info" },
        { label: "Estagiários", value: "6", tone: "warning" },
        { label: "Administrativo", value: "6" },
      ]}
    />
  ),
});