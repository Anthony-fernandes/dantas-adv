import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <Scale className="h-7 w-7" />
      </div>
      <div className="space-y-2">
        <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Erro 404
        </p>
        <h1 className="font-display text-4xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          O endereço <code className="rounded bg-muted px-1 py-0.5 text-xs">{location.pathname}</code> não existe neste sistema.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link to="/app/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
