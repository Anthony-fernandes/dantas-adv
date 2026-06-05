import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setTokens, setActiveTenantId } from '@/integrations/api/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AcceptInviteResponse = {
  tenant?: { id: string; name: string; slug?: string };
  access: string;
  refresh: string;
};

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = useMemo(() => (params.get('token') ?? '').trim(), [params]);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({ title: 'Convite inválido', description: 'Token não encontrado na URL.', variant: 'destructive' });
    }
  }, [token, toast]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const resp = await api.post<AcceptInviteResponse>('/auth/accept-invite/', {
        token,
        full_name: fullName,
        password: password || undefined,
      });

      setTokens({ access: resp.access, refresh: resp.refresh });
      if (resp?.tenant?.id) setActiveTenantId(resp.tenant.id);

      toast({ title: 'Convite aceito', description: 'Sua conta foi vinculada ao escritório.' });
      navigate('/app/dashboard', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Falha ao aceitar convite',
        description: err?.message ?? 'Verifique o token e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle>Aceitar convite</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Complete seus dados para entrar no escritório.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha (se for novo usuário)</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              <p className="text-xs text-muted-foreground">
                Se você já tem conta, pode deixar em branco.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Enviando...' : 'Aceitar convite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
