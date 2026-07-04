import { createFileRoute } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/honorarios/")({
  head: () => ({ meta: [{ title: "Honorários — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Financeiro" title="Honorários"
      description="Controle de honorários contratuais, êxito e sucumbência por processo e advogado." icon={Banknote}
      stats={[
        { label: "Recebidos (mês)", value: "R$ 384.200", tone: "success" },
        { label: "A receber", value: "R$ 685.200", tone: "info" },
        { label: "Êxito estimado", value: "R$ 1.24M", tone: "warning" },
        { label: "Comissão da equipe", value: "R$ 92.100" },
      ]}
    />
  ),
});