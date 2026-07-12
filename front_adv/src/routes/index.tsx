import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/shell/BrandLogo";
import { ArrowRight, Scale, ShieldCheck, Sparkles, LineChart, Users, Gavel } from "lucide-react";
import { BRAND, pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: pageTitle("Plataforma jurídica premium para escritórios") },
      { name: "description", content: "Gestão completa de processos, prazos, clientes, financeiro e portal do cliente em uma única plataforma jurídica." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <BrandLogo className="h-4 w-4" />
            </div>
            <span className="font-display text-[17px] font-semibold">{BRAND.name}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground">
            <a href="#produto" className="hover:text-foreground transition">Produto</a>
            <a href="#modulos" className="hover:text-foreground transition">Módulos</a>
            <a href="#seguranca" className="hover:text-foreground transition">Segurança</a>
            <a href="#precos" className="hover:text-foreground transition">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/portal/login" className="text-[13px] text-muted-foreground hover:text-foreground">Portal do cliente</Link>
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition">
              Entrar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-[0.35]"
             style={{ backgroundImage: "radial-gradient(600px 300px at 15% 0%, oklch(0.55 0.14 255 / 0.35), transparent), radial-gradient(500px 260px at 90% 20%, oklch(0.25 0.09 260 / 0.4), transparent)" }} />
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent" /> Plataforma jurídica premium
            </span>
            <h1 className="mt-6 font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              O sistema que os<br />
              <span className="text-accent">escritórios sérios</span> escolhem.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Processos, prazos, clientes, honorários e portal do cliente — um só lugar, com a
              organização silenciosa que a advocacia de alto padrão exige.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition">
                Acessar plataforma <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#produto" className="inline-flex items-center rounded-md border border-border bg-card/60 px-5 py-3 text-[14px] font-medium hover:bg-card transition">
                Ver produto
              </a>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-border pt-8">
            {[
              { k: "1.200+", l: "Escritórios ativos" },
              { k: "R$ 4,2bi", l: "Em causas gerenciadas" },
              { k: "99,98%", l: "Disponibilidade (SLA)" },
              { k: "ISO 27001", l: "Segurança certificada" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-2xl font-semibold tabular-nums">{s.k}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modulos" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Módulos</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Tudo o que o escritório precisa. Nada que ele não use.</h2>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              { icon: Gavel, t: "Contencioso", d: "Processos, prazos, audiências, andamentos e integração com tribunais." },
              { icon: Users, t: "Clientes & Portal", d: "Cadastro completo, portal do cliente com documentos e financeiro." },
              { icon: LineChart, t: "Financeiro", d: "Honorários, contratos, NFS-e, contas a pagar/receber e DRE." },
              { icon: ShieldCheck, t: "Compliance & LGPD", d: "Trilha de auditoria, consentimento, hierarquia e permissões finas." },
              { icon: Sparkles, t: "Produtividade", d: "Templates, timesheet, tarefas e chat interno por processo." },
              { icon: Scale, t: "Gestão", d: "Funcionários, cargos, hierarquia, relatórios executivos e BI." },
            ].map((m) => (
              <div key={m.t} className="surface-card p-6 hover:shadow-[var(--shadow-elevated)] transition">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-[15px]">{m.t}</h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-[12px] text-muted-foreground">
          <p>{BRAND.footer}.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Segurança</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
