import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, FileCheck2, UserCheck, Mail, Scale } from "lucide-react";

export const Route = createFileRoute("/lgpd")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade e LGPD — JurisFlow" },
      { name: "description", content: "Como o JurisFlow trata dados pessoais em conformidade com a LGPD." },
    ],
  }),
  component: LgpdPage,
});

function LgpdPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-[1000px] px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Scale className="h-4 w-4" /></div>
            <span className="font-display font-semibold">JurisFlow</span>
          </Link>
          <Link to="/login" className="text-[13px] text-muted-foreground hover:text-foreground">Entrar</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-12">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Privacidade · LGPD</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">Última atualização: 01 de julho de 2026.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Shield, t: "Sigilo profissional", d: "Compromisso com o segredo advogado-cliente." },
            { icon: Lock, t: "Criptografia", d: "Dados em trânsito (TLS 1.3) e em repouso (AES-256)." },
            { icon: FileCheck2, t: "Conformidade", d: "LGPD, Marco Civil e provimentos do CNJ." },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.t} className="surface-card p-5">
                <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                <p className="mt-3 font-semibold">{c.t}</p>
                <p className="text-[13px] text-muted-foreground mt-1">{c.d}</p>
              </div>
            );
          })}
        </div>

        <div className="prose prose-sm max-w-none mt-10 space-y-8 text-[14.5px] leading-relaxed text-foreground/85">
          <Section n="1" title="Controlador dos dados">
            <p>A JurisFlow Tecnologia Jurídica Ltda., inscrita no CNPJ nº 00.000.000/0001-00, atua como <strong>controladora</strong> dos dados coletados diretamente por meio da plataforma e como <strong>operadora</strong> dos dados tratados em nome dos escritórios contratantes, nos termos da Lei nº 13.709/2018 (LGPD).</p>
          </Section>
          <Section n="2" title="Dados coletados">
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Dados cadastrais de usuários: nome, CPF, e-mail, telefone e OAB.</li>
              <li>Dados de clientes e processos inseridos pelos usuários do escritório.</li>
              <li>Dados de navegação e uso: logs de acesso, IP, dispositivo e horário.</li>
              <li>Cookies estritamente necessários e analíticos anonimizados.</li>
            </ul>
          </Section>
          <Section n="3" title="Bases legais">
            <p>O tratamento se apoia nas hipóteses do art. 7º da LGPD, notadamente: execução de contrato, cumprimento de obrigação legal, legítimo interesse e, quando aplicável, consentimento específico do titular.</p>
          </Section>
          <Section n="4" title="Compartilhamento">
            <p>Não vendemos dados. Compartilhamos apenas com operadores contratados (hospedagem, e-mail transacional, meios de pagamento) sob acordo de confidencialidade e adequação técnica, e com autoridades judiciais quando legalmente exigido.</p>
          </Section>
          <Section n="5" title="Direitos do titular">
            <p>Você pode, a qualquer momento, solicitar acesso, correção, anonimização, portabilidade, eliminação ou revogação de consentimento, nos termos do art. 18 da LGPD. O canal oficial é o e-mail do encarregado abaixo.</p>
          </Section>
          <Section n="6" title="Segurança da informação">
            <p>Adotamos controles técnicos e organizacionais compatíveis com as melhores práticas do setor: MFA obrigatório para administradores, criptografia ponta-a-ponta em anexos sensíveis, auditoria de acessos, backups redundantes e testes periódicos de intrusão.</p>
          </Section>
          <Section n="7" title="Encarregado (DPO)">
            <div className="rounded-lg border border-border bg-card p-4 not-prose">
              <p className="inline-flex items-center gap-2 font-medium"><UserCheck className="h-4 w-4 text-primary" /> Dra. Beatriz Marinho — OAB/SP 145.909</p>
              <p className="inline-flex items-center gap-2 mt-2 text-[13.5px] text-muted-foreground"><Mail className="h-4 w-4" /> dpo@jurisflow.com.br</p>
            </div>
          </Section>
        </div>

        <div className="mt-12 flex items-center justify-between rounded-xl bg-primary p-6 gradient-brand text-primary-foreground">
          <div>
            <p className="font-display text-lg font-semibold">Preciso exercer um direito da LGPD</p>
            <p className="text-[13px] text-white/75">Responderemos em até 15 dias corridos.</p>
          </div>
          <a href="mailto:dpo@jurisflow.com.br" className="rounded-md bg-white text-primary px-4 py-2 text-[13px] font-medium hover:bg-white/90">Contatar DPO</a>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="mx-auto max-w-[1000px] px-6 py-6 text-[12px] text-muted-foreground flex items-center justify-between">
          <span>© 2026 JurisFlow · Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link to="/lgpd" className="hover:text-foreground">Privacidade</Link>
            <Link to="/" className="hover:text-foreground">Início</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold flex items-center gap-3">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary text-[12px] font-mono">{n}</span>
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}