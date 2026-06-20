import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    if (!name.trim()) { toast.error('Informe o nome do escritório.'); return; }
    if (!ownerEmail) { toast.error('Seu usuário não tem e-mail configurado.'); return; }
    if (!ownerPassword || ownerPassword.length < 6) { toast.error('Defina uma senha (mínimo 6 caracteres).'); return; }

    setLoading(true);
    try {
      const resp = await api.post<any>('/tenants/', {
        tenant: { name: name.trim(), slug: slugify(name) },
        owner: { email: ownerEmail, password: ownerPassword, full_name: ownerName || ownerEmail },
      });

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Criar escritório</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure seu escritório para começar a usar o sistema.
          </p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <form onSubmit={handleSetup} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do escritório</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Dantas & Associados"
            />
          </div>

          <div className="space-y-1.5">
            <Label>E-mail do proprietário</Label>
            <Input value={ownerEmail} disabled className="text-muted-foreground" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha de acesso</Label>
            <Input
              id="password"
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button type="button" variant="ghost" onClick={logout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Building2 className="h-4 w-4" />
              {loading ? 'Criando...' : 'Criar escritório'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
