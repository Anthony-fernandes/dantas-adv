import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, RefreshCw, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  LAWYER: 'Advogado(a)',
  ASSISTANT: 'Assistente',
  FINANCE: 'Financeiro',
  CLIENT: 'Cliente',
};

export default function SelectTenant() {
  const navigate = useNavigate();
  const { tenants, activeTenantId, setActiveTenant, refreshTenants, isLoadingTenants } = useTenant();

  useEffect(() => {
    if (activeTenantId) navigate('/app/dashboard', { replace: true });
  }, [activeTenantId, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Selecione o escritório</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Você tem acesso a mais de um escritório. Escolha qual deseja usar.
          </p>
        </div>
      </div>

      <div className="w-full max-w-lg space-y-3">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => refreshTenants()} disabled={isLoadingTenants} className="gap-2 text-muted-foreground">
            <RefreshCw className={cn('h-3.5 w-3.5', isLoadingTenants && 'animate-spin')} />
            Atualizar
          </Button>
        </div>

        {tenants.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum escritório disponível para este usuário.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Entre em contato com o administrador do escritório.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTenant(t.id)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-foreground/20 hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.roles?.map((r) => ROLE_LABELS[r] ?? r).join(', ') || t.slug || t.id.slice(0, 8)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
