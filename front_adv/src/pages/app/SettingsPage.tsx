import { useEffect, useState } from 'react';
import { Building2, Bell, BellRing, Save, CheckCircle2, Globe, Phone, Mail, FileText, Loader2, CreditCard, Users, FolderOpen, HardDrive } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { maskCEP, maskCNPJ, maskPhoneBR } from '@/lib/masks';
import { useCepLookup } from '@/hooks/useCepLookup';

type TenantDetails = {
  id: string;
  name: string;
  slug: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  address?: Record<string, any> | null;
  settings?: Record<string, any> | null;
};

type OfficeForm = {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  logo_url: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
};

type NotifSettings = {
  deadline_alerts: boolean;
  hearing_alerts: boolean;
  task_alerts: boolean;
  finance_alerts: boolean;
  alert_email: boolean;
  email_deadline_days: string;
  email_hearing_days: string;
  email_recipient: string;
};

const DEFAULT_FORM: OfficeForm = {
  name: '',
  cnpj: '',
  phone: '',
  email: '',
  logo_url: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
};

const DEFAULT_NOTIF: NotifSettings = {
  deadline_alerts: true,
  hearing_alerts: true,
  task_alerts: false,
  finance_alerts: true,
  alert_email: false,
  email_deadline_days: '3',
  email_hearing_days: '1',
  email_recipient: '',
};

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium text-foreground">{title}</p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ToggleRow({ label, description, checked, onCheckedChange }: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SettingsPage() {
  const { activeTenantId, refreshTenants } = useTenant();
  const { roles, isSuperuser } = useAuth();

  const canEdit = isSuperuser || roles.some((r) => ['OWNER', 'ADMIN'].includes(r));

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [form, setForm] = useState<OfficeForm>(DEFAULT_FORM);
  const [notif, setNotif] = useState<NotifSettings>(DEFAULT_NOTIF);

  const cepLookup = useCepLookup();

  const [officeSaved, setOfficeSaved] = useState(false);
  const [officeError, setOfficeError] = useState('');
  const [officeLoading, setOfficeLoading] = useState(false);

  const [notifSaved, setNotifSaved] = useState(false);

  const billingQuery = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.get<any>('/billing/status/'),
    enabled: canEdit,
    retry: false,
  });
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (!activeTenantId) return;
    api.get<TenantDetails>(`/tenants/${activeTenantId}/`).then((data) => {
      setTenant(data);
      const addr = data.address ?? {};
      setForm({
        name: data.name ?? '',
        cnpj: data.cnpj ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        logo_url: data.logo_url ?? '',
        address_street: addr.street ?? addr.logradouro ?? '',
        address_number: addr.number ?? addr.numero ?? '',
        address_complement: addr.complement ?? addr.complemento ?? '',
        address_neighborhood: addr.neighborhood ?? addr.bairro ?? '',
        address_city: addr.city ?? addr.cidade ?? '',
        address_state: addr.state ?? addr.estado ?? '',
        address_zip: addr.zip ?? addr.cep ?? '',
      });
      const s = data.settings ?? {};
      setNotif({
        deadline_alerts: s.deadline_alerts !== false,
        hearing_alerts: s.hearing_alerts !== false,
        task_alerts: s.task_alerts === true,
        finance_alerts: s.finance_alerts !== false,
        alert_email: s.alert_email === true,
        email_deadline_days: String(s.email_deadline_days ?? '3'),
        email_hearing_days: String(s.email_hearing_days ?? '1'),
        email_recipient: s.email_recipient ?? '',
      });
    }).catch(() => {});
  }, [activeTenantId]);

  function setField(field: keyof OfficeForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCepChange(value: string) {
    const masked = maskCEP(value);
    setField('address_zip', masked);
    const filled = await cepLookup.lookup(masked);
    if (filled) {
      setForm((f) => ({
        ...f,
        address_street: filled.street || f.address_street,
        address_complement: filled.complement || f.address_complement,
        address_neighborhood: filled.neighborhood || f.address_neighborhood,
        address_city: filled.city || f.address_city,
        address_state: filled.state || f.address_state,
      }));
    }
  }

  async function saveOffice(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenantId || !canEdit) return;
    setOfficeLoading(true);
    setOfficeError('');
    setOfficeSaved(false);
    try {
      await api.patch(`/tenants/${activeTenantId}/`, {
        name: form.name.trim(),
        cnpj: form.cnpj.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        logo_url: form.logo_url.trim() || null,
        address: {
          street: form.address_street,
          number: form.address_number,
          complement: form.address_complement,
          neighborhood: form.address_neighborhood,
          city: form.address_city,
          state: form.address_state,
          zip: form.address_zip,
        },
      });
      await refreshTenants();
      setOfficeSaved(true);
      setTimeout(() => setOfficeSaved(false), 3000);
    } catch (e: any) {
      setOfficeError(e?.message || 'Erro ao salvar configurações');
    } finally {
      setOfficeLoading(false);
    }
  }

  async function saveNotif() {
    if (!activeTenantId || !canEdit) return;
    setNotifLoading(true);
    setNotifSaved(false);
    try {
      await api.patch(`/tenants/${activeTenantId}/`, {
        settings: {
          ...(tenant?.settings ?? {}),
          deadline_alerts: notif.deadline_alerts,
          hearing_alerts: notif.hearing_alerts,
          task_alerts: notif.task_alerts,
          finance_alerts: notif.finance_alerts,
          alert_email: notif.alert_email,
          email_deadline_days: Number(notif.email_deadline_days),
          email_hearing_days: Number(notif.email_hearing_days),
          email_recipient: notif.email_recipient.trim() || null,
        },
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setNotifLoading(false);
    }
  }

  function toggleNotif(field: keyof NotifSettings, value: boolean) {
    setNotif((n) => ({ ...n, [field]: value }));
  }

  function setNotifField(field: keyof NotifSettings, value: string) {
    setNotif((n) => ({ ...n, [field]: value }));
  }

  const push = usePushNotifications();

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1 className="page-title">Configurações do escritório</h1>
        </div>
      </div>

      {!canEdit && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          Apenas proprietários e administradores podem alterar essas configurações.
        </div>
      )}

      {/* Office data */}
      <Section
        icon={Building2}
        title="Dados do escritório"
        description="Informações que aparecem em documentos, contratos e no portal do cliente"
      >
        <form onSubmit={saveOffice} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="office-name">Nome do escritório *</Label>
              <Input
                id="office-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                disabled={!canEdit}
                placeholder="Dantas & Associados Advocacia"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="office-cnpj">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  CNPJ
                </span>
              </Label>
              <Input
                id="office-cnpj"
                value={form.cnpj}
                onChange={(e) => setField('cnpj', maskCNPJ(e.target.value))}
                disabled={!canEdit}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="office-phone">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </span>
              </Label>
              <Input
                id="office-phone"
                value={form.phone}
                onChange={(e) => setField('phone', maskPhoneBR(e.target.value))}
                disabled={!canEdit}
                placeholder="(11) 3333-4444"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="office-email">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-mail de contato
                </span>
              </Label>
              <Input
                id="office-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                disabled={!canEdit}
                placeholder="contato@escritorio.adv.br"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="office-logo">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  URL do logotipo
                </span>
              </Label>
              <Input
                id="office-logo"
                value={form.logo_url}
                onChange={(e) => setField('logo_url', e.target.value)}
                disabled={!canEdit}
                placeholder="https://..."
              />
            </div>
          </div>

          <Separator />

          <p className="text-sm font-medium text-foreground">Endereço</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Logradouro</Label>
              <Input
                value={form.address_street}
                onChange={(e) => setField('address_street', e.target.value)}
                disabled={!canEdit}
                placeholder="Rua / Av. / Alameda"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input value={form.address_number} onChange={(e) => setField('address_number', e.target.value)} disabled={!canEdit} placeholder="123" />
            </div>
            <div className="space-y-1.5">
              <Label>Complemento</Label>
              <Input value={form.address_complement} onChange={(e) => setField('address_complement', e.target.value)} disabled={!canEdit} placeholder="Conj. 42, andar 5" />
            </div>
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input value={form.address_neighborhood} onChange={(e) => setField('address_neighborhood', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={form.address_city} onChange={(e) => setField('address_city', e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado (UF)</Label>
              <Input value={form.address_state} onChange={(e) => setField('address_state', e.target.value)} disabled={!canEdit} placeholder="SP" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={form.address_zip}
                  onChange={(e) => handleCepChange(e.target.value)}
                  disabled={!canEdit}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {cepLookup.loading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              {cepLookup.error && (
                <p className="text-xs text-destructive">{cepLookup.error}</p>
              )}
            </div>
          </div>

          {officeError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{officeError}</p>
          )}

          {canEdit && (
            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" disabled={officeLoading} className="gap-2">
                <Save className="h-4 w-4" />
                {officeLoading ? 'Salvando...' : 'Salvar dados'}
              </Button>
              {officeSaved && (
                <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Salvo com sucesso
                </span>
              )}
            </div>
          )}
        </form>
      </Section>

      {/* Notification settings */}
      <Section
        icon={Bell}
        title="Preferências de notificação"
        description="Controle quais eventos geram notificações para os membros da equipe"
      >
        <div className="divide-y divide-border">
          <ToggleRow
            label="Alertas de prazos"
            description="Notificações automáticas D-7, D-3, D-1 e D-0 para prazos processuais"
            checked={notif.deadline_alerts}
            onCheckedChange={(v) => toggleNotif('deadline_alerts', v)}
          />
          <ToggleRow
            label="Alertas de audiências"
            description="Notificação ao cadastrar novas audiências"
            checked={notif.hearing_alerts}
            onCheckedChange={(v) => toggleNotif('hearing_alerts', v)}
          />
          <ToggleRow
            label="Alertas de tarefas"
            description="Notificação quando uma tarefa for atribuída ou vencer"
            checked={notif.task_alerts}
            onCheckedChange={(v) => toggleNotif('task_alerts', v)}
          />
          <ToggleRow
            label="Alertas financeiros"
            description="Notificação de cobranças vencidas e pagamentos recebidos"
            checked={notif.finance_alerts}
            onCheckedChange={(v) => toggleNotif('finance_alerts', v)}
          />
          <ToggleRow
            label="Enviar por e-mail"
            description="Enviar cópia dos alertas críticos por e-mail além da notificação interna"
            checked={notif.alert_email}
            onCheckedChange={(v) => toggleNotif('alert_email', v)}
          />
        </div>

        {notif.alert_email && (
          <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configurações de e-mail</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Antecedência — prazos</Label>
                <Select value={notif.email_deadline_days} onValueChange={(v) => setNotifField('email_deadline_days', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                    <SelectItem value="15">15 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Antecedência — audiências</Label>
                <Select value={notif.email_hearing_days} onValueChange={(v) => setNotifField('email_hearing_days', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia antes</SelectItem>
                    <SelectItem value="3">3 dias antes</SelectItem>
                    <SelectItem value="7">7 dias antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">E-mail de destino adicional <span className="text-muted-foreground">(opcional)</span></Label>
              <Input
                type="email"
                value={notif.email_recipient}
                onChange={(e) => setNotifField('email_recipient', e.target.value)}
                placeholder="ex: diretor@escritorio.com.br"
              />
              <p className="text-xs text-muted-foreground">
                Os alertas também serão enviados para este endereço além dos e-mails dos membros da equipe.
              </p>
            </div>
          </div>
        )}

        {/* Push notification opt-in */}
        {push.state !== 'unsupported' && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <BellRing className="h-4 w-4 text-muted-foreground" />
                  Notificações push no navegador
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {push.state === 'granted'
                    ? 'Ativadas — você receberá alertas mesmo com o app fechado.'
                    : push.state === 'denied'
                    ? 'Bloqueadas — habilite nas configurações do navegador.'
                    : 'Receba alertas de prazos e audiências diretamente no navegador.'}
                </p>
              </div>
              {push.state === 'default' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={push.requestPermission}
                  disabled={push.loading}
                  className="shrink-0 gap-2"
                >
                  {push.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                  Ativar
                </Button>
              )}
              {push.state === 'granted' && (
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ativas
                </span>
              )}
            </div>
          </div>
        )}

        {canEdit && (
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            <Button onClick={saveNotif} disabled={notifLoading} variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              {notifLoading ? 'Salvando...' : 'Salvar preferências'}
            </Button>
            {notifSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Preferências salvas
              </span>
            )}
          </div>
        )}
      </Section>

      {/* Subscription & usage */}
      <Section
        icon={CreditCard}
        title="Plano e uso"
        description="Limites de uso e informações do ambiente contratado"
      >
        {billingQuery.data ? (() => {
          const sub = billingQuery.data.subscription ?? {};
          const usage = billingQuery.data.usage ?? {};
          const plan = sub.plan ?? {};
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{plan.name ?? 'Plano atual'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{sub.status ?? 'Ativo'}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Usuários
                  </div>
                  <p className="text-sm font-medium">
                    {usage.users_count ?? '—'}
                    {plan.max_users ? ` / ${plan.max_users}` : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Processos
                  </div>
                  <p className="text-sm font-medium">
                    {usage.processes_count ?? '—'}
                    {plan.max_processes ? ` / ${plan.max_processes}` : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HardDrive className="h-3.5 w-3.5" />
                    Armazenamento
                  </div>
                  <p className="text-sm font-medium">
                    {usage.storage_bytes
                      ? `${(usage.storage_bytes / 1024 / 1024).toFixed(1)} MB`
                      : '0 MB'}
                    {plan.max_storage_gb ? ` / ${plan.max_storage_gb} GB` : ''}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">ID do tenant</p>
                  <p className="font-mono text-xs text-foreground">{activeTenantId ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Slug</p>
                  <p className="font-mono text-xs text-foreground">{tenant?.slug ?? '—'}</p>
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">ID do tenant</p>
              <p className="font-mono text-foreground">{activeTenantId ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Slug</p>
              <p className="font-mono text-foreground">{tenant?.slug ?? '—'}</p>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
