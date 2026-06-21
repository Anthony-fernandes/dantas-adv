import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10">
        <ShieldOff className="h-7 w-7 text-destructive" />
      </div>
      <div className="space-y-2">
        <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Erro 403
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Acesso negado</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Você não tem permissão para acessar esta área. Contate o administrador do escritório se acreditar que deveria ter acesso.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild className="gap-2">
          <Link to="/app/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Ir ao painel
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/app/login">Trocar conta</Link>
        </Button>
      </div>
    </div>
  );
}
