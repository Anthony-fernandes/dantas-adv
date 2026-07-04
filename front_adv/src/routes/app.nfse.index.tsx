import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
export const Route = createFileRoute("/app/nfse/")({
  head: () => ({ meta: [{ title: "NFS-e — JurisFlow" }] }),
  component: () => (
    <ModuleScaffold eyebrow="Financeiro" title="NFS-e"
      description="Emissão e controle de notas fiscais de serviço eletrônicas." icon={Receipt}
      stats={[
        { label: "Emitidas (mês)", value: "38" },
        { label: "Autorizadas", value: "36", tone: "success" },
        { label: "Rejeitadas", value: "1", tone: "destructive" },
        { label: "Pendentes", value: "1", tone: "warning" },
      ]}
    />
  ),
});