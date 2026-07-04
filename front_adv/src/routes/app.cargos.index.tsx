import { createFileRoute } from "@tanstack/react-router";
import { BriefcaseBusiness } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/cargos/")({
  head: () => ({ meta: [{ title: "Cargos — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Gestão" title="Cargos"
      description="Cadastro de cargos, senioridade e políticas de comissão." icon={BriefcaseBusiness}
      stats={[
        { label: "Cargos", value: "10" },
        { label: "Sócios", value: "3", tone: "success" },
        { label: "Advogados sênior", value: "5", tone: "info" },
        { label: "Vagas abertas", value: "2", tone: "warning" },
      ]}
    />
  ),
});