import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/services/api';
import type { LandingPublicPayload, LandingSettings } from '@/types/landing';

function firstText(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function pickThemeValue(theme: Record<string, any> | undefined, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = theme?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function buildThemeStyle(settings: LandingSettings | undefined) {
  const theme = settings?.theme || {};
  return {
    '--accent': pickThemeValue(theme, ['accent', 'primary_color'], '#c9ab76'),
    '--panel-bg': pickThemeValue(theme, ['dark_base', 'hero_start', 'hero_color_from'], '#0b1e35'),
    '--panel-mid': pickThemeValue(theme, ['hero_mid', 'hero_color_mid'], '#0d2744'),
  } as CSSProperties;
}

export default function PortalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const navigate = useNavigate();
  const { portalLogin } = useAuth();

  const publicSiteQuery = useQuery({
    queryKey: ['portal-login-brand'],
    queryFn: async () => await leadService.getPublicSite(),
  });

  const payload = (publicSiteQuery.data || {}) as LandingPublicPayload;
  const company = payload.company || {};
  const settings = payload.settings;

  const themeStyle = useMemo(() => buildThemeStyle(settings), [settings]);

  const brand = useMemo(() => {
    const companyName = firstText(settings?.brand_name, company.name, 'Jurídico') || 'Jurídico';
    const logoUrl = firstText(company.logo_url);
    const portalLabel = firstText(settings?.client_portal_label, 'Portal do Cliente');
    const tagline = firstText(settings?.brand_tagline, company.tagline, 'Acompanhe seu atendimento');
    return { companyName, logoUrl, portalLabel, tagline };
  }, [company.logo_url, company.name, company.tagline, settings]);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setFieldError('Preencha e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    setFieldError('');

    try {
      await portalLogin(trimmedEmail, trimmedPassword);
      navigate('/portal', { replace: true });
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (/email.*obrig|obrig.*email/i.test(msg) || /invalid.*credential|no active account|credenciais/i.test(msg)) {
        setFieldError('E-mail ou senha incorretos.');
      } else if (msg) {
        setFieldError(msg);
      } else {
        setFieldError('Não foi possível fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen" style={themeStyle}>
      <div className="flex min-h-screen">
        {/* Left panel — brand */}
        <div
          className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[42%]"
          style={{
            background: 'linear-gradient(160deg, var(--panel-bg) 0%, var(--panel-mid) 100%)',
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.05),transparent_60%)]" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-white/10" />

          <div className="relative">
            <div className="flex items-center gap-3">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.companyName}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--accent)' }}
                >
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <span className="text-sm font-semibold text-white/90">{brand.companyName}</span>
            </div>
          </div>

          <div className="relative">
            <div className="mb-6 h-px w-10" style={{ background: 'var(--accent)' }} />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
              {brand.portalLabel}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-snug tracking-tight text-white">
              Acompanhe seu<br />
              caso com<br />
              transparência.
            </h2>
          </div>

          <div className="relative">
            <p className="text-xs text-white/30">
              Acesso restrito a clientes cadastrados.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 dark:bg-zinc-950">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.companyName} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: '#f1f5f9', color: 'var(--panel-bg)' }}
              >
                <FileText className="h-4 w-4" />
              </div>
            )}
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{brand.companyName}</span>
          </div>

          <div className="w-full max-w-[360px]">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {brand.portalLabel}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                {brand.tagline}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  E-mail
                </Label>
                <Input
                  id="p-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="nome@exemplo.com.br"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  className="h-10 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Senha
                </Label>
                <Input
                  id="p-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  className="h-10 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:ring-offset-0 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {fieldError && (
                <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                  {fieldError}
                </p>
              )}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="mt-1 h-10 w-full text-sm font-medium text-white disabled:opacity-50"
                style={{
                  background: loading || !canSubmit
                    ? undefined
                    : 'linear-gradient(135deg, var(--panel-bg), var(--panel-mid))',
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando…
                  </span>
                ) : (
                  'Entrar no portal'
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
              Use os dados informados pelo escritório.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
