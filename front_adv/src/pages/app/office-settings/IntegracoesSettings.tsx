import { useEffect, useState } from 'react';
import { Save, CheckCircle2, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

type Props = {
  tenantId: string;
  tenantSettings: Record<string, any>;
  tenantCnpj?: string | null;
  canEdit: boolean;
  onSaved: () => void;
};

export function IntegracoesSettings({ tenantId, tenantSettings: initSettings, tenantCnpj, canEdit, onSaved }: Props) {
  const { toast } = useToast();

  // ---- Assinatura Digital ----
  const [sigProvider, setSigProvider] = useState<string>('none');
  const [clicksignApiKey, setClicksignApiKey] = useState('');
  const [clicksignWebhook, setClicksignWebhook] = useState('');
  const [d4signToken, setD4signToken] = useState('');
  const [d4signCrypt, setD4signCrypt] = useState('');
  const [d4signSafe, setD4signSafe] = useState('');

  // ---- NFS-e ----
  const [nfseEnabled, setNfseEnabled] = useState(false);
  const [nfseProvider, setNfseProvider] = useState('nuvem_fiscal');
  const [nfseClientId, setNfseClientId] = useState('');
  const [nfseClientSecret, setNfseClientSecret] = useState('');
  const [nfseCnpj, setNfseCnpj] = useState(tenantCnpj ?? '');
  const [nfseMunicipio, setNfseMunicipio] = useState('');
  const [nfseCodigoServico, setNfseCodigoServico] = useState('6014');
  const [nfseAliquota, setNfseAliquota] = useState('5');

  // ---- Tribunais ----
  const [tribunalProvider, setTribunalProvider] = useState('none');
  const [tribunalUrl, setTribunalUrl] = useState('');

  // ---- Escrituração ----
  const [escrituracaoEnabled, setEscrituracaoEnabled] = useState(false);

  // Saving states
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const s = initSettings ?? {};
    setSigProvider(s.sig_provider ?? 'none');
    setClicksignApiKey(s.clicksign_api_key ?? '');
    setClicksignWebhook(s.clicksign_webhook_secret ?? '');
    setD4signToken(s.d4sign_token ?? '');
    setD4signCrypt(s.d4sign_crypt_key ?? '');
    setD4signSafe(s.d4sign_safe_uuid ?? '');

    setNfseEnabled(s.nfse_enabled === true);
    setNfseProvider(s.nfse_provider ?? 'nuvem_fiscal');
    setNfseClientId(s.nfse_client_id ?? '');
    setNfseClientSecret(s.nfse_client_secret ?? '');
    setNfseCnpj(s.nfse_cnpj_prestador ?? tenantCnpj ?? '');
    setNfseMunicipio(s.nfse_codigo_municipio ?? '');
    setNfseCodigoServico(s.nfse_codigo_servico ?? '6014');
    setNfseAliquota(String(s.nfse_aliquota_iss ?? '5'));

    setTribunalProvider(s.tribunal_provider ?? 'none');
    setTribunalUrl(s.tribunal_url ?? '');

    setEscrituracaoEnabled(s.escrituracao_enabled === true);
  }, [initSettings, tenantCnpj]);

  async function save(section: string, patch: Record<string, any>) {
    if (!canEdit) return;
    setSaving(section);
    try {
      await api.patch(`/tenants/${tenantId}/`, {
        settings: { ...initSettings, ...patch },
      });
      setSaved(section);
      setTimeout(() => setSaved(null), 3000);
      onSaved();
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  }

  function SaveButton({ section, onClick }: { section: string; onClick: () => void }) {
    const isSaving = saving === section;
    const isSaved = saved === section;
    return (
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={onClick} disabled={isSaving || !canEdit} size="sm" className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
        {isSaved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Salvo
          </span>
        )}
      </div>
    );
  }

  return (
    <Tabs defaultValue="assinatura" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto gap-1">
        <TabsTrigger value="assinatura">Assinatura Digital</TabsTrigger>
        <TabsTrigger value="nfse">NFS-e</TabsTrigger>
        <TabsTrigger value="tribunais">Tribunais</TabsTrigger>
        <TabsTrigger value="escrituracao">Escrituração</TabsTrigger>
      </TabsList>

      {/* Assinatura Digital */}
      <TabsContent value="assinatura" className="space-y-4">
        <div className="space-y-1.5">
          <Label>Provedor de assinatura digital</Label>
          <Select value={sigProvider} onValueChange={setSigProvider} disabled={!canEdit}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              <SelectItem value="clicksign">Clicksign</SelectItem>
              <SelectItem value="d4sign">D4Sign</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sigProvider === 'clicksign' && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clicksign</p>
            <div className="space-y-1.5">
              <Label>API Key</Label>
              <Input type="password" value={clicksignApiKey} onChange={(e) => setClicksignApiKey(e.target.value)} disabled={!canEdit} placeholder="ck_..." />
            </div>
            <div className="space-y-1.5">
              <Label>Webhook Secret</Label>
              <Input type="password" value={clicksignWebhook} onChange={(e) => setClicksignWebhook(e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        )}

        {sigProvider === 'd4sign' && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">D4Sign</p>
            <div className="space-y-1.5">
              <Label>Token API</Label>
              <Input type="password" value={d4signToken} onChange={(e) => setD4signToken(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Crypt Key</Label>
              <Input type="password" value={d4signCrypt} onChange={(e) => setD4signCrypt(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Safe UUID</Label>
              <Input value={d4signSafe} onChange={(e) => setD4signSafe(e.target.value)} disabled={!canEdit} />
            </div>
          </div>
        )}

        <SaveButton section="assinatura" onClick={() => save('assinatura', {
          sig_provider: sigProvider,
          clicksign_api_key: clicksignApiKey,
          clicksign_webhook_secret: clicksignWebhook,
          d4sign_token: d4signToken,
          d4sign_crypt_key: d4signCrypt,
          d4sign_safe_uuid: d4signSafe,
        })} />
      </TabsContent>

      {/* NFS-e */}
      <TabsContent value="nfse" className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={nfseEnabled} onCheckedChange={setNfseEnabled} disabled={!canEdit} />
          <Label>Habilitar emissão de NFS-e</Label>
        </div>

        {nfseEnabled && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Provedor</Label>
              <Select value={nfseProvider} onValueChange={setNfseProvider} disabled={!canEdit}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuvem_fiscal">Nuvem Fiscal</SelectItem>
                  <SelectItem value="focus_nfe">Focus NFe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Client ID</Label>
                <Input value={nfseClientId} onChange={(e) => setNfseClientId(e.target.value)} disabled={!canEdit} />
              </div>
              <div className="space-y-1.5">
                <Label>Client Secret</Label>
                <Input type="password" value={nfseClientSecret} onChange={(e) => setNfseClientSecret(e.target.value)} disabled={!canEdit} />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ Prestador</Label>
                <Input value={nfseCnpj} onChange={(e) => setNfseCnpj(e.target.value)} disabled={!canEdit} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-1.5">
                <Label>Código município IBGE</Label>
                <Input value={nfseMunicipio} onChange={(e) => setNfseMunicipio(e.target.value)} disabled={!canEdit} placeholder="3550308" />
              </div>
              <div className="space-y-1.5">
                <Label>Código serviço LC116</Label>
                <Input value={nfseCodigoServico} onChange={(e) => setNfseCodigoServico(e.target.value)} disabled={!canEdit} placeholder="6014" />
              </div>
              <div className="space-y-1.5">
                <Label>Alíquota ISS (%)</Label>
                <Input type="number" value={nfseAliquota} onChange={(e) => setNfseAliquota(e.target.value)} disabled={!canEdit} min="0" max="100" step="0.01" />
              </div>
            </div>
          </div>
        )}

        <SaveButton section="nfse" onClick={() => save('nfse', {
          nfse_enabled: nfseEnabled,
          nfse_provider: nfseProvider,
          nfse_client_id: nfseClientId,
          nfse_client_secret: nfseClientSecret,
          nfse_cnpj_prestador: nfseCnpj,
          nfse_codigo_municipio: nfseMunicipio,
          nfse_codigo_servico: nfseCodigoServico,
          nfse_aliquota_iss: parseFloat(nfseAliquota) || 0,
        })} />
      </TabsContent>

      {/* Tribunais */}
      <TabsContent value="tribunais" className="space-y-4">
        <div className="space-y-1.5">
          <Label>Provedor padrão</Label>
          <Select value={tribunalProvider} onValueChange={setTribunalProvider} disabled={!canEdit}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              <SelectItem value="esaj">e-SAJ (SP)</SelectItem>
              <SelectItem value="pje">PJe</SelectItem>
              <SelectItem value="projudi">Projudi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(tribunalProvider === 'esaj' || tribunalProvider === 'pje') && (
          <div className="space-y-1.5">
            <Label>URL do Tribunal</Label>
            <Input
              value={tribunalUrl}
              onChange={(e) => setTribunalUrl(e.target.value)}
              disabled={!canEdit}
              placeholder={tribunalProvider === 'esaj' ? 'https://esaj.tjsp.jus.br' : 'https://pje.tjsp.jus.br'}
            />
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            As credenciais de acesso são opcionais para consultas públicas. Configure as credenciais diretamente em cada processo.
          </p>
        </div>

        <SaveButton section="tribunais" onClick={() => save('tribunais', {
          tribunal_provider: tribunalProvider,
          tribunal_url: tribunalUrl,
        })} />
      </TabsContent>

      {/* Escrituração */}
      <TabsContent value="escrituracao" className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={escrituracaoEnabled} onCheckedChange={setEscrituracaoEnabled} disabled={!canEdit} />
          <Label>Habilitar módulo de escrituração contábil</Label>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2">
          <p className="text-sm font-medium">O módulo inclui:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Plano de contas personalizável (baseado no padrão OAB)</li>
            <li>Lançamentos contábeis com partidas dobradas</li>
            <li>Demonstrativo de Resultado (DRE)</li>
            <li>Importação do plano de contas padrão da OAB</li>
          </ul>
        </div>

        <SaveButton section="escrituracao" onClick={() => save('escrituracao', {
          escrituracao_enabled: escrituracaoEnabled,
        })} />
      </TabsContent>
    </Tabs>
  );
}
