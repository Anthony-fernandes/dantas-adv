import { createFileRoute } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/landing")({
  head: () => ({ meta: [{ title: "Site institucional — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Marketing" title="Site institucional"
      description="CMS para o site do escritório: hero, serviços, equipe, casos e contato." icon={Globe2}
      stats={[
        { label: "Visitas (mês)", value: "12.4K", tone: "info" },
        { label: "Leads", value: "184", tone: "success" },
        { label: "Taxa de conversão", value: "1,5%", tone: "warning" },
        { label: "Páginas ativas", value: "8" },
      ]}
    />
  ),
});