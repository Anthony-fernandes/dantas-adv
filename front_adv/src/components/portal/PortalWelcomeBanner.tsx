import { useState } from 'react';
import { ArrowRight, CheckCircle2, DollarSign, FileText, MessageSquare, Scale, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Scale,
    label: 'Ver seus processos',
    description: 'Consulte o andamento de todos os seus casos',
    href: '/portal/processos',
  },
  {
    icon: FileText,
    label: 'Acessar documentos',
    description: 'Baixe petições, contratos e documentos compartilhados',
    href: '/portal/documentos',
  },
  {
    icon: DollarSign,
    label: 'Acompanhar financeiro',
    description: 'Veja cobranças, pagamentos e extratos',
    href: '/portal/financeiro',
  },
  {
    icon: MessageSquare,
    label: 'Enviar mensagem',
    description: 'Fale diretamente com seu advogado',
    href: '/portal/mensagens',
  },
];

const STORAGE_KEY = 'portal_welcome_dismissed';

export function PortalWelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setDismissed(true);
  }

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-card overflow-hidden">
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-foreground" />

      <div className="px-5 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bem-vindo ao portal
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Como posso ajudar você hoje?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui você acompanha seus processos, documentos e pagamentos em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STEPS.map((step) => (
            <Link
              key={step.href}
              to={step.href}
              className="group flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-all hover:border-foreground/20 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 transition-colors group-hover:bg-muted">
                <step.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="truncate text-xs text-muted-foreground">{step.description}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Seus dados são protegidos e criptografados
          </p>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={dismiss}>
            Não mostrar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
