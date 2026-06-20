import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Phone, Award, FileText, Save, CheckCircle2, Bell } from 'lucide-react';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().optional(),
  oab: z.string().optional(),
  bio: z.string().optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha atual'),
    password: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'As senhas não coincidem',
    path: ['confirm_password'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function StatusBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    OWNER: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    LAWYER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    ASSISTANT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    FINANCE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    CLIENT: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  };
  const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    LAWYER: 'Advogado(a)',
    ASSISTANT: 'Assistente',
    FINANCE: 'Financeiro',
    CLIENT: 'Cliente',
  };
  const cls = colors[label] ?? 'bg-muted text-muted-foreground';
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', cls)}>
      {roleLabels[label] ?? label}
    </span>
  );
}

export default function ProfilePage() {
  const { profile, roles, isSuperuser, user, refreshMe } = useAuth();

  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const defaultNotifPrefs = (profile as any)?.notification_prefs || {};
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    email_deadline_alert: defaultNotifPrefs.email_deadline_alert ?? true,
    email_hearing_alert: defaultNotifPrefs.email_hearing_alert ?? true,
    email_process_update: defaultNotifPrefs.email_process_update ?? false,
    inapp_deadline_alert: defaultNotifPrefs.inapp_deadline_alert ?? true,
    inapp_hearing_alert: defaultNotifPrefs.inapp_hearing_alert ?? true,
    inapp_process_update: defaultNotifPrefs.inapp_process_update ?? true,
  });
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  async function onSaveNotifPrefs() {
    setNotifLoading(true);
    setNotifSaved(false);
    try {
      await api.patch('/me/', { notification_prefs: notifPrefs });
      await refreshMe();
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } finally {
      setNotifLoading(false);
    }
  }

  const initials = (profile?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: (profile as any)?.phone || '',
      oab: (profile as any)?.oab || '',
      bio: (profile as any)?.bio || '',
    },
  });

  const {
    register: regPw,
    handleSubmit: handlePw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSaveProfile(data: ProfileForm) {
    setProfileLoading(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      await api.patch('/me/', data);
      await refreshMe();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e: any) {
      setProfileError(e?.message || 'Erro ao salvar perfil');
    } finally {
      setProfileLoading(false);
    }
  }

  async function onChangePassword(data: PasswordForm) {
    setPwLoading(true);
    setPwError('');
    setPwSaved(false);
    try {
      await api.patch('/me/', {
        current_password: data.current_password,
        password: data.password,
      });
      resetPw();
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e: any) {
      setPwError(e?.detail || e?.message || 'Erro ao alterar senha');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1 className="page-title">Meu perfil</h1>
        </div>
      </div>

      {/* Identity card */}
      <div className="mb-8 flex items-center gap-5 rounded-xl border border-border bg-card p-5 shadow-card">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarFallback className="bg-foreground text-xl font-bold text-background">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-foreground">{profile?.full_name || 'Usuário'}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email || ''}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isSuperuser ? (
              <StatusBadge label="ADMIN" />
            ) : (
              roles.slice(0, 3).map((r) => <StatusBadge key={r} label={r} />)
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <section className="mb-8 rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Dados pessoais</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Informações exibidas no sistema para outros membros
          </p>
        </div>

        <form onSubmit={handleProfile(onSaveProfile)} className="space-y-5 px-6 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" {...regProfile('full_name')} placeholder="Seu nome" />
              {profileErrors.full_name && (
                <p className="text-xs text-destructive">{profileErrors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone
                </span>
              </Label>
              <Input id="phone" {...regProfile('phone')} placeholder="(11) 99999-9999" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="oab">
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  OAB
                </span>
              </Label>
              <Input id="oab" {...regProfile('oab')} placeholder="SP 123456" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Bio / Especialidades
              </span>
            </Label>
            <Textarea
              id="bio"
              {...regProfile('bio')}
              rows={3}
              placeholder="Breve descrição sobre suas especialidades e experiência..."
              className="resize-none"
            />
          </div>

          {profileError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {profileError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={profileLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {profileLoading ? 'Salvando...' : 'Salvar perfil'}
            </Button>
            {profileSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Salvo com sucesso
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Password section */}
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Segurança</p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Altere sua senha de acesso ao sistema
          </p>
        </div>

        <form onSubmit={handlePw(onChangePassword)} className="space-y-5 px-6 py-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="current_password">Senha atual</Label>
              <Input
                id="current_password"
                type="password"
                autoComplete="current-password"
                {...regPw('current_password')}
                placeholder="••••••••"
              />
              {pwErrors.current_password && (
                <p className="text-xs text-destructive">{pwErrors.current_password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...regPw('password')}
                placeholder="Mínimo 8 caracteres"
              />
              {pwErrors.password && (
                <p className="text-xs text-destructive">{pwErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmar nova senha</Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                {...regPw('confirm_password')}
                placeholder="Repita a nova senha"
              />
              {pwErrors.confirm_password && (
                <p className="text-xs text-destructive">{pwErrors.confirm_password.message}</p>
              )}
            </div>
          </div>

          {pwError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {pwError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={pwLoading} variant="outline" className="gap-2">
              <Lock className="h-4 w-4" />
              {pwLoading ? 'Alterando...' : 'Alterar senha'}
            </Button>
            {pwSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Senha alterada com sucesso
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Notification preferences */}
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Preferências de notificação</h2>
        </div>

        <div className="divide-y divide-border">
          {/* Email notifications */}
          <div className="px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">E-mail</p>
            <div className="space-y-4">
              {[
                { key: 'email_deadline_alert', label: 'Alertas de prazo', description: 'Receba e-mail quando um prazo estiver próximo do vencimento' },
                { key: 'email_hearing_alert', label: 'Audiências agendadas', description: 'Receba e-mail ao agendar uma nova audiência' },
                { key: 'email_process_update', label: 'Atualizações de processo', description: 'Receba e-mail ao atualizar status ou fase do processo' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[key] ?? false}
                    onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* In-app notifications */}
          <div className="px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">No sistema</p>
            <div className="space-y-4">
              {[
                { key: 'inapp_deadline_alert', label: 'Alertas de prazo', description: 'Notificação no sistema para prazos próximos' },
                { key: 'inapp_hearing_alert', label: 'Audiências agendadas', description: 'Notificação no sistema ao agendar audiência' },
                { key: 'inapp_process_update', label: 'Atualizações de processo', description: 'Notificação no sistema ao atualizar processo' },
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[key] ?? false}
                    onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-6 py-4">
          <Button onClick={onSaveNotifPrefs} disabled={notifLoading} variant="outline" className="gap-2">
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
      </section>
    </div>
  );
}
