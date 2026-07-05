import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserCircle2, ArrowRight, Scale, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/portal/login")({
  head: () => ({ meta: [{ title: "Portal do Cliente — JurisFlow" }] }),
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [user, setUser] = useState("");
  const [pwd, setPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !pwd) {
      toast.error("Informe usuário e senha.");
      return;
    }
    setSubmitting(true);
    try {
      await login(user, pwd, true);
      navigate({ to: "/portal" });
    } catch (err: any) {
      toast.error(err?.detail || "Não foi possível acessar o portal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md surface-card p-8">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Scale className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold">JurisFlow</span>
          <span className="ml-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground border border-border rounded-full px-2 py-0.5">Portal do cliente</span>
        </div>

        <div className="mt-8 grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
          <UserCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Acompanhe seus processos</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">Documentos, andamentos, financeiro e contratos, em um só lugar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="E-mail, CPF ou CNPJ" className="w-full h-11 rounded-md border border-input bg-background px-3.5 text-[14px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
          <input value={pwd} onChange={(e) => setPwd(e.target.value)} type="password" placeholder="Senha" className="w-full h-11 rounded-md border border-input bg-background px-3.5 text-[14px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition" />
          <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-[14px] font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Acessar portal <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
          É advogado do escritório? <Link to="/login" className="text-accent hover:underline">Acesso interno</Link>
        </p>
      </div>
    </div>
  );
}