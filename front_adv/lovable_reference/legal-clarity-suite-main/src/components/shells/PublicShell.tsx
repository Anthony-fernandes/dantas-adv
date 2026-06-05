import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-8 bg-ink grid place-items-center rounded-sm text-paper font-display italic text-lg leading-none">J</div>
            <span className="font-display text-2xl tracking-tight">JurisDictum</span>
          </Link>
          <nav className="hidden md:flex items-center gap-9 text-[12px] font-medium uppercase tracking-[0.14em]">
            <Link to="/" hash="areas" className="hover:text-gold transition-colors">Atuação</Link>
            <Link to="/" hash="sobre" className="hover:text-gold transition-colors">Escritório</Link>
            <Link to="/" hash="diferenciais" className="hover:text-gold transition-colors">Diferenciais</Link>
            <Link to="/" hash="blog" className="hover:text-gold transition-colors">Insights</Link>
            <Link to="/" hash="contato" className="hover:text-gold transition-colors">Contato</Link>
            <Link to="/app/login" className="bg-ink text-paper px-5 py-2 rounded-sm hover:bg-gold transition-colors">Acesso Restrito</Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="bg-ink text-paper/70 py-14 px-6 mt-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="font-display text-2xl text-paper italic">JurisDictum</div>
            <p className="text-xs mt-3 leading-relaxed text-paper/50 max-w-xs">Plataforma jurídica para escritórios que tratam informação como ativo estratégico.</p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-4 font-mono-ui">Atuação</div>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-paper">Contencioso Cível</a></li>
              <li><a href="#" className="hover:text-paper">Trabalhista</a></li>
              <li><a href="#" className="hover:text-paper">Tributário</a></li>
              <li><a href="#" className="hover:text-paper">Empresarial</a></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-4 font-mono-ui">Plataforma</div>
            <ul className="space-y-2 text-xs">
              <li><Link to="/app/login" className="hover:text-paper">Área Interna</Link></li>
              <li><Link to="/portal/login" className="hover:text-paper">Portal do Cliente</Link></li>
              <li><Link to="/master/login" className="hover:text-paper">Console Master</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-4 font-mono-ui">Contato</div>
            <p className="text-xs leading-relaxed">Av. Brigadeiro Faria Lima, 4221 — 8º andar<br/>São Paulo · SP · 04538-133<br/>+55 11 3000-2200</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex justify-between text-[10px] uppercase tracking-[0.18em] text-paper/40 font-mono-ui">
          <span>© 2026 JurisDictum Legal Systems</span>
          <span>Privacidade · Termos · LGPD</span>
        </div>
      </footer>
    </div>
  );
}
