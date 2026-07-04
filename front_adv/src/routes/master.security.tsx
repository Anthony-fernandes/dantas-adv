import { createFileRoute } from "@tanstack/react-router";
import { Shield, AlertTriangle, Lock, Activity, Eye } from "lucide-react";
import { PageHeader, StatCard, StatusPill } from "@/components/shell/PageHeader";

export const Route = createFileRoute("/master/security")({
  head: () => ({ meta: [{ title: "Segurança — Master JurisFlow" }] }),
  component: MasterSecurity,
});

const audit = [
  { d: "01/07 14:12", u: "marina@souzaepalma.com.br", acao: "Login bem-sucedido", ip: "187.32.45.10", tone: "success" as const },
  { d: "01/07 13:58", u: "beatriz@meridiano.adv.br", acao: "Falha de MFA (3ª tentativa)", ip: "45.229.10.44", tone: "destructive" as const },
  { d: "01/07 11:20", u: "ricardo@souzaepalma.com.br", acao: "Alteração de política RLS", ip: "187.32.45.10", tone: "warning" as const },
  { d: "01/07 09:04", u: "system", acao: "Chave API rotacionada", ip: "—", tone: "info" as const },
  { d: "30/06 22:11", u: "carlos@vertice.legal", acao: "Novo dispositivo autorizado", ip: "191.5.88.22", tone: "info" as const },
];

function MasterSecurity() {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow="Console Master" title="Segurança e conformidade" description="Postura de segurança, MFA, auditoria e conformidade com LGPD/CNJ." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Score de segurança" value="94/100" tone="success" icon={Shield} hint="Excelente" />
        <StatCard label="Sessões ativas" value="212" tone="info" icon={Activity} />
        <StatCard label="Falhas 24h" value="8" tone="warning" icon={AlertTriangle} />
        <StatCard label="MFA obrigatório" value="Ligado" tone="success" icon={Lock} hint="Para Admins/Owners" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-[15px]">Trilha de auditoria</h3>
            <button className="text-[12.5px] text-primary hover:underline">Exportar CSV</button>
          </div>
          <ul className="divide-y divide-border">
            {audit.map((a) => (
              <li key={a.d + a.u + a.acao} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[13.5px]">{a.acao}</p>
                  <p className="text-[11.5px] text-muted-foreground">{a.u} · IP {a.ip}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11.5px] text-muted-foreground tabular-nums">{a.d}</span>
                  <StatusPill tone={a.tone}>{a.tone === "success" ? "Ok" : a.tone === "destructive" ? "Bloqueio" : a.tone === "warning" ? "Atenção" : "Info"}</StatusPill>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display font-semibold text-[15px] mb-4">Políticas globais</h3>
          <ul className="space-y-3 text-[13px]">
            {[
              { l: "MFA obrigatório (Admins/Owners)", on: true },
              { l: "Bloqueio após 5 falhas", on: true },
              { l: "Sessão expira em 30 min ocioso", on: true },
              { l: "IP allowlist por tenant", on: false },
              { l: "Log retido por 365 dias", on: true },
              { l: "Alerta em nova geolocalização", on: true },
            ].map((p) => (
              <li key={p.l} className="flex items-center justify-between">
                <span>{p.l}</span>
                <span className={`h-5 w-9 rounded-full relative ${p.on ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${p.on ? "left-4" : "left-0.5"}`} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-info/10 text-info"><Eye className="h-4 w-4" /></div>
          <div>
            <h3 className="font-display font-semibold text-[15px]">Conformidade LGPD</h3>
            <p className="text-[12.5px] text-muted-foreground">Últimos 30 dias.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ l: "Solicitações de acesso", v: "12" }, { l: "Exclusões atendidas", v: "3" }, { l: "Portabilidade", v: "1" }, { l: "Consentimentos ativos", v: "1.204" }].map((c) => (
            <div key={c.l} className="rounded-md border border-border p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{c.l}</p>
              <p className="font-display text-2xl font-semibold mt-0.5 tabular-nums">{c.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}