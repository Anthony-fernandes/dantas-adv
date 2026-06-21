import { Link } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SessionExpired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
        <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="space-y-2">
        <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Sessão encerrada
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Sessão expirada</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Por segurança, sua sessão foi encerrada após um período de inatividade. Faça login novamente para continuar.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link to="/app/login">
          <LogIn className="h-4 w-4" />
          Fazer login
        </Link>
      </Button>
    </div>
  );
}
