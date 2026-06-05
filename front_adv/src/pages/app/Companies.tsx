import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BellRing, Building2, Pencil, Settings2, Users } from "lucide-react";
import { api, apiGetAllPages } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useScopedTenant } from "@/hooks/useScopedTenant";
import { maskCEP, maskCNPJ, maskPhoneBR, maskUF } from "@/lib/masks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { OfficeAdminShell } from "@/components/office-management/OfficeAdminShell";
import {
  DEFAULT_COMPANY_EXTRAS,
  createDefaultOfficeTenantMeta,
  loadOfficeTenantMeta,
  saveOfficeTenantMeta,
  type CompanyExtras,
} from "./office-settings/storage";

type Company = {
  id: string;
  name?: string;
  legal_name?: string;
  slug?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  cep?: string;
  state?: string;
  city?: string;
  address_line1?: string;
  logo_url?: string;
};

type CompanyFormState = {
  name: string;
  legal_name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string;
  cep: string;
  state: string;
  city: string;
  address: string;
  logo_url: string;
  description: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  primaryColor: string;
  secondaryColor: string;
  faviconUrl: string;
  multiUserEnabled: boolean;
  defaultPermissionPolicy: "cargo" | "usuario";
  notificationsEnabled: boolean;
  planName: string;
  userLimit: string;
  admin_email: string;
  admin_password: string;
  admin_full_name: string;
};

const BR_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function listFrom(payload: any): Company[] {
  if (Array.isArray(payload?.companies)) return payload.companies;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

function slugify(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function makeForm(company?: Company | null, extras?: CompanyExtras | null, fallbackEmail?: string | null): CompanyFormState {
  const merged = { ...DEFAULT_COMPANY_EXTRAS, ...(extras || {}) };
  return {
    name: company?.name || "",
    legal_name: company?.legal_name || "",
    slug: company?.slug || "",
    cnpj: company?.cnpj || "",
    email: company?.email || fallbackEmail || "",
    phone: company?.phone || "",
    cep: company?.cep || "",
    state: company?.state || "",
    city: company?.city || "",
    address: company?.address_line1 || "",
    logo_url: company?.logo_url || "",
    description: merged.description,
    timezone: merged.timezone,
    currency: merged.currency,
    language: merged.language,
    dateFormat: merged.dateFormat,
    primaryColor: merged.primaryColor,
    secondaryColor: merged.secondaryColor,
    faviconUrl: merged.faviconUrl,
    multiUserEnabled: merged.multiUserEnabled,
    defaultPermissionPolicy: merged.defaultPermissionPolicy,
    notificationsEnabled: merged.notificationsEnabled,
    planName: merged.planName,
    userLimit: merged.userLimit,
    admin_email: fallbackEmail || "",
    admin_password: "",
    admin_full_name: "",
  };
}

export default function Companies() {
  const { profile, isSuperuser } = useAuth();
  const { effectiveTenantId, selectedTenantId, setSelectedTenantId } = useScopedTenant("company-settings");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CompanyFormState>(() => makeForm(null, DEFAULT_COMPANY_EXTRAS, profile?.email));
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");
  const [extras, setExtras] = useState<CompanyExtras>(DEFAULT_COMPANY_EXTRAS);

  const officeMetaQuery = useQuery({
    queryKey: ["office-tenant-meta", effectiveTenantId],
    enabled: !!effectiveTenantId,
    queryFn: () => loadOfficeTenantMeta(effectiveTenantId),
    retry: false,
  });

  const companiesQuery = useQuery({
    queryKey: ["office-company-settings-list"],
    queryFn: async () => await api.get<any>("/admin/companies/"),
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ["office-company-settings-users", effectiveTenantId],
    queryFn: async () => await api.get<any>("/admin/users/", effectiveTenantId ? { tenant_id: effectiveTenantId } : undefined),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const employeesQuery = useQuery({
    queryKey: ["office-company-settings-employees", effectiveTenantId],
    queryFn: async () => await apiGetAllPages<any>("/employees/"),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const companies = useMemo(() => listFrom(companiesQuery.data), [companiesQuery.data]);
  const currentCompany = useMemo(
    () => companies.find((company) => company.id === effectiveTenantId) || companies[0] || null,
    [companies, effectiveTenantId],
  );

  useEffect(() => {
    setExtras(officeMetaQuery.data?.company || createDefaultOfficeTenantMeta().company);
  }, [officeMetaQuery.data]);

  const metrics = useMemo(() => {
    const users = Array.isArray(usersQuery.data?.users) ? usersQuery.data.users : Array.isArray(usersQuery.data?.results) ? usersQuery.data.results : Array.isArray(usersQuery.data) ? usersQuery.data : [];
    const employees = Array.isArray(employeesQuery.data) ? employeesQuery.data : [];
    return [
      {
        label: "Usuários ativos",
        value: String(users.filter((item: any) => item?.is_active !== false).length),
        helper: "Contas internas habilitadas no tenant.",
        icon: Users,
      },
      {
        label: "Equipe ativa",
        value: String(employees.filter((item: any) => item?.is_active !== false).length),
        helper: "Funcionários operando no escritório.",
        icon: Activity,
      },
      {
        label: "Política de acesso",
        value: extras.defaultPermissionPolicy === "cargo" ? "Por cargo" : "Por usuário",
        helper: "Modelo-padrão de governança do tenant.",
        icon: Settings2,
      },
      {
        label: "Plano e capacidade",
        value: `${users.filter((item: any) => item?.is_active !== false).length}/${extras.userLimit || "0"}`,
        helper: `${extras.planName} · licenças ocupadas.`,
        icon: BellRing,
      },
    ];
  }, [usersQuery.data, employeesQuery.data, extras]);

  const openDialog = () => {
    const nextForm = makeForm(currentCompany, extras, profile?.email);
    setForm(nextForm);
    setLogoPreview(nextForm.logo_url);
    setFaviconPreview(nextForm.faviconUrl);
    setOpen(true);
  };

  const resetDialog = () => {
    setOpen(false);
    const nextForm = makeForm(currentCompany, extras, profile?.email);
    setForm(nextForm);
    setLogoPreview(nextForm.logo_url);
    setFaviconPreview(nextForm.faviconUrl);
  };

  const onImageFileChange = (file: File | null | undefined, setter: (value: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        legal_name: form.legal_name || undefined,
        slug: form.slug || undefined,
        cnpj: form.cnpj || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        cep: form.cep || undefined,
        state: form.state || undefined,
        city: form.city || undefined,
        address_line1: form.address || undefined,
        logo_url: form.logo_url || undefined,
      };

      if (currentCompany?.id) {
        return await api.patch(`/admin/companies/${currentCompany.id}/`, payload);
      }

      return await api.post("/admin/companies/", {
        tenant: payload,
        admin: {
          email: form.admin_email.trim().toLowerCase(),
          password: form.admin_password,
          full_name: form.admin_full_name || form.name || "Administrador",
        },
      });
    },
    onSuccess: async (response: any) => {
      const targetTenantId = String(response?.id || currentCompany?.id || effectiveTenantId || "");
      if (targetTenantId) {
        const nextExtras: CompanyExtras = {
          description: form.description,
          timezone: form.timezone,
          currency: form.currency,
          language: form.language,
          dateFormat: form.dateFormat,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          faviconUrl: form.faviconUrl,
          multiUserEnabled: form.multiUserEnabled,
          defaultPermissionPolicy: form.defaultPermissionPolicy,
          notificationsEnabled: form.notificationsEnabled,
          planName: form.planName,
          userLimit: form.userLimit,
        };
        setExtras(nextExtras);
        await saveOfficeTenantMeta(targetTenantId, {
          ...(officeMetaQuery.data || createDefaultOfficeTenantMeta()),
          company: nextExtras,
        });
      }
      toast({ title: currentCompany ? "Empresa atualizada com sucesso." : "Empresa cadastrada com sucesso." });
      setOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["office-company-settings-list"] }),
        queryClient.invalidateQueries({ queryKey: ["office-tenant-meta", targetTenantId || effectiveTenantId] }),
      ]);
    },
    onError: (error: any) => toast({ title: "Erro ao salvar empresa", description: error?.message, variant: "destructive" }),
  });

  return (
    <OfficeAdminShell
      section="company"
      title="Empresa"
      description="Gerencie dados do escritório, branding, preferências operacionais e regras-padrão do tenant."
      action={{ label: currentCompany ? "Editar empresa" : "Cadastrar empresa", icon: Pencil, onClick: openDialog }}
      metrics={metrics}
      headerAside={isSuperuser ? (
        <div className="space-y-1">
          <Label>Escritório ativo</Label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)}>
            <option value="">{companiesQuery.isLoading ? "Carregando escritórios..." : "Selecione o escritório"}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name || company.legal_name || company.id}</option>)}
          </select>
        </div>
      ) : null}
    >
      <div className="space-y-4">
        <Card className="overflow-hidden">
            <div className="h-28" style={{ background: `linear-gradient(135deg, ${extras.primaryColor}, ${extras.secondaryColor})` }} />
            <CardContent className="space-y-6 p-6">
              <div className="-mt-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex items-end gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border bg-background shadow-sm">
                    {currentCompany?.logo_url ? (
                      <img src={currentCompany.logo_url} alt="Logo do escritório" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">{currentCompany?.name || "Escritório não configurado"}</h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">{extras.description || "Defina apresentação institucional, branding e preferências administrativas do tenant."}</p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={openDialog}>
                  <Pencil className="h-4 w-4" />
                  Ajustar dados
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dados institucionais</CardTitle>
                    <CardDescription>Cadastro principal do escritório.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Razão social:</span> {currentCompany?.legal_name || "-"}</p>
                    <p><span className="text-muted-foreground">CNPJ:</span> {currentCompany?.cnpj || "-"}</p>
                    <p><span className="text-muted-foreground">Slug:</span> {currentCompany?.slug || "-"}</p>
                    <p><span className="text-muted-foreground">Plano:</span> {extras.planName}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Contato e localização</CardTitle>
                    <CardDescription>Canais oficiais do tenant.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">E-mail:</span> {currentCompany?.email || "-"}</p>
                    <p><span className="text-muted-foreground">Telefone:</span> {currentCompany?.phone || "-"}</p>
                    <p><span className="text-muted-foreground">Cidade/UF:</span> {currentCompany?.city || "-"} / {currentCompany?.state || "-"}</p>
                    <p><span className="text-muted-foreground">Endereço:</span> {currentCompany?.address_line1 || "-"}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? resetDialog() : setOpen(true))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{currentCompany ? "Editar empresa" : "Cadastrar empresa"}</DialogTitle>
            <DialogDescription>Atualize dados cadastrais, branding e preferências administrativas do escritório.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados principais</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Nome fantasia</Label>
                    <Input value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value, slug: slugify(event.target.value) }))} required />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Razão social</Label>
                    <Input value={form.legal_name} onChange={(event) => setForm((previous) => ({ ...previous, legal_name: event.target.value }))} />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input value={form.cnpj} onChange={(event) => setForm((previous) => ({ ...previous, cnpj: maskCNPJ(event.target.value) }))} />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(event) => setForm((previous) => ({ ...previous, slug: slugify(event.target.value) }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea rows={4} value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contato e localização</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(event) => setForm((previous) => ({ ...previous, phone: maskPhoneBR(event.target.value) }))} />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input value={form.cep} onChange={(event) => setForm((previous) => ({ ...previous, cep: maskCEP(event.target.value) }))} />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.state} onChange={(event) => setForm((previous) => ({ ...previous, state: maskUF(event.target.value) }))}>
                      <option value="">Selecione</option>
                      {BR_UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input value={form.city} onChange={(event) => setForm((previous) => ({ ...previous, city: event.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Endereço</Label>
                    <Input value={form.address} onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Logo e favicon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onImageFileChange(event.target.files?.[0], (value) => {
                          setLogoPreview(value);
                          setForm((previous) => ({ ...previous, logo_url: value }));
                        })}
                      />
                      <div className="h-24 w-24 overflow-hidden rounded-xl border bg-muted">
                        {(logoPreview || form.logo_url) ? <img src={logoPreview || form.logo_url} alt="Logo" className="h-full w-full object-cover" /> : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Favicon</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onImageFileChange(event.target.files?.[0], (value) => {
                          setFaviconPreview(value);
                          setForm((previous) => ({ ...previous, faviconUrl: value }));
                        })}
                      />
                      <div className="h-20 w-20 overflow-hidden rounded-xl border bg-muted">
                        {(faviconPreview || form.faviconUrl) ? <img src={faviconPreview || form.faviconUrl} alt="Favicon" className="h-full w-full object-cover" /> : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {!currentCompany ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Administrador inicial</CardTitle>
                  <CardDescription>Necessário apenas no primeiro cadastro do tenant.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>E-mail do administrador</Label>
                    <Input type="email" value={form.admin_email} onChange={(event) => setForm((previous) => ({ ...previous, admin_email: event.target.value }))} required />
                  </div>
                  <div>
                    <Label>Senha inicial</Label>
                    <Input type="password" value={form.admin_password} onChange={(event) => setForm((previous) => ({ ...previous, admin_password: event.target.value }))} required />
                  </div>
                  <div>
                    <Label>Nome do administrador</Label>
                    <Input value={form.admin_full_name} onChange={(event) => setForm((previous) => ({ ...previous, admin_full_name: event.target.value }))} required />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar configurações"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </OfficeAdminShell>
  );
}

