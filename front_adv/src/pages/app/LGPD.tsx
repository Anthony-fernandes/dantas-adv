import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-xl">Aceite de termos (LGPD)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para continuar usando o sistema, você precisa aceitar os termos de uso e a política de privacidade.
            Este aceite é registrado com data e hora.
          </p>
          <div className="rounded-lg border p-4 text-sm leading-relaxed">
            <p className="font-medium mb-2">Resumo</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Tratamento de dados pessoais estritamente para execução do serviço.</li>
              <li>Registro de auditoria e logs operacionais para segurança e conformidade.</li>
              <li>Você pode exportar seus dados do tenant a qualquer momento (Admin/Owner).</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <Button onClick={accept}>Aceitar e continuar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
