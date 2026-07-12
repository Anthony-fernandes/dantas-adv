import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Scale, Mail, Building2, CheckCircle2, Shield } from "lucide-react";
import { BRAND, pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/convite")({
  head: () => ({ meta: [{ title: pageTitle("Aceitar convite") }, { name: "robots", content: "noindex" }] }),
  component: ConvitePage,
});

function ConvitePage() {
  const nav = useNavigate();
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Scale className="h-4 w-4" /></div>
          <span className="font-display font-semibold text-lg">{BRAND.name}</span>
        </div>

        {!accepted ? (
          <div className="surface-card p-7">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Convite pendente</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">Você foi convidado(a)</h1>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              A Dra. <strong className="text-foreground">Marina Souza</strong> convidou você a integrar o workspace do escritório.
            </p>

            <div className="mt-5 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold">Souza & Palma Advogados</p>
                  <p className="text-[12px] text-muted-foreground">Plano Business · 24 usuários</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">Perfil: Advogado(a)</span>
                <span className="rounded-full bg-info/10 text-info px-2 py-0.5">Área: Cível</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setAccepted(true); }} className="mt-5 space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">E-mail do convite</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2.5 text-[13.5px] text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> voce@souzaepalma.com.br
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Nome completo *</label>
                <input required className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]" placeholder="Seu nome" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Crie uma senha *</label>
                <input required type="password" className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]" placeholder="Mínimo 10 caracteres" />
              </div>
              <label className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
                <input required type="checkbox" className="mt-0.5 rounded border-border" />
                <span>Li e aceito os <Link to="/lgpd" className="text-primary hover:underline">termos e a política de privacidade</Link>.</span>
              </label>
              <button type="submit" className="w-full rounded-md bg-primary py-2.5 text-[13.5px] font-medium text-primary-foreground hover:bg-primary/90">Aceitar convite</button>
            </form>

            <div className="mt-5 rounded-md bg-info/8 border border-info/20 p-3 flex gap-2.5 text-[12px] text-foreground/80">
              <Shield className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p>Ao aceitar, você concorda com o sigilo profissional e o tratamento de dados sob a LGPD.</p>
            </div>
          </div>
        ) : (
          <div className="surface-card p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/12 text-success"><CheckCircle2 className="h-6 w-6" /></div>
            <h2 className="mt-4 font-display text-xl font-semibold">Convite aceito</h2>
            <p className="mt-2 text-[13.5px] text-muted-foreground">Sua conta está ativa. Redirecionando para o workspace...</p>
            <button onClick={() => nav({ to: "/app" })} className="mt-5 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground">Ir para o workspace</button>
          </div>
        )}
      </div>
    </div>
  );
}