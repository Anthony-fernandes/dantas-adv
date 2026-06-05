import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Gavel, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/services/api';
import { toast } from 'sonner';
import type { LandingPublicPayload, LandingSettings } from '@/types/landing';

const ACCESS_POINTS = [
  'Acompanhamento de processos, prazos e compromissos jurídicos.',
  'Ambiente interno reservado para equipe jurídica e administrativa.',
  'Centralização das rotinas essenciais do escritório em um único painel.',
] as const;

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

function buildLoginThemeStyle(settings: LandingSettings | undefined) {
  const theme = settings?.theme || {};

  return {
    '--landing-accent': pickThemeValue(theme, ['accent', 'primary_color'], '#c9ab76'),
    '--landing-accent-strong': pickThemeValue(theme, ['accent_strong', 'secondary_color'], '#f0d7a1'),
    '--landing-dark-base': pickThemeValue(theme, ['dark_base'], '#081d36'),
    '--landing-hero-start': pickThemeValue(theme, ['hero_start', 'hero_color_from'], '#081d36'),
    '--landing-hero-mid': pickThemeValue(theme, ['hero_mid', 'hero_color_mid'], '#0a2649'),
    '--landing-hero-end': pickThemeValue(theme, ['hero_end', 'hero_color_to'], '#0d355f'),
  } as CSSProperties;
}

function colorToRgba(color: string | undefined, opacity: number, fallback = '#081d36') {
  const input = String(color || fallback).trim() || fallback;
  const normalized = input.replace('#', '');

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const red = Number.parseInt(normalized[0] + normalized[0], 16);
    const green = Number.parseInt(normalized[1] + normalized[1], 16);
    const blue = Number.parseInt(normalized[2] + normalized[2], 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  return input;
}

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const publicSiteQuery = useQuery({
    queryKey: ['app-login-brand'],
    queryFn: async () => await leadService.getPublicSite(),
  });

  const payload = (publicSiteQuery.data || {}) as LandingPublicPayload;
  const company = payload.company || {};
  const settings = payload.settings;

  const themeStyle = useMemo(() => buildLoginThemeStyle(settings), [settings]);

  const brand = useMemo(() => {
    const companyName = firstText(settings?.brand_name, company.name, 'JurisFlow') || 'JurisFlow';
    const logoUrl = firstText(company.logo_url);
    const heroImage = firstText(settings?.hero_background_image_url, settings?.hero_background_image);
    const heroOverlay = colorToRgba(settings?.hero_overlay_color, Number(settings?.hero_overlay_opacity ?? 0.76));
    const companyTagline = firstText(
      settings?.brand_tagline,
      company.tagline,
      'Área interna do escritório',
    );

    return {
      companyName,
      logoUrl,
      heroImage,
      heroOverlay,
      companyTagline,
    };
  }, [company.logo_url, company.name, company.tagline, settings]);

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading;

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.isSuperuser) navigate('/app', { replace: true });
      else navigate('/app/select-tenant', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-theme min-h-screen text-white" style={themeStyle}>
      <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,var(--landing-hero-start),var(--landing-hero-mid),var(--landing-hero-end))]">
        {brand.heroImage ? (
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: `linear-gradient(${brand.heroOverlay}, ${brand.heroOverlay}), url(${brand.heroImage})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
            }}
          />
        ) : null}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(201,171,118,0.12),transparent_24%),linear-gradient(180deg,rgba(6,13,36,0.16),rgba(6,13,36,0.54))]" />

        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <section className="hidden lg:block">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/80">
                  <ShieldCheck className="h-4 w-4" style={{ color: 'var(--landing-accent)' }} />
                  Área restrita
                </div>

                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--landing-accent-strong)' }}>
                  {brand.companyName}
                </p>
                <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-[-0.04em] text-white">
                  Painel interno do escritório.
                </h1>
                <p className="mt-5 text-lg leading-8 text-white/72">
                  Acesse o ambiente interno para acompanhar processos, organizar prazos e conduzir a rotina jurídica do escritório com segurança e clareza.
                </p>

                <div className="mt-10 space-y-4">
                  {ACCESS_POINTS.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-white/82">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--landing-accent)' }} />
                      <span className="text-base leading-7">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="w-full">
              <div className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-white text-slate-900 shadow-[0_32px_100px_-34px_rgba(2,6,23,0.9)]">
                <div className="p-6 sm:p-8">
                  <div className="text-center">
                    {brand.logoUrl ? (
                      <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <img
                          src={brand.logoUrl}
                          alt={`Logo do escritório ${brand.companyName}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50"
                        style={{ color: 'var(--landing-dark-base)' }}
                      >
                        <Gavel className="h-10 w-10" />
                      </div>
                    )}

                    <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--landing-accent)' }}>
                      Área interna
                    </p>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950">
                      {brand.companyName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {brand.companyTagline}
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="mt-8 space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        E-mail
                      </Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          autoFocus
                          placeholder="nome@escritorio.com"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 text-[15px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-300 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          className="h-[52px] rounded-2xl border-slate-200 bg-slate-50 pl-11 text-[15px] text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-300 focus-visible:ring-offset-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Acesso exclusivo para usuários autorizados do escritório.
                    </div>

                    <Button
                      type="submit"
                      className="h-[52px] w-full rounded-2xl text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_20px_40px_-22px_rgba(8,29,54,0.8)] transition-all hover:opacity-95"
                      style={{ background: 'linear-gradient(135deg, var(--landing-hero-mid), var(--landing-hero-end))' }}
                      disabled={!canSubmit}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
