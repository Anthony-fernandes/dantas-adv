import { Scale, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiRequest } from '@/integrations/api/client';

export default function LGPD() {
  async function accept() {
    try {
      await apiRequest('/me/accept-lgpd/', { method: 'POST' });
      toast.success('Termos aceitos. Obrigado!');
      window.location.href = '/app/dashboard';
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível registrar o aceite');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <Scale className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Termos de uso e privacidade</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Para continuar, leia e aceite os termos abaixo (LGPD).
          </p>
        </div>
      </div>

      <div className="w-full max-w-xl space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Resumo dos termos</p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              Tratamento de dados pessoais estritamente para execução do serviço contratado.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              Registro de auditoria e logs operacionais para segurança e conformidade legal.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              Proprietários e administradores podem exportar os dados do escritório a qualquer momento.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
              Nenhum dado é compartilhado com terceiros sem consentimento explícito.
            </li>
          </ul>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ao clicar em "Aceitar e continuar", você registra o seu aceite com data e hora para fins de conformidade.
        </p>

        <Button onClick={accept} className="w-full">
          Aceitar e continuar
        </Button>
      </div>
    </div>
  );
}
