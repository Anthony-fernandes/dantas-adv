import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/master/login")({
  head: () => ({ meta: [{ title: pageTitle("Master") }] }),
  component: MasterLoginPage,
});

function MasterLoginPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary text-primary-foreground p-6 gradient-brand">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-white/10">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.16em] text-white/60">Console Master</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Administração do SaaS</h1>
        <p className="mt-1.5 text-[13.5px] text-white/70">Acesso restrito a superusuários da plataforma.</p>

        <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/master/companies" }); }} className="mt-6 space-y-3">
          <input placeholder="E-mail" className="w-full h-11 rounded-md border border-white/15 bg-white/5 px-3.5 text-[14px] placeholder:text-white/40 outline-none focus:border-white/40 transition" />
          <input type="password" placeholder="Senha" className="w-full h-11 rounded-md border border-white/15 bg-white/5 px-3.5 text-[14px] placeholder:text-white/40 outline-none focus:border-white/40 transition" />
          <input placeholder="Código de verificação (2FA)" className="w-full h-11 rounded-md border border-white/15 bg-white/5 px-3.5 text-[14px] placeholder:text-white/40 outline-none focus:border-white/40 transition font-mono tracking-widest" />
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white text-primary px-4 py-3 text-[14px] font-medium hover:bg-white/90 transition">
            Autenticar <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-[12px] text-white/50">
          <Link to="/login" className="hover:text-white">← Voltar ao acesso normal</Link>
        </p>
      </div>
    </div>
  );
}