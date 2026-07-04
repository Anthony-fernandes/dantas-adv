import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/modelos/")({
  head: () => ({ meta: [{ title: "Modelos — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Jurídico" title="Modelos de documento"
      description="Templates versionados para petições, contratos e pareceres com merge de variáveis." icon={FileText}
      stats={[
        { label: "Modelos", value: "142" },
        { label: "Petições", value: "68", tone: "info" },
        { label: "Contratos", value: "34", tone: "success" },
        { label: "Pareceres", value: "40" },
      ]}
    />
  ),
});