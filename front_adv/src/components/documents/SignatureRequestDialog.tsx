import { useState } from 'react';
import { CheckCircle2, ExternalLink, FileSignature, Loader2, Mail, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

type Signer = { name: string; email: string; role: string };

type SignatureResult = {
  signing_url?: string;
  document_id?: string;
  status?: string;
  message?: string;
};

const ROLE_OPTIONS = [
  { value: 'contractor', label: 'Contratante' },
  { value: 'contracted', label: 'Contratado' },
  { value: 'witness', label: 'Testemunha' },
  { value: 'guarantor', label: 'Fiador' },
  { value: 'party', label: 'Parte' },
];

const PROVIDER_OPTIONS = [
  { value: 'd4sign', label: 'D4Sign' },
  { value: 'clicksign', label: 'ClickSign' },
  { value: 'docusign', label: 'DocuSign' },
  { value: 'internal', label: 'Assinatura simples (interna)' },
];

const EMPTY_SIGNER: Signer = { name: '', email: '', role: 'party' };

type Props = {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle?: string;
};

export function SignatureRequestDialog({ open, onClose, documentId, documentTitle }: Props) {
  const { toast } = useToast();
  const [signers, setSigners] = useState<Signer[]>([{ ...EMPTY_SIGNER }]);
  const [provider, setProvider] = useState('d4sign');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignatureResult | null>(null);

  function addSigner() {
    setSigners((s) => [...s, { ...EMPTY_SIGNER }]);
  }

  function removeSigner(i: number) {
    setSigners((s) => s.filter((_, idx) => idx !== i));
  }

  function updateSigner(i: number, field: keyof Signer, value: string) {
    setSigners((s) => s.map((signer, idx) => idx === i ? { ...signer, [field]: value } : signer));
  }

  async function sendForSignature() {
    const invalid = signers.some((s) => !s.email.trim() || !s.name.trim());
    if (invalid) {
      toast({ title: 'Preencha nome e e-mail de todos os signatários.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res: SignatureResult = await api.post('/signature-requests/', {
        document: documentId,
        provider,
        deadline: deadline || undefined,
        signers: signers.map((s) => ({ name: s.name.trim(), email: s.email.trim(), role: s.role })),
      });
      setResult(res);
      toast({ title: 'Solicitação de assinatura enviada com sucesso!' });
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao enviar solicitação.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSigners([{ ...EMPTY_SIGNER }]);
    setResult(null);
    setDeadline('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            Solicitar assinaturas
          </DialogTitle>
        </DialogHeader>

        {documentTitle && (
          <p className="text-sm text-muted-foreground">
            Documento: <span className="font-medium text-foreground">{documentTitle}</span>
          </p>
        )}

        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/20">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Solicitação enviada
                </p>
                <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
                  {result.message || `Os signatários receberão o e-mail de assinatura via ${PROVIDER_OPTIONS.find(p => p.value === provider)?.label}.`}
                </p>
              </div>
            </div>

            {result.signing_url && (
              <a
                href={result.signing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground hover:bg-muted/50"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                Abrir link de assinatura
              </a>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Provider */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Provedor de assinatura</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prazo para assinar <span className="text-muted-foreground">(opcional)</span></Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>

            {/* Signers */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Signatários</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={addSigner}>
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>

              {signers.map((signer, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Signatário {i + 1}</p>
                    {signers.length > 1 && (
                      <button type="button" onClick={() => removeSigner(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome completo"
                      value={signer.name}
                      onChange={(e) => updateSigner(i, 'name', e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="E-mail"
                      value={signer.email}
                      onChange={(e) => updateSigner(i, 'email', e.target.value)}
                    />
                  </div>
                  <Select value={signer.role} onValueChange={(v) => updateSigner(i, 'role', v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={sendForSignature} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {loading ? 'Enviando...' : 'Enviar para assinatura'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
