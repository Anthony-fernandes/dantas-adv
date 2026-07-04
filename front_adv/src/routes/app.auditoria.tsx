import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Compliance" title="Log de auditoria"
      description="Trilha completa de acessos e alterações no sistema." icon={Shield}
      stats={[
        { label: "Eventos (24h)", value: "1.842" },
        { label: "Logins", value: "68", tone: "info" },
        { label: "Alterações", value: "234", tone: "warning" },
        { label: "Falhas", value: "2", tone: "destructive" },
      ]}
    />
  ),
});