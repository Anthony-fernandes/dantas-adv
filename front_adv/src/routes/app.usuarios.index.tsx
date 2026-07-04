import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/usuarios/")({
  head: () => ({ meta: [{ title: "Usuários — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Administração" title="Usuários e permissões"
      description="Gestão de acessos, perfis e permissões finas por módulo." icon={UserCog}
      stats={[
        { label: "Usuários", value: "24" },
        { label: "Ativos", value: "22", tone: "success" },
        { label: "Convites pendentes", value: "3", tone: "warning" },
        { label: "Perfis", value: "6", tone: "info" },
      ]}
    />
  ),
});