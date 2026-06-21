import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Building2, Loader2, Shield, UserPlus, CheckCircle2,
  Mail, Phone, MapPin, FileText, Image, ChevronRight,
  Users, Lock, Eye, EyeOff, AlertCircle, BadgeCheck,
} from "lucide-react";
import { api, Paginated } from "@/integrations/api/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createEmployeeRecord } from "@/services/employeeService";
import { maskCEP, maskCNPJ, maskPhoneBR, maskUF } from "@/lib/masks";
import { useAuth } from "@/contexts/AuthContext";
import { getInheritedPermissionsForRoles, stripInheritedPermissions } from "@/lib/accessControl";
import { cn } from "@/lib/utils";

type CompanyListItem = {
  id: string;
  name: string;
  legal_name?: string | null;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  slug?: string | null;
  created_at?: string;
  [key: string]: any;
};

type AdminUser = {
  id: string;
  email: string;
  full_name?: string | null;
  name?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
  roles?: string[] | Record<string, boolean>;
  permissions?: string[];
};

type ListResponse<T> = T[] | Paginated<T>;

const AVAILABLE_ROLES = ["OWNER", "ADMIN", "LAWYER", "FINANCE", "ASSISTANT", "CLIENT"];

const ROLE_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  OWNER: { label: "Proprietário", desc: "Controle total do sistema", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300" },
  ADMIN: { label: "Administrador", desc: "Gestão de usuários e config.", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  LAWYER: { label: "Advogado", desc: "Processos, audiências e docs", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  FINANCE: { label: "Financeiro", desc: "Honorários e contas", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  ASSISTANT: { label: "Assistente", desc: "Suporte operacional", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
  CLIENT: { label: "Cliente", desc: "Acesso ao portal do cliente", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
};

const AVAILABLE_PERMISSIONS = [
  "process.view", "process.create", "process.update", "process.delete",
  "finance.view", "finance.create", "finance.issue", "finance.invoice",
  "client.view", "client.create", "client.update", "client.delete",
  "admin.manage_users", "admin.audit", "admin.settings",
  "knowledge.view", "knowledge.create", "portal.view",
];

const PERM_LABELS: Record<string, string> = {
  "process.view": "Ver processos", "process.create": "Criar processos",
  "process.update": "Editar processos", "process.delete": "Excluir processos",
  "finance.view": "Ver financeiro", "finance.create": "Lançar financeiro",
  "finance.issue": "Emitir cobranças", "finance.invoice": "Emitir NF",
  "client.view": "Ver clientes", "client.create": "Criar clientes",
  "client.update": "Editar clientes", "client.delete": "Excluir clientes",
  "admin.manage_users": "Gerenciar usuários", "admin.audit": "Ver auditoria",
  "admin.settings": "Configurações", "knowledge.view": "Ver conhecimento",
  "knowledge.create": "Criar conhecimento", "portal.view": "Acessar portal",
};

const BR_UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function slugify(value: string) {
  return (value || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-");
}

function parseList<T>(data: ListResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (data && typeof data === "object") {
    const firstArray = Object.values(data).find((v) => Array.isArray(v));
    if (Array.isArray(firstArray)) return firstArray as T[];
  }
  return [];
}

function normalizeRoles(raw: AdminUser["roles"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((r) => String(r).toUpperCase());
  if (typeof raw === "object") {
    return Object.entries(raw).filter(([, enabled]) => Boolean(enabled)).map(([name]) => String(name).toUpperCase());
  }
  return [];
}

function sameItems(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function FieldGroup({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function CompaniesAdmin() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [tenantName, setTenantName] = useState("");
  const [tenantCnpj, setTenantCnpj] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantLegalName, setTenantLegalName] = useState("");
  const [tenantLogoUrl, setTenantLogoUrl] = useState("");
  const [tenantZipCode, setTenantZipCode] = useState("");
  const [tenantState, setTenantState] = useState("");
  const [tenantCity, setTenantCity] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [userCompanyId, setUserCompanyId] = useState("");
  const [userRoles, setUserRoles] = useState<string[]>(["ADMIN"]);
  const [userLinkEmployee, setUserLinkEmployee] = useState(true);
  const [userEmployeeMatricula, setUserEmployeeMatricula] = useState("");
  const [userEmployeeCargoId, setUserEmployeeCargoId] = useState("");
  const [userEmployeeDataAdmissao, setUserEmployeeDataAdmissao] = useState("");
  const [userEmployeeSalario, setUserEmployeeSalario] = useState("");
  const [userEmployeeStatus, setUserEmployeeStatus] = useState("ATIVO");
  const [userEmployeeNotes, setUserEmployeeNotes] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [permissionRoles, setPermissionRoles] = useState<string[]>([]);
  const [permissionList, setPermissionList] = useState<string[]>([]);
  const [permissionActive, setPermissionActive] = useState(true);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await api.get<ListResponse<CompanyListItem>>("/admin/companies/");
      setCompanies(parseList(data));
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar empresas");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await api.get<ListResponse<AdminUser>>("/admin/users/");
      setUsers(parseList(data));
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { void Promise.all([loadCompanies(), loadUsers()]); }, [loadCompanies, loadUsers]);

  const selectedUser = useMemo(() => users.find((u) => String(u.id) === String(selectedUserId)) ?? null, [users, selectedUserId]);
  const primaryCompany = useMemo(() => companies[0] ?? null, [companies]);
  const inheritedPermissionList = useMemo(() => getInheritedPermissionsForRoles(permissionRoles, AVAILABLE_PERMISSIONS), [permissionRoles]);
  const inheritedPermissionSet = useMemo(() => new Set(inheritedPermissionList), [inheritedPermissionList]);

  useEffect(() => {
    if (!selectedUser) return;
    setPermissionRoles(normalizeRoles(selectedUser.roles));
    setPermissionList(Array.isArray(selectedUser.permissions) ? selectedUser.permissions : []);
    setPermissionActive(selectedUser.is_active ?? true);
  }, [selectedUser]);

  useEffect(() => {
    setPermissionList((prev) => {
      const next = stripInheritedPermissions(prev, getInheritedPermissionsForRoles(permissionRoles, AVAILABLE_PERMISSIONS));
      return sameItems(prev, next) ? prev : next;
    });
  }, [permissionRoles]);

  useEffect(() => {
    if (!primaryCompany) return;
    setTenantName(String(primaryCompany.name ?? ""));
    setTenantSlug(String(primaryCompany.slug ?? ""));
    setTenantCnpj(String(primaryCompany.cnpj ?? ""));
    setTenantEmail(String(primaryCompany.email ?? ""));
    setTenantPhone(String(primaryCompany.phone ?? ""));
    setTenantLegalName(String(primaryCompany.legal_name ?? ""));
    setTenantLogoUrl(String(primaryCompany.logo_url ?? ""));
    setTenantZipCode(String(primaryCompany.cep ?? ""));
    setTenantState(String(primaryCompany.state ?? ""));
    setTenantCity(String(primaryCompany.city ?? ""));
    setTenantAddress(String(primaryCompany.address_line1 ?? ""));
  }, [primaryCompany]);

  useEffect(() => {
    if (!primaryCompany) return;
    if (!userCompanyId) setUserCompanyId(String(primaryCompany.id));
  }, [primaryCompany, userCompanyId]);

  const companyCanSave = !!tenantName.trim() && !!tenantCnpj.trim() && !!tenantEmail.trim();
  const userEmployeeCanSave = !userLinkEmployee || (!!userCompanyId && !!userEmployeeCargoId.trim());
  const userCanSave = !!userEmail.trim() && !!userPassword.trim() && !!userFullName.trim() && !!userCompanyId && userEmployeeCanSave;
  const permissionsCanSave = !!selectedUserId;
  const hasCompanies = companies.length > 0;

  const activeTab = useMemo<"company" | "user" | "permissions">(() => {
    if (location.pathname.startsWith("/master/users")) return "user";
    if (location.pathname.startsWith("/master/permissions")) return "permissions";
    return "company";
  }, [location.pathname]);
  const visibleTab: "company" | "user" | "permissions" = !hasCompanies ? "company" : activeTab;

  const toggleItem = (values: string[], value: string) =>
    values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

  const onLogoFileChange = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setTenantLogoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const resetUserForm = () => {
    setUserEmail(""); setUserPassword(""); setUserFullName(""); setUserCompanyId("");
    setUserRoles(["ADMIN"]); setUserLinkEmployee(true); setUserEmployeeMatricula("");
    setUserEmployeeCargoId(""); setUserEmployeeDataAdmissao(""); setUserEmployeeSalario("");
    setUserEmployeeStatus("ATIVO"); setUserEmployeeNotes("");
  };

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyCanSave) return;
    setSavingCompany(true);
    try {
      const tenantPayload = {
        name: tenantName.trim(),
        cnpj: tenantCnpj.trim(),
        email: tenantEmail.trim(),
        ...(tenantPhone.trim() ? { phone: tenantPhone.trim() } : {}),
        ...(tenantSlug.trim() ? { slug: tenantSlug.trim() } : {}),
        ...(tenantLegalName.trim() ? { legal_name: tenantLegalName.trim() } : {}),
        ...(tenantLogoUrl.trim() ? { logo_url: tenantLogoUrl.trim() } : {}),
        ...(tenantZipCode.trim() ? { cep: tenantZipCode.trim() } : {}),
        ...(tenantState.trim() ? { state: tenantState.trim() } : {}),
        ...(tenantCity.trim() ? { city: tenantCity.trim() } : {}),
        ...(tenantAddress.trim() ? { address_line1: tenantAddress.trim() } : {}),
      };
      if (primaryCompany?.id) {
        await api.patch(`/admin/companies/${primaryCompany.id}/`, tenantPayload);
        toast.success("Empresa atualizada com sucesso");
      } else {
        const adminEmail = String(user?.email || tenantEmail || "").trim().toLowerCase();
        const adminFullName = String(profile?.full_name || tenantName || "Administrador").trim();
        await api.post("/admin/companies/", { tenant: tenantPayload, admin: { email: adminEmail, full_name: adminFullName } });
        toast.success("Empresa cadastrada com sucesso! Acesse o painel interno.");
      }
      await loadCompanies();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar empresa");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!userCanSave) return;
    setSavingUser(true);
    try {
      const payload = {
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        full_name: userFullName.trim(),
        ...(userCompanyId ? { tenant_id: userCompanyId } : {}),
        is_active: true,
        roles: userRoles,
      };
      const createdUser = await api.post<any>("/admin/users/", payload);
      const createdUserId = String(createdUser?.id ?? createdUser?.user?.id ?? "");
      if (userLinkEmployee) {
        try {
          await createEmployeeRecord({
            userId: createdUserId || null,
            tenantId: userCompanyId || null,
            fullName: userFullName.trim(),
            email: userEmail.trim().toLowerCase(),
            matricula: userEmployeeMatricula.trim() || null,
            cargoId: userEmployeeCargoId.trim() || null,
            dataAdmissao: userEmployeeDataAdmissao || null,
            salarioAtual: userEmployeeSalario.trim() || null,
            statusFuncional: userEmployeeStatus || null,
            notes: userEmployeeNotes.trim() || null,
          });
        } catch {
          toast.warning("Usuário criado, mas o vínculo de funcionário falhou. Verifique o cargo.");
        }
      }
      toast.success("Usuário criado com sucesso");
      resetUserForm();
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao cadastrar usuário");
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdatePermissions = async (e: FormEvent) => {
    e.preventDefault();
    if (!permissionsCanSave) return;
    setSavingPermissions(true);
    try {
      await api.put(`/admin/users/${selectedUserId}/`, { roles: permissionRoles, permissions: permissionList, is_active: permissionActive });
      toast.success("Permissões atualizadas com sucesso");
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar permissões");
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        {!hasCompanies && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800/40 dark:bg-amber-900/10">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Primeiro acesso — configure o escritório</p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                Nenhuma empresa cadastrada. Preencha os dados abaixo para ativar o sistema completo.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {hasCompanies ? "Configuração da empresa" : "Cadastrar empresa"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasCompanies ? "Gerencie dados, usuários e permissões do escritório." : "Informe os dados do escritório para iniciar."}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={visibleTab} className="space-y-6">

        {/* ─── ABA EMPRESA ─── */}
        <TabsContent value="company">
          <form onSubmit={handleSaveCompany} className="space-y-5">

            <FieldGroup title="Identidade do escritório" icon={Building2}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nome do escritório <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ex: Dantas Advocacia"
                    value={tenantName}
                    onChange={(e) => { setTenantName(e.target.value); setTenantSlug(slugify(e.target.value)); }}
                    required
                  />
                  {tenantSlug && <p className="text-[11px] text-muted-foreground">Slug: <span className="font-mono">{tenantSlug}</span></p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">CNPJ <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={tenantCnpj}
                    onChange={(e) => setTenantCnpj(maskCNPJ(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium">Razão social</Label>
                  <Input
                    placeholder="Razão social completa conforme CNPJ"
                    value={tenantLegalName}
                    onChange={(e) => setTenantLegalName(e.target.value)}
                  />
                </div>
              </div>
            </FieldGroup>

            <FieldGroup title="Logo" icon={Image}>
              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center">
                  {tenantLogoUrl
                    ? <img src={tenantLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                    : <Building2 className="h-8 w-8 text-muted-foreground/40" />
                  }
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground">Imagem da logo</p>
                  <p className="text-sm text-muted-foreground">PNG ou JPG recomendado. Aparece no portal, contratos e cabeçalhos.</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    <Image className="h-4 w-4" />
                    Escolher arquivo
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => onLogoFileChange(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </FieldGroup>

            <FieldGroup title="Contato" icon={Mail}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">E-mail do escritório <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="contato@escritorio.adv.br"
                      className="pl-9"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="(00) 00000-0000"
                      className="pl-9"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(maskPhoneBR(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </FieldGroup>

            <FieldGroup title="Endereço" icon={MapPin}>
              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">CEP</Label>
                  <Input placeholder="00000-000" value={tenantZipCode} onChange={(e) => setTenantZipCode(maskCEP(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Estado</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={maskUF(tenantState)}
                    onChange={(e) => setTenantState(maskUF(e.target.value))}
                  >
                    <option value="">Selecione</option>
                    {BR_UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Cidade</Label>
                  <Input placeholder="São Paulo" value={tenantCity} onChange={(e) => setTenantCity(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label className="text-sm font-medium">Endereço completo</Label>
                  <Input placeholder="Rua, número, complemento, bairro" value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)} />
                </div>
              </div>
            </FieldGroup>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
              <div className="flex items-center gap-3">
                {companyCanSave
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <AlertCircle className="h-5 w-5 text-muted-foreground/40" />
                }
                <p className="text-sm text-muted-foreground">
                  {companyCanSave ? "Campos obrigatórios preenchidos. Pronto para salvar." : "Preencha nome, CNPJ e e-mail para continuar."}
                </p>
              </div>
              <Button type="submit" disabled={!companyCanSave || savingCompany} className="min-w-[160px]">
                {savingCompany
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                  : <>{hasCompanies ? "Salvar alterações" : "Cadastrar empresa"}<ChevronRight className="ml-1.5 h-4 w-4" /></>
                }
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ─── ABA USUÁRIO ─── */}
        <TabsContent value="user">
          <form onSubmit={handleCreateUser} className="space-y-5">
            <FieldGroup title="Dados de acesso" icon={Lock}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nome completo <span className="text-destructive">*</span></Label>
                  <Input placeholder="Dr. João da Silva" value={userFullName} onChange={(e) => setUserFullName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">E-mail <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="joao@escritorio.adv.br" className="pl-9" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      className="pl-9 pr-10"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Empresa <span className="text-destructive">*</span></Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={userCompanyId}
                    onChange={(e) => setUserCompanyId(e.target.value)}
                  >
                    <option value="">Selecione a empresa</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </FieldGroup>

            <FieldGroup title="Perfis de acesso" icon={Shield}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AVAILABLE_ROLES.map((role) => {
                  const meta = ROLE_LABELS[role];
                  const active = userRoles.includes(role);
                  return (
                    <label
                      key={role}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3.5 transition-all",
                        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-[10px] font-semibold", meta.color)}>{meta.label}</Badge>
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-violet-600"
                          checked={active}
                          onChange={() => setUserRoles((prev) => toggleItem(prev, role))}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
                    </label>
                  );
                })}
              </div>
            </FieldGroup>

            <FieldGroup title="Vínculo de funcionário" icon={Users}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Criar registro de funcionário</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Vincula automaticamente o usuário a um registro de RH no sistema.</p>
                </div>
                <Switch checked={userLinkEmployee} onCheckedChange={setUserLinkEmployee} />
              </div>

              {userLinkEmployee && (
                <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Matrícula</Label>
                    <Input placeholder="000001" value={userEmployeeMatricula} onChange={(e) => setUserEmployeeMatricula(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Status funcional</Label>
                    <Input placeholder="ATIVO" value={userEmployeeStatus} onChange={(e) => setUserEmployeeStatus(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">ID do cargo <span className="text-destructive">*</span></Label>
                    <Input placeholder="UUID do cargo" value={userEmployeeCargoId} onChange={(e) => setUserEmployeeCargoId(e.target.value)} required={userLinkEmployee} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Data de admissão</Label>
                    <Input type="date" value={userEmployeeDataAdmissao} onChange={(e) => setUserEmployeeDataAdmissao(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Salário atual</Label>
                    <Input placeholder="R$ 0,00" value={userEmployeeSalario} onChange={(e) => setUserEmployeeSalario(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Observação</Label>
                    <Input placeholder="Opcional" value={userEmployeeNotes} onChange={(e) => setUserEmployeeNotes(e.target.value)} />
                  </div>
                </div>
              )}
            </FieldGroup>

            <div className="flex justify-end">
              <Button type="submit" disabled={!userCanSave || savingUser} className="min-w-[160px]">
                {savingUser
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>
                  : <><UserPlus className="mr-2 h-4 w-4" />Criar usuário</>
                }
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ─── ABA PERMISSÕES ─── */}
        <TabsContent value="permissions">
          <form onSubmit={handleUpdatePermissions} className="space-y-5">
            <FieldGroup title="Selecionar usuário" icon={Users}>
              {loadingUsers
                ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando usuários...</div>
                : (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {(u.full_name || u.name || u.email)} — {u.email}
                      </option>
                    ))}
                  </select>
                )
              }
            </FieldGroup>

            {selectedUserId && (
              <>
                <FieldGroup title="Perfis de acesso" icon={Shield}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {AVAILABLE_ROLES.map((role) => {
                      const meta = ROLE_LABELS[role];
                      const active = permissionRoles.includes(role);
                      return (
                        <label
                          key={role}
                          className={cn(
                            "flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-3.5 transition-all",
                            active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <Badge className={cn("text-[10px] font-semibold", meta.color)}>{meta.label}</Badge>
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 accent-violet-600"
                              checked={active}
                              onChange={() => setPermissionRoles((prev) => toggleItem(prev, role))}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
                        </label>
                      );
                    })}
                  </div>
                </FieldGroup>

                <FieldGroup title="Permissões individuais" icon={BadgeCheck}>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Permissões herdadas pelos perfis ficam marcadas automaticamente (não editáveis). Use esta seção apenas para conceder acesso extra.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const inherited = inheritedPermissionSet.has(perm);
                      const checked = inherited || permissionList.includes(perm);
                      return (
                        <label
                          key={perm}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition-colors",
                            inherited ? "border-border/50 bg-muted/40 opacity-70 cursor-not-allowed" : "border-border cursor-pointer hover:bg-muted/50"
                          )}
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 accent-violet-600"
                            checked={checked}
                            disabled={inherited}
                            onChange={() => setPermissionList((prev) => toggleItem(prev, perm))}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">{PERM_LABELS[perm] ?? perm}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{perm}</p>
                          </div>
                          {inherited && <Badge variant="outline" className="text-[9px]">herdado</Badge>}
                        </label>
                      );
                    })}
                  </div>
                </FieldGroup>

                <FieldGroup title="Status do usuário" icon={Shield}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Usuário ativo</p>
                      <p className="text-sm text-muted-foreground">Desativar impede o acesso ao sistema sem excluir a conta.</p>
                    </div>
                    <Switch checked={permissionActive} onCheckedChange={setPermissionActive} />
                  </div>
                </FieldGroup>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!permissionsCanSave || savingPermissions} className="min-w-[160px]">
                    {savingPermissions
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                      : <><CheckCircle2 className="mr-2 h-4 w-4" />Salvar permissões</>
                    }
                  </Button>
                </div>
              </>
            )}
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
