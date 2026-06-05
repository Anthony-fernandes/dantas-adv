import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/shells/PublicShell";
import { ArrowRight, Scale, Briefcase, Building2, Gavel, FileText, Shield, MapPin, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JurisDictum — Excelência em Advocacia Empresarial" },
      { name: "description", content: "Escritório de advocacia full service com plataforma digital de alto padrão para gestão jurídica e atendimento ao cliente." },
    ],
  }),
  component: Landing,
});

const areas = [
  { icon: Scale, title: "Contencioso Cível", desc: "Litígios complexos, recuperação de crédito e responsabilidade civil." },
  { icon: Briefcase, title: "Empresarial & M&A", desc: "Estruturação societária, fusões e aquisições, governança corporativa." },
  { icon: Building2, title: "Tributário", desc: "Planejamento fiscal, contencioso administrativo e judicial tributário." },
  { icon: Gavel, title: "Trabalhista", desc: "Defesa em ações individuais, coletivas e compliance trabalhista." },
  { icon: FileText, title: "Contratos", desc: "Negociação, redação e revisão de contratos nacionais e internacionais." },
  { icon: Shield, title: "Compliance & LGPD", desc: "Adequação regulatória, programas de integridade e proteção de dados." },
];

const diferenciais = [
  { n: "01", t: "Equipe sênior dedicada", d: "Cada caso conduzido por sócio com mais de 15 anos de atuação especializada." },
  { n: "02", t: "Tecnologia proprietária", d: "Plataforma de gestão integrada com portal exclusivo para acompanhamento em tempo real." },
  { n: "03", t: "Relatórios executivos", d: "Métricas de risco, prazo médio e probabilidade de êxito com periodicidade mensal." },
  { n: "04", t: "Sigilo e LGPD by design", d: "Infraestrutura auditada, controle granular de acesso e trilhas imutáveis." },
];

const fluxo = [
  { n: 1, t: "Triagem técnica", d: "Análise inicial gratuita com diagnóstico jurídico em até 48h." },
  { n: 2, t: "Proposta editorial", d: "Plano de atuação detalhado, escopo e honorários transparentes." },
  { n: 3, t: "Onboarding digital", d: "Acesso ao portal, definição de interlocutores e SLAs." },
  { n: 4, t: "Execução & relato", d: "Movimentação processual com relatórios e governança contínua." },
];

const posts = [
  { t: "A nova jurisprudência do STJ sobre danos morais coletivos", c: "Civil", d: "12 mai 2026", img: "Marble courthouse columns" },
  { t: "Reforma tributária: impactos para holdings familiares", c: "Tributário", d: "08 mai 2026", img: "Vintage ledger book on wood desk" },
  { t: "ESG e responsabilidade contratual em cadeia produtiva", c: "Empresarial", d: "30 abr 2026", img: "Modern office library shelves" },
];

const depoimentos = [
  { q: "Substituíram três fornecedores de serviços jurídicos com qualidade superior e custo mais previsível.", n: "Helena Vasconcellos", c: "CFO, Grupo Andradina" },
  { q: "O portal mudou a forma como acompanhamos passivos. Decisões mais rápidas, menos surpresas.", n: "Roberto Yamaguchi", c: "GC, NorteSul Logística" },
];

function Landing() {
  return (
    <PublicShell>
      {/* HERO */}
      <section className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10 py-24">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="eyebrow mb-5">Advocacia Empresarial · Desde 1987</div>
            <h1 className="font-display text-7xl leading-[0.95] text-balance">
              Precisão técnica.<br/>
              <span className="italic text-gold">Autoridade jurídica.</span>
            </h1>
            <p className="text-lg text-ink-soft mt-7 max-w-[52ch] leading-relaxed">
              Um escritório full service com 38 anos de tradição e a primeira plataforma digital integrada do mercado para gestão de contencioso e atendimento ao cliente.
            </p>
            <div className="flex gap-3 mt-9">
              <a href="#contato" className="bg-ink text-paper px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] hover:bg-gold transition-colors rounded-sm inline-flex items-center gap-2">
                Agendar Consulta <ArrowRight className="size-3.5" />
              </a>
              <Link to="/portal/login" className="border border-rule px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] hover:bg-surface transition-colors rounded-sm">
                Acessar Portal
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md">
              <div><div className="font-display text-3xl">38</div><div className="eyebrow mt-1">Anos</div></div>
              <div><div className="font-display text-3xl">240+</div><div className="eyebrow mt-1">Empresas</div></div>
              <div><div className="font-display text-3xl">R$ 2,1B</div><div className="eyebrow mt-1">Em causas</div></div>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] bg-ink relative overflow-hidden">
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-paper/10 font-display italic text-[280px] leading-none">§</div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-paper">
                <div className="text-[10px] uppercase tracking-[0.2em] font-mono-ui text-gold mb-2">Manifesto</div>
                <p className="font-display italic text-xl leading-snug">"O direito é uma conversa entre o passado e o presente sobre como queremos viver."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AREAS */}
      <section id="areas" className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-12 gap-10 mb-16">
            <div className="lg:col-span-5">
              <div className="eyebrow mb-3">Áreas de Atuação</div>
              <h2 className="font-display text-5xl text-balance">Seis especialidades em diálogo permanente.</h2>
            </div>
            <p className="lg:col-span-6 lg:col-start-7 text-ink-soft text-lg leading-relaxed self-end">
              Estruturamos equipes multidisciplinares para cada operação, combinando profundidade técnica com visão executiva. Nenhuma área opera em silos.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-rule">
            {areas.map((a) => (
              <div key={a.title} className="bg-paper p-8 hover:bg-surface transition-colors group">
                <a.icon className="size-6 text-gold mb-5" strokeWidth={1.4} />
                <h3 className="font-display text-2xl mb-2">{a.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{a.desc}</p>
                <div className="mt-5 text-[11px] font-mono-ui uppercase tracking-widest text-ink-soft group-hover:text-gold transition-colors">Ver detalhes →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="border-b border-rule bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">O Escritório</div>
            <h2 className="font-display text-5xl mb-8 text-balance">Tradição que se renova a cada caso.</h2>
            <p className="text-ink-soft leading-relaxed mb-4">Fundado em 1987 por Antonio Silva e Eduardo Bastos, o escritório nasceu com a vocação de unir o rigor técnico da advocacia clássica à agilidade demandada pelo mercado contemporâneo.</p>
            <p className="text-ink-soft leading-relaxed">Hoje, com 86 profissionais distribuídos entre São Paulo, Rio de Janeiro e Belo Horizonte, somos referência em contencioso de alto valor.</p>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-px bg-rule self-start">
            {[
              { n: "86", l: "Profissionais" },
              { n: "12", l: "Sócios" },
              { n: "3", l: "Escritórios" },
              { n: "98%", l: "Êxito em sentenças" },
            ].map((s) => (
              <div key={s.l} className="bg-surface p-10">
                <div className="font-display text-6xl mb-2">{s.n}</div>
                <div className="eyebrow">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="eyebrow mb-3">Por que JurisDictum</div>
          <h2 className="font-display text-5xl mb-14 max-w-2xl">Quatro compromissos não negociáveis.</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-12">
            {diferenciais.map((d) => (
              <div key={d.n} className="flex gap-6 border-t border-rule pt-8">
                <div className="font-display italic text-5xl text-gold leading-none">{d.n}</div>
                <div>
                  <h3 className="font-display text-2xl mb-2">{d.t}</h3>
                  <p className="text-ink-soft leading-relaxed">{d.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLUXO */}
      <section className="border-b border-rule bg-ink text-paper">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="eyebrow text-gold mb-3">Como Trabalhamos</div>
          <h2 className="font-display text-5xl mb-14 max-w-2xl">Quatro etapas, um mandato claro.</h2>
          <div className="grid md:grid-cols-4 gap-px bg-white/10">
            {fluxo.map((f) => (
              <div key={f.n} className="bg-ink p-8">
                <div className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-gold mb-6">Etapa {String(f.n).padStart(2, "0")}</div>
                <h3 className="font-display text-2xl mb-3">{f.t}</h3>
                <p className="text-sm text-paper/60 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="eyebrow mb-3">Insights & Publicações</div>
              <h2 className="font-display text-5xl">Análises recentes da equipe.</h2>
            </div>
            <Link to="/" className="text-[12px] font-mono-ui uppercase tracking-widest text-gold">Todos os artigos →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((p, i) => (
              <Link to="/blog/$slug" params={{ slug: `artigo-${i+1}` }} key={i} className="group">
                <div className="aspect-[4/3] bg-surface border border-rule mb-5 grid place-items-center text-ink-soft/40 font-mono-ui text-[10px]">{p.img.toUpperCase()}</div>
                <div className="eyebrow mb-2">{p.c} · {p.d}</div>
                <h3 className="font-display text-2xl leading-snug group-hover:text-gold transition-colors text-balance">{p.t}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="border-b border-rule bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12">
          {depoimentos.map((d, i) => (
            <figure key={i} className="border-l-2 border-gold pl-8">
              <blockquote className="font-display italic text-3xl leading-snug mb-6">"{d.q}"</blockquote>
              <figcaption className="eyebrow">{d.n} · {d.c}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* MAPA + CONTATO */}
      <section id="contato" className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="eyebrow mb-3">Localização</div>
            <h2 className="font-display text-5xl mb-8">Onde estamos.</h2>
            <div className="space-y-6">
              <div>
                <div className="font-display text-xl mb-1">São Paulo · Matriz</div>
                <div className="text-sm text-ink-soft flex items-start gap-2"><MapPin className="size-4 mt-0.5 shrink-0" /> Av. Brigadeiro Faria Lima, 4221 — 8º andar, Itaim Bibi, 04538-133</div>
                <div className="text-sm text-ink-soft flex items-center gap-2 mt-2"><Phone className="size-4" /> +55 11 3000-2200</div>
                <div className="text-sm text-ink-soft flex items-center gap-2 mt-2"><Mail className="size-4" /> contato@jurisdictum.com</div>
              </div>
              <div className="rule-t pt-6">
                <div className="font-display text-xl mb-1">Rio de Janeiro</div>
                <div className="text-sm text-ink-soft flex items-start gap-2"><MapPin className="size-4 mt-0.5 shrink-0" /> Praia de Botafogo, 300 — 14º andar</div>
              </div>
              <div className="rule-t pt-6">
                <div className="font-display text-xl mb-1">Belo Horizonte</div>
                <div className="text-sm text-ink-soft flex items-start gap-2"><MapPin className="size-4 mt-0.5 shrink-0" /> Av. Bias Fortes, 472 — Sala 901</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 aspect-[4/3] bg-surface border border-rule relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="size-4 bg-gold rounded-full ring-8 ring-gold/20" />
            </div>
            <div className="absolute bottom-6 left-6 bg-ink text-paper p-5 max-w-xs">
              <div className="eyebrow text-gold mb-2">Matriz SP</div>
              <div className="font-display text-lg leading-tight">Faria Lima 4221</div>
              <div className="text-xs text-paper/60 mt-1">Itaim Bibi — São Paulo</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-paper">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="eyebrow mb-3">Próximo passo</div>
          <h2 className="font-display text-6xl text-balance leading-[1] mb-8">Conheça a plataforma <span className="italic text-gold">por dentro.</span></h2>
          <p className="text-ink-soft text-lg max-w-2xl mx-auto mb-10">Agende uma demonstração de 30 minutos com um sócio e veja como o JurisDictum pode reorganizar sua operação jurídica.</p>
          <div className="flex justify-center gap-3">
            <button className="bg-ink text-paper px-8 py-4 text-[12px] font-medium uppercase tracking-[0.16em] hover:bg-gold transition-colors rounded-sm">Agendar 30 minutos</button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
