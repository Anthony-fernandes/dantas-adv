import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Building2, Loader2, Shield, UserPlus, CheckCircle2,
  Mail, Phone, MapPin, Image as ImageIcon, ChevronRight,
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
  id: string; name: string; legal_name?: string | null; cnpj?: string | null;
  email?: string | null; phone?: string | null; slug?: string | null;
  created_at?: string; [key: string]: any;
};

type AdminUser = {
  id: string; email: string; full_name?: string | null; name?: string | null;
  is_active?: boolean; is_superuser?: boolean;
  roles?: string[] | Record<string, boolean>; permissions?: string[];
};

type ListResponse<T> = T[] | Paginated<T>;

const AVAILABLE_ROLES = ["OWNER", "ADMIN", "LAWYER", "FINANCE", "ASSISTANT", "CLIENT"];

const ROLE_META: Record<string, { label: string; desc: string; color: string }> = {
  OWNER:     { label: "Proprietário",  desc: "Controle total",           color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
  ADMIN:     { label: "Administrador", desc: "Usuários e configurações", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  LAWYER:    { label: "Advogado",      desc: "Processos e documentos",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  FINANCE:   { label: "Financeiro",    desc: "Honorários e contas",      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  ASSISTANT: { label: "Assistente",    desc: "Suporte operacional",      color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  CLIENT:    { label: "Cliente",       desc: "Portal do cliente",        color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

const AVAILABLE_PERMISSIONS = [
  "process.view","process.create","process.update","process.delete",
  "finance.view","finance.create","finance.issue","finance.invoice",
  "client.view","client.create","client.update","client.delete",
  "admin.manage_users","admin.audit","admin.settings",
  "knowledge.view","knowledge.create","portal.view",
];

const PERM_LABELS: Record<string, string> = {
  "process.view":"Ver processos","process.create":"Criar processos","process.update":"Editar processos","process.delete":"Excluir processos",
  "finance.view":"Ver financeiro","finance.create":"Lançar financeiro","finance.issue":"Emitir cobranças","finance.invoice":"Emitir NF",
  "client.view":"Ver clientes","client.create":"Criar clientes","client.update":"Editar clientes","client.delete":"Excluir clientes",
  "admin.manage_users":"Gerenciar usuários","admin.audit":"Ver auditoria","admin.settings":"Configurações",
  "knowledge.view":"Ver conhecimento","knowledge.create":"Criar conhecimento","portal.view":"Acessar portal",
};

const BR_UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function slugify(v: string) {
  return (v||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
}
function parseList<T>(data: ListResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any)?.results)) return (data as any).results;
  if (data && typeof data === "object") {
    const arr = Object.values(data).find((v) => Array.isArray(v));
    if (Array.isArray(arr)) return arr as T[];
  }
  return [];
}
function normalizeRoles(raw: AdminUser["roles"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((r) => String(r).toUpperCase());
  if (typeof raw === "object") return Object.entries(raw).filter(([,v])=>Boolean(v)).map(([k])=>k.toUpperCase());
  return [];
}
function sameItems(a: string[], b: string[]) { return a.length===b.length && a.every((v,i)=>v===b[i]); }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-2">{children}</span>
      <div className="h-px flex-1 bg-border" />
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
    try { const d = await api.get<ListResponse<CompanyListItem>>("/admin/companies/"); setCompanies(parseList(d)); }
    catch (e: any) { toast.error(e?.message || "Erro ao carregar empresas"); }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const d = await api.get<ListResponse<AdminUser>>("/admin/users/"); setUsers(parseList(d)); }
    catch (e: any) { toast.error(e?.message || "Erro ao carregar usuários"); }
    finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { void Promise.all([loadCompanies(), loadUsers()]); }, [loadCompanies, loadUsers]);

  const selectedUser = useMemo(() => users.find((u)=>String(u.id)===String(selectedUserId))??null, [users, selectedUserId]);
  const primaryCompany = useMemo(() => companies[0]??null, [companies]);
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
    setTenantName(String(primaryCompany.name??""));
    setTenantSlug(String(primaryCompany.slug??""));
    setTenantCnpj(String(primaryCompany.cnpj??""));
    setTenantEmail(String(primaryCompany.email??""));
    setTenantPhone(String(primaryCompany.phone??""));
    setTenantLegalName(String(primaryCompany.legal_name??""));
    setTenantLogoUrl(String(primaryCompany.logo_url??""));
    setTenantZipCode(String(primaryCompany.cep??""));
    setTenantState(String(primaryCompany.state??""));
    setTenantCity(String(primaryCompany.city??""));
    setTenantAddress(String(primaryCompany.address_line1??""));
  }, [primaryCompany]);

  useEffect(() => { if (primaryCompany && !userCompanyId) setUserCompanyId(String(primaryCompany.id)); }, [primaryCompany, userCompanyId]);

  const companyCanSave = !!tenantName.trim() && !!tenantCnpj.trim() && !!tenantEmail.trim();
  const userEmployeeCanSave = !userLinkEmployee || (!!userCompanyId && !!userEmployeeCargoId.trim());
  const userCanSave = !!userEmail.trim() && !!userPassword.trim() && !!userFullName.trim() && !!userCompanyId && userEmployeeCanSave;
  const hasCompanies = companies.length > 0;

  const activeTab = useMemo<"company"|"user"|"permissions">(() => {
    if (location.pathname.startsWith("/master/users")) return "user";
    if (location.pathname.startsWith("/master/permissions")) return "permissions";
    return "company";
  }, [location.pathname]);
  const visibleTab = !hasCompanies ? "company" : activeTab;

  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x)=>x!==v) : [...arr, v];

  const onLogoFileChange = (file?: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setTenantLogoUrl(typeof r.result==="string" ? r.result : "");
    r.readAsDataURL(file);
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
      const payload = {
        name: tenantName.trim(), cnpj: tenantCnpj.trim(), email: tenantEmail.trim(),
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
        await api.patch(`/admin/companies/${primaryCompany.id}/`, payload);
        toast.success("Empresa atualizada");
      } else {
        await api.post("/admin/companies/", {
          tenant: payload,
          admin: { email: String(user?.email||tenantEmail).trim().toLowerCase(), full_name: String(profile?.full_name||tenantName||"Administrador").trim() },
        });
        toast.success("Empresa cadastrada com sucesso!");
      }
      await loadCompanies();
    } catch (e: any) { toast.error(e?.message || "Erro ao salvar empresa"); }
    finally { setSavingCompany(false); }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!userCanSave) return;
    setSavingUser(true);
    try {
      const created = await api.post<any>("/admin/users/", {
        email: userEmail.trim().toLowerCase(), password: userPassword,
        full_name: userFullName.trim(), ...(userCompanyId ? { tenant_id: userCompanyId } : {}),
        is_active: true, roles: userRoles,
      });
      if (userLinkEmployee) {
        try {
          await createEmployeeRecord({
            userId: String(created?.id??created?.user?.id??"") || null,
            tenantId: userCompanyId || null, fullName: userFullName.trim(),
            email: userEmail.trim().toLowerCase(), matricula: userEmployeeMatricula.trim()||null,
            cargoId: userEmployeeCargoId.trim()||null, dataAdmissao: userEmployeeDataAdmissao||null,
            salarioAtual: userEmployeeSalario.trim()||null, statusFuncional: userEmployeeStatus||null,
            notes: userEmployeeNotes.trim()||null,
          });
        } catch { toast.warning("Usuário criado, mas vínculo de funcionário falhou. Verifique o cargo."); }
      }
      toast.success("Usuário criado com sucesso");
      resetUserForm(); await loadUsers();
    } catch (e: any) { toast.error(e?.message || "Erro ao cadastrar usuário"); }
    finally { setSavingUser(false); }
  };

  const handleUpdatePermissions = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSavingPermissions(true);
    try {
      await api.put(`/admin/users/${selectedUserId}/`, { roles: permissionRoles, permissions: permissionList, is_active: permissionActive });
      toast.success("Permissões atualizadas");
      await loadUsers();
    } catch (e: any) { toast.error(e?.message || "Erro ao atualizar permissões"); }
    finally { setSavingPermissions(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Banner primeiro acesso */}
      {!hasCompanies && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 dark:border-amber-700/50 dark:bg-amber-950/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">Primeiro acesso — configure o escritório</p>
            <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">
              Nenhuma empresa cadastrada ainda. Preencha os dados abaixo para ativar o sistema completo.
            </p>
          </div>
        </div>
      )}

      <Tabs value={visibleTab} className="space-y-6">

        {/* ── EMPRESA ── */}
        <TabsContent value="company">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            {/* Card header */}
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{hasCompanies ? "Dados da empresa" : "Cadastrar empresa"}</h2>
                <p className="text-sm text-muted-foreground">{hasCompanies ? "Atualize as informações do escritório." : "Informe os dados do escritório para iniciar."}</p>
              </div>
            </div>

            <form onSubmit={handleSaveCompany} className="divide-y divide-border">

              {/* Identidade */}
              <div className="space-y-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Identificação</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      Nome do escritório <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Ex: Dantas Advocacia"
                      value={tenantName}
                      onChange={(e) => { setTenantName(e.target.value); setTenantSlug(slugify(e.target.value)); }}
                      required
                    />
                    {tenantSlug && <p className="text-[11px] text-muted-foreground">slug: <code className="font-mono">{tenantSlug}</code></p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      CNPJ <span className="text-destructive">*</span>
                    </label>
                    <Input placeholder="00.000.000/0000-00" value={tenantCnpj} onChange={(e) => setTenantCnpj(maskCNPJ(e.target.value))} required />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground">Razão social</label>
                    <Input placeholder="Razão social conforme CNPJ" value={tenantLegalName} onChange={(e) => setTenantLegalName(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logo</p>
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center">
                    {tenantLogoUrl
                      ? <img src={tenantLogoUrl} alt="Logo" className="h-full w-full object-cover" />
                      : <Building2 className="h-7 w-7 text-muted-foreground/30" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Imagem da logo</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">PNG ou JPG. Aparece no portal e nos documentos.</p>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      <ImageIcon className="h-3.5 w-3.5" /> Escolher arquivo
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => onLogoFileChange(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contato</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">
                      E-mail <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="contato@escritorio.adv.br" className="pl-9" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="(00) 00000-0000" className="pl-9" value={tenantPhone} onChange={(e) => setTenantPhone(maskPhoneBR(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Endereço</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">CEP</label>
                    <Input placeholder="00000-000" value={tenantZipCode} onChange={(e) => setTenantZipCode(maskCEP(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Estado</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={maskUF(tenantState)} onChange={(e) => setTenantState(maskUF(e.target.value))}
                    >
                      <option value="">UF</option>
                      {BR_UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Cidade</label>
                    <Input placeholder="São Paulo" value={tenantCity} onChange={(e) => setTenantCity(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="block text-sm font-medium text-foreground">Logradouro</label>
                    <Input placeholder="Rua, número, complemento, bairro" value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {companyCanSave
                    ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Pronto para salvar</>
                    : <><AlertCircle className="h-4 w-4" /> Preencha nome, CNPJ e e-mail</>
                  }
                </div>
                <Button type="submit" disabled={!companyCanSave || savingCompany}>
                  {savingCompany ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : hasCompanies ? "Salvar alterações" : "Cadastrar empresa"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* ── USUÁRIO ── */}
        <TabsContent value="user">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Criar usuário</h2>
                <p className="text-sm text-muted-foreground">Cadastre membros da equipe e defina seus acessos.</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="divide-y divide-border">
              <div className="space-y-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados de acesso</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Nome completo <span className="text-destructive">*</span></label>
                    <Input placeholder="Dr. João da Silva" value={userFullName} onChange={(e) => setUserFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">E-mail <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="joao@escritorio.adv.br" className="pl-9" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Senha <span className="text-destructive">*</span></label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type={showPassword?"text":"password"} placeholder="Mínimo 8 caracteres" className="pl-9 pr-10" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(p=>!p)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Empresa <span className="text-destructive">*</span></label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={userCompanyId} onChange={(e) => setUserCompanyId(e.target.value)}>
                      <option value="">Selecione</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Perfil de acesso</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {AVAILABLE_ROLES.map((role) => {
                    const m = ROLE_META[role];
                    const on = userRoles.includes(role);
                    return (
                      <label key={role} className={cn("flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 transition-all", on ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                        <div className="flex items-start justify-between gap-1">
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", m.color)}>{m.label}</span>
                          <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-violet-600" checked={on} onChange={() => setUserRoles((p) => toggle(p, role))} />
                        </div>
                        <p className="text-[11px] leading-tight text-muted-foreground">{m.desc}</p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Vínculo de funcionário</p>
                    <p className="mt-1 text-sm text-muted-foreground">Cria um registro de RH vinculado a este usuário.</p>
                  </div>
                  <Switch checked={userLinkEmployee} onCheckedChange={setUserLinkEmployee} />
                </div>
                {userLinkEmployee && (
                  <div className="grid gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Matrícula</label>
                      <Input placeholder="000001" value={userEmployeeMatricula} onChange={(e) => setUserEmployeeMatricula(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Status funcional</label>
                      <Input placeholder="ATIVO" value={userEmployeeStatus} onChange={(e) => setUserEmployeeStatus(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">ID do cargo <span className="text-destructive">*</span></label>
                      <Input placeholder="UUID do cargo" value={userEmployeeCargoId} onChange={(e) => setUserEmployeeCargoId(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Data de admissão</label>
                      <Input type="date" value={userEmployeeDataAdmissao} onChange={(e) => setUserEmployeeDataAdmissao(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Salário atual</label>
                      <Input placeholder="R$ 0,00" value={userEmployeeSalario} onChange={(e) => setUserEmployeeSalario(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-foreground">Observação</label>
                      <Input placeholder="Opcional" value={userEmployeeNotes} onChange={(e) => setUserEmployeeNotes(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end px-6 py-4">
                <Button type="submit" disabled={!userCanSave || savingUser}>
                  {savingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : <><UserPlus className="mr-2 h-4 w-4" />Criar usuário</>}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* ── PERMISSÕES ── */}
        <TabsContent value="permissions">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center gap-3 border-b border-border px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Permissões</h2>
                <p className="text-sm text-muted-foreground">Ajuste perfis e acessos individuais de cada usuário.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePermissions} className="divide-y divide-border">
              <div className="space-y-3 px-6 py-6">
                <label className="block text-sm font-medium text-foreground">Selecionar usuário</label>
                {loadingUsers
                  ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando...</div>
                  : (
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                      <option value="">Selecione um usuário</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.full_name||u.name||u.email} — {u.email}</option>)}
                    </select>
                  )
                }
              </div>

              {selectedUserId && (
                <>
                  <div className="space-y-4 px-6 py-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Perfis</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {AVAILABLE_ROLES.map((role) => {
                        const m = ROLE_META[role];
                        const on = permissionRoles.includes(role);
                        return (
                          <label key={role} className={cn("flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 transition-all", on ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                            <div className="flex items-start justify-between gap-1">
                              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", m.color)}>{m.label}</span>
                              <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-violet-600" checked={on} onChange={() => setPermissionRoles((p) => toggle(p, role))} />
                            </div>
                            <p className="text-[11px] leading-tight text-muted-foreground">{m.desc}</p>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 px-6 py-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Permissões individuais</p>
                    <p className="text-sm text-muted-foreground">Marcadas em cinza = herdadas pelo perfil (não editáveis). Use para conceder acesso extra.</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const inherited = inheritedPermissionSet.has(perm);
                        const checked = inherited || permissionList.includes(perm);
                        return (
                          <label key={perm} className={cn("flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors", inherited ? "border-border/50 bg-muted/30 cursor-not-allowed opacity-60" : "border-border cursor-pointer hover:bg-muted/40")}>
                            <input type="checkbox" className="h-3.5 w-3.5 shrink-0 accent-violet-600" checked={checked} disabled={inherited} onChange={() => setPermissionList((p) => toggle(p, perm))} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{PERM_LABELS[perm]??perm}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{perm}</p>
                            </div>
                            {inherited && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">herdado</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-6 py-5">
                    <div>
                      <p className="text-sm font-medium text-foreground">Usuário ativo</p>
                      <p className="text-sm text-muted-foreground">Desativar bloqueia o acesso sem excluir a conta.</p>
                    </div>
                    <Switch checked={permissionActive} onCheckedChange={setPermissionActive} />
                  </div>

                  <div className="flex justify-end px-6 py-4">
                    <Button type="submit" disabled={!selectedUserId || savingPermissions}>
                      {savingPermissions ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Salvar permissões</>}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
