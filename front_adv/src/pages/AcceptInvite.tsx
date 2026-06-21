import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Scale } from 'lucide-react';
import { api, setTokens, setActiveTenantId } from '@/integrations/api/client';
import { useToast } from '@/components/ui/use-toast';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({ title: 'Convite inválido', description: 'Token não encontrado na URL.', variant: 'destructive' });
    }
  }, [token, toast]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password && password !== confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    if (password && password.length < 8) {
      toast({ title: 'A senha deve ter ao menos 8 caracteres', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await api.post<AcceptInviteResponse>('/auth/accept-invite/', {
        token,
        full_name: fullName.trim() || undefined,
        password: password || undefined,
      });

      setTokens({ access: resp.access, refresh: resp.refresh });
      if (resp?.tenant?.id) setActiveTenantId(resp.tenant.id);

      setSuccess(true);
      setTimeout(() => navigate('/app/dashboard', { replace: true }), 1800);
    } catch (err: any) {
      toast({
        title: 'Erro ao aceitar convite',
        description: err?.message || 'Tente novamente ou solicite um novo convite.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-950/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">Acesso concedido!</h2>
            <p className="mt-1 text-sm text-muted-foreground">Você está sendo redirecionado...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Você foi convidado</h1>
            <p className="mt-1 text-sm text-muted-foreground">Complete seus dados para acessar o escritório.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">
                Senha <span className="text-xs text-muted-foreground">(deixe em branco se já tem conta)</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {password && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Confirmando...' : 'Aceitar convite'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
