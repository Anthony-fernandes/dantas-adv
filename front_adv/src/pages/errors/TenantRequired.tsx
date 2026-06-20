import { Link } from 'react-router-dom';
import { Building2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TenantRequired() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
        <Building2 className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Escritório necessário
        </p>
        <h1 className="font-display text-3xl font-semibold text-foreground">Nenhum escritório selecionado</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Para acessar esta área, selecione um escritório. Se você não tiver acesso, entre em contato com o administrador do sistema.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild className="gap-2">
          <Link to="/app/select-tenant">
            <Building2 className="h-4 w-4" />
            Selecionar escritório
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/app/login" className="gap-2">
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </Button>
      </div>
    </div>
  );
}
