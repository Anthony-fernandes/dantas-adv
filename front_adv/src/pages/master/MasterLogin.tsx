import { type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { firstText } from "@/lib/brandTheme";
import { leadService } from "@/services/api";
import type { LandingPublicPayload } from "@/types/landing";

export default function MasterLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const publicSiteQuery = useQuery({
    queryKey: ["master-login-brand"],
    queryFn: async () => await leadService.getPublicSite(),
  });

  const payload = (publicSiteQuery.data || {}) as LandingPublicPayload;
  const company = payload.company || {};
  const settings = payload.settings;

  const brand = useMemo(() => {
    const companyName = firstText(settings?.brand_name, company.name, "JurisFlow") || "JurisFlow";
    const logoUrl = firstText(company.logo_url);
    return { companyName, logoUrl };
  }, [company.logo_url, company.name, settings?.brand_name]);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setFieldError("Preencha e-mail e senha para continuar.");
      return;
    }

    setLoading(true);
    setFieldError("");

    try {
      await logout();
      const result = await login(trimmedEmail, trimmedPassword);
      if (!result.isSuperuser) {
        setFieldError("Acesso negado. Esta área é restrita a superusuários.");
        return;
      }
      navigate("/master/companies", { replace: true });
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (/email.*obrig|obrig.*email|invalid.*credential|no active account|credenciais/i.test(msg)) {
        setFieldError("E-mail ou senha incorretos.");
      } else if (msg) {
        setFieldError(msg);
      } else {
        setFieldError("Não foi possível fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-900 p-10 lg:flex lg:w-[42%]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.03),transparent_60%)]" />

        <div className="relative flex items-center gap-3">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.companyName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Building2 className="h-5 w-5 text-white/40" />
            </div>
          )}
          <span className="text-sm font-semibold text-white/70">{brand.companyName}</span>
        </div>

        <div className="relative">
          <div className="mb-6 h-px w-8 bg-white/20" />
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/30">
            Administração central
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-snug tracking-tight text-white">
            Controle<br />
            multiempresa<br />
            centralizado.
          </h2>
        </div>

        <p className="relative text-xs text-white/20">Acesso restrito a superusuários.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <Building2 className="h-5 w-5 text-white/40" />
          <span className="text-sm font-semibold text-white/70">{brand.companyName}</span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Shield className="h-5 w-5 text-white/40" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Admin central
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Área restrita — apenas superusuários
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-400">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="admin@sistema.com.br"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldError) setFieldError(""); }}
                className="h-10 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-400">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldError) setFieldError(""); }}
                className="h-10 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:ring-offset-0"
              />
            </div>

            {fieldError && (
              <p className="rounded-md border border-red-900/40 bg-red-950/30 px-3 py-2.5 text-sm text-red-400">
                {fieldError}
              </p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="mt-1 h-10 w-full bg-zinc-700 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-700">
            Acesso monitorado. Todas as ações são registradas.
          </p>
        </div>
      </div>
    </div>
  );
}
