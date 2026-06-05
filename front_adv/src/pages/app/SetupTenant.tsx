import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api, setTokens } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function SetupTenant() {
  const [name, setName] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, profile, logout } = useAuth() as any;
  const { refreshTenants } = useTenant();
  const navigate = useNavigate();

  const ownerEmail = useMemo(() => String(user?.email ?? ''), [user]);
  const ownerName = useMemo(() => String(profile?.full_name ?? ''), [profile]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do escritório.');
      return;
    }
    if (!ownerEmail) {
      toast.error('Seu usuário não tem e-mail configurado.');
      return;
    }
    if (!ownerPassword || ownerPassword.length < 6) {
      toast.error('Defina uma senha (mínimo 6 caracteres).');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post<any>('/tenants/', {
        tenant: { name: name.trim(), slug: slugify(name) },
        owner: { email: ownerEmail, password: ownerPassword, full_name: ownerName || ownerEmail },
      });

      // backend retorna access/refresh no onboarding
      if (resp?.access && resp?.refresh) {
        setTokens({ access: resp.access, refresh: resp.refresh });
      }

      await refreshTenants();
      navigate('/app/dashboard', { replace: true });
      toast.success('Escritório criado com sucesso.');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao criar escritório.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Criar escritório
          </CardTitle>
          <CardDescription>
            Seu usuário ainda não está vinculado a um escritório. Crie um agora para começar a usar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do escritório</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Dantas & Associados" />
            </div>

            <div className="space-y-2">
              <Label>E-mail do proprietário</Label>
              <Input value={ownerEmail} disabled />
            </div>

            <div className="space-y-2">
              <Label>Senha do proprietário</Label>
              <Input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="Defina uma senha" />
              <p className="text-xs text-muted-foreground">
                O backend pode reemitir tokens do owner após o onboarding.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar escritório'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
