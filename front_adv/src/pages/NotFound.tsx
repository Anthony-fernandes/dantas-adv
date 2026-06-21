import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Home, Scale, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  const homeHref = user ? '/app/dashboard' : '/app/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-card">
          <Scale className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Code */}
        <p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Erro 404
        </p>

        {/* Heading */}
        <h1 className="mt-3 font-display text-[2.2rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          Página não encontrada
        </h1>

        {/* Description */}
        <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
          O endereço{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {location.pathname}
          </code>{' '}
          não existe ou foi movido.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link to={homeHref}>
              <Home className="h-4 w-4" />
              {user ? 'Voltar ao painel' : 'Ir para login'}
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Página anterior
          </Button>
        </div>

        {/* Suggestions */}
        {user && (
          <div className="mt-8 rounded-xl border border-border bg-card p-4 text-left shadow-card">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Acesso rápido
            </p>
            <div className="space-y-1">
              {[
                { label: 'Processos', href: '/app/processos' },
                { label: 'Clientes', href: '/app/clientes' },
                { label: 'Agenda', href: '/app/agenda' },
                { label: 'Financeiro', href: '/app/financeiro' },
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
