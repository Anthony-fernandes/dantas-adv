import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Administração" title="Configurações do escritório"
      description="Identidade visual, planos, políticas de segurança, LGPD e customizações." icon={Settings}
      stats={[
        { label: "Módulos ativos", value: "18/22" },
        { label: "Usuários", value: "24" },
        { label: "Armazenamento", value: "48/100 GB", tone: "info" },
        { label: "Plano", value: "Enterprise", tone: "success" },
      ]}
    />
  ),
});