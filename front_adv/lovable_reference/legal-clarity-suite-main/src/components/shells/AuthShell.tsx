import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function AuthShell({ children, title, subtitle, eyebrow, footer }: { children: ReactNode; title: string; subtitle?: string; eyebrow: string; footer?: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink text-paper relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="size-8 bg-gold grid place-items-center rounded-sm text-white font-display italic text-lg leading-none">J</div>
          <span className="font-display text-2xl">JurisDictum</span>
        </Link>
        <div className="relative z-10">
          <p className="font-display italic text-4xl leading-tight text-balance">"A precisão técnica encontra a autoridade jurídica contemporânea."</p>
          <div className="mt-8 eyebrow text-paper/60">Manifesto editorial — Vol. 12</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] font-mono-ui text-paper/40 relative z-10">© 2026 JurisDictum Legal Systems</div>
        <div className="absolute -right-32 -bottom-32 size-[28rem] rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute right-12 top-12 text-[200px] font-display italic text-paper/5 leading-none select-none">§</div>
      </div>
      <div className="flex flex-col justify-center px-6 py-12 lg:px-20">
        <div className="max-w-md w-full mx-auto">
          <div className="eyebrow mb-3">{eyebrow}</div>
          <h1 className="font-display text-4xl mb-2">{title}</h1>
          {subtitle && <p className="text-ink-soft text-sm mb-8">{subtitle}</p>}
          {children}
          {footer && <div className="mt-8 text-xs text-ink-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, type = "text", placeholder, hint }: { label: string; type?: string; placeholder?: string; hint?: string }) {
  return (
    <label className="block mb-4">
      <div className="text-[11px] font-mono-ui uppercase tracking-widest text-ink-soft mb-1.5">{label}</div>
      <input type={type} placeholder={placeholder} className="w-full h-11 px-3 bg-surface border border-rule rounded-md text-sm focus:outline-none focus:border-gold/60" />
      {hint && <div className="text-[11px] text-ink-soft mt-1">{hint}</div>}
    </label>
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return <button className="w-full h-11 bg-ink text-paper text-sm font-medium uppercase tracking-[0.14em] hover:bg-gold transition-colors rounded-md">{children}</button>;
}
