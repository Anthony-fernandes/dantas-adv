import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Administração" title="Integrações"
      description="PJe, Projudi, e-Saj, tribunais, e-mail, WhatsApp e ferramentas contábeis." icon={Plug}
      stats={[
        { label: "Conectadas", value: "9", tone: "success" },
        { label: "Disponíveis", value: "24" },
        { label: "Sincronizações/dia", value: "1.240", tone: "info" },
        { label: "Alertas", value: "0", tone: "success" },
      ]}
    />
  ),
});