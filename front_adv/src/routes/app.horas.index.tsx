import { createFileRoute } from "@tanstack/react-router";
import { Clock, Play, Plus } from "lucide-react";
import { ModuleScaffold } from "@/components/shell/ModuleScaffold";
import { StatusPill } from "@/components/shell/PageHeader";

export const Route = createFileRoute("/app/horas/")({
  head: () => ({ meta: [{ title: "Horas — JurisFlow" }] }),
  component: HorasPage,
});

const entries = [
  { id: 1, data: "03/07", processo: "1023456-78.2024", desc: "Elaboração de contestação", hh: "02:45", tipo: "Faturável", valor: "R$ 1.925" },
  { id: 2, data: "03/07", processo: "5566778-33.2024", desc: "Reunião com cliente", hh: "01:15", tipo: "Faturável", valor: "R$ 875" },
  { id: 3, data: "02/07", processo: "0009887-11.2023", desc: "Análise de processo", hh: "03:20", tipo: "Faturável", valor: "R$ 2.333" },
  { id: 4, data: "02/07", processo: "—", desc: "Reunião interna", hh: "00:45", tipo: "Não faturável", valor: "—" },
];

function HorasPage() {
  return (
    <ModuleScaffold
      eyebrow="Produtividade" title="Timesheet"
      description="Lançamento e apuração de horas trabalhadas, com integração ao faturamento."
      icon={Clock}
      stats={[
        { label: "Horas hoje", value: "4h 25min", tone: "info" },
        { label: "Semana", value: "23h 10min" },
        { label: "Faturável", value: "87%", tone: "success" },
        { label: "A faturar", value: "R$ 12.450", tone: "warning" },
      ]}
      actions={
        <>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-[13px] hover:bg-muted transition">
            <Play className="h-3.5 w-3.5" /> Iniciar timer
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Plus className="h-3.5 w-3.5" /> Lançar horas
          </button>
        </>
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Data</th>
                <th className="px-4 py-2.5 text-left font-medium">Processo</th>
                <th className="px-4 py-2.5 text-left font-medium">Descrição</th>
                <th className="px-4 py-2.5 text-right font-medium">Horas</th>
                <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
                <th className="px-5 py-2.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 text-muted-foreground">{e.data}</td>
                  <td className="px-4 py-3 font-mono text-[12.5px]">{e.processo}</td>
                  <td className="px-4 py-3 font-medium">{e.desc}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-mono">{e.hh}</td>
                  <td className="px-4 py-3"><StatusPill tone={e.tipo === "Faturável" ? "success" : "muted"}>{e.tipo}</StatusPill></td>
                  <td className="px-5 py-3 text-right tabular-nums">{e.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleScaffold>
  );
}