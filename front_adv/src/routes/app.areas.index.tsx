import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/areas/")({
  head: () => ({ meta: [{ title: "Áreas de atuação — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Cadastros" title="Áreas de atuação"
      description="Cível, trabalhista, tributário, ambiental, família e demais áreas do escritório." icon={FolderKanban}
      stats={[
        { label: "Áreas ativas", value: "12" },
        { label: "Cível", value: "128 proc." },
        { label: "Trabalhista", value: "89 proc." },
        { label: "Tributário", value: "54 proc." },
      ]}
    />
  ),
});