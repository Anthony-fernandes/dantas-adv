import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Scale, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { BRAND, pageTitle } from "@/lib/brand";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: pageTitle("Entrar") }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pwd) {
      toast.error("Informe e-mail e senha.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, pwd);
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err?.detail || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-primary-foreground overflow-hidden gradient-brand">
        <div className="absolute inset-0 opacity-30"
             style={{ backgroundImage: "radial-gradient(600px 400px at 20% 20%, oklch(1 0 0 / 0.15), transparent), radial-gradient(500px 300px at 80% 80%, oklch(0.55 0.14 255 / 0.4), transparent)" }} />
        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-white/10 backdrop-blur">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">{BRAND.name}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">Legal Suite</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight tracking-tight">
            "A gestão silenciosa da advocacia de alto padrão."
          </p>
          <p className="mt-4 text-white/70 text-[15px] leading-relaxed">
            Processos, prazos, clientes e financeiro — organizados com o rigor que o seu escritório merece.
          </p>
          <div className="mt-8 flex items-center gap-2 text-[12px] text-white/60">
            <ShieldCheck className="h-4 w-4" /> ISO 27001 · LGPD · SSO
          </div>
        </div>

        <div className="relative text-[11px] uppercase tracking-[0.16em] text-white/40">
          {BRAND.footer}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Scale className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">{BRAND.name}</span>
          </div>

          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Acesso ao sistema</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Entrar na plataforma</h1>
          <p className="mt-2 text-[13.5px] text-muted-foreground">Bem-vinda de volta. Insira suas credenciais para continuar.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-[12px] font-medium text-foreground">E-mail corporativo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3.5 text-[14px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-foreground">Senha</label>
                <a href="#" className="text-[11.5px] text-accent hover:underline">Esqueci minha senha</a>
              </div>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3.5 text-[14px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
            </div>

            <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground select-none cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-input accent-primary" defaultChecked />
              Manter-me conectada por 30 dias
            </label>

            <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <span className="relative bg-background px-3 mx-auto block w-fit text-[11px] uppercase tracking-[0.14em] text-muted-foreground">ou</span>
            </div>

            <button type="button" className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-[13.5px] font-medium hover:bg-muted transition">
              Entrar com SSO corporativo
            </button>
          </form>

          <p className="mt-8 text-center text-[12.5px] text-muted-foreground">
            É cliente do escritório? <Link to="/portal/login" className="text-accent hover:underline">Acessar o portal do cliente</Link>
          </p>
        </div>
      </div>
    </div>
  );
}