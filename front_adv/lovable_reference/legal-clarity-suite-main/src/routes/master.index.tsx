import { createFileRoute } from "@tanstack/react-router";
import { MasterShell } from "@/components/shells/MasterShell";

export const Route = createFileRoute("/master/")({ component: MasterHome });

function Kpi({ l, v, h }: { l: string; v: string; h?: string }) {
  return (
    <div className="border border-white/10 p-5">
      <div className="text-[10px] font-mono-ui uppercase tracking-[0.18em] text-white/50">{l}</div>
      <div className="font-display text-3xl mt-2 text-white">{v}</div>
      {h && <div className="text-[11px] text-white/50 mt-1">{h}</div>}
    </div>
  );
}

function MasterHome() {
  return (
    <MasterShell eyebrow="Console Master" title="Visão global da plataforma">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Kpi l="Empresas ativas" v="48" h="↑ 4 no mês" />
        <Kpi l="Usuários totais" v="2.184" h="↑ 124 no mês" />
        <Kpi l="MRR consolidado" v="R$ 482k" h="↑ 8,2%" />
        <Kpi l="Disponibilidade" v="99,98%" h="SLA 99,9%" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-white/10">
          <div className="px-5 py-4 border-b border-white/10 flex justify-between"><div className="text-white">Crescimento de empresas</div><div className="text-[10px] font-mono-ui text-gold">12 MESES</div></div>
          <div className="p-6 grid grid-cols-12 gap-2 h-44 items-end">
            {[18,22,24,26,28,30,32,35,38,40,44,48].map((v, i) => (<div key={i} className="bg-gold/70 rounded-t-sm" style={{ height: `${(v/50)*100}%` }} />))}
          </div>
        </div>
        <div className="border border-white/10">
          <div className="px-5 py-4 border-b border-white/10 text-white">Eventos recentes</div>
          <div className="divide-y divide-white/10">
            {[
              ["Nova empresa criada", "Macedo Advocacia", "há 2h"],
              ["Plano alterado", "Silva & Bastos · Enterprise", "ontem"],
              ["Suspensão por inadimplência", "Andrade ME", "12 mai"],
              ["Novo usuário master", "rodrigo@jurisdictum.com", "10 mai"],
            ].map((e, i) => (
              <div key={i} className="px-5 py-3.5 text-sm">
                <div className="text-white">{e[0]}</div>
                <div className="text-[11px] text-white/50">{e[1]} · {e[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MasterShell>
  );
}
