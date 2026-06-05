import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { Building2, RefreshCw } from 'lucide-react';

export default function SelectTenant() {
  const navigate = useNavigate();
  const { tenants, activeTenantId, setActiveTenant, refreshTenants, isLoadingTenants } = useTenant();

  useEffect(() => {
    if (activeTenantId) navigate('/app/dashboard', { replace: true });
  }, [activeTenantId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Selecione o escritório
          </CardTitle>
          <CardDescription>
            Você pode ter acesso a mais de um escritório. Escolha qual deseja usar agora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => refreshTenants()} disabled={isLoadingTenants}>
              <RefreshCw className={isLoadingTenants ? 'h-4 w-4 mr-2 animate-spin' : 'h-4 w-4 mr-2'} />
              Atualizar
            </Button>
          </div>

          {tenants.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum escritório disponível para este usuário.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTenant(t.id)}
                  className="text-left rounded-lg border p-4 hover:bg-accent transition"
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.slug || t.id}</div>
                  {t.roles?.length ? (
                    <div className="mt-2 text-xs text-muted-foreground">Roles: {t.roles.join(', ')}</div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
