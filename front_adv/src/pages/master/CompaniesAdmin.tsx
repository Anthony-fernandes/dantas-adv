import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2, Loader2, Shield, UserPlus, CheckCircle2, Mail, Phone,
  MapPin, Image as ImgIcon, ChevronRight, Users, Lock, Eye, EyeOff,
  AlertCircle, Globe, Hash, Briefcase,
} from "lucide-react";
import { api, Paginated } from "@/integrations/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createEmployeeRecord } from "@/services/employeeService";
import { maskCEP, maskCNPJ, maskPhoneBR, maskUF } from "@/lib/masks";
import { useAuth } from "@/contexts/AuthContext";
import { getInheritedPermissionsForRoles, stripInheritedPermissions } from "@/lib/accessControl";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
type Company = {
  id: string; name: string; legal_name?: string | null; cnpj?: string | null;
  email?: string | null; phone?: string | null; slug?: string | null;
  website?: string | null; oab?: string | null; description?: string | null;
  logo_url?: string | null; cep?: string | null; state?: string | null;
  city?: string | null; address_line1?: string | null; [key: string]: any;
};
type User = {
  id: string; email: string; full_name?: string | null; name?: string | null;
  is_active?: boolean; roles?: string[] | Record<string, boolean>; permissions?: string[];
};
type ListResponse<T> = T[] | Paginated<T>;

const ROLES = ["OWNER", "ADMIN", "LAWYER", "FINANCE", "ASSISTANT", "CLIENT"] as const;
const ROLE_META: Record<string, { label: string; desc: string; chip: string }> = {
  OWNER:     { label: "Proprietário",  desc: "Controle total",          chip: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  ADMIN:     { label: "Administrador", desc: "Usuários e config.",       chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  LAWYER:    { label: "Advogado",      desc: "Processos e docs",         chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  FINANCE:   { label: "Financeiro",    desc: "Honorários e contas",      chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  ASSISTANT: { label: "Assistente",    desc: "Suporte operacional",      chip: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  CLIENT:    { label: "Cliente",       desc: "Portal do cliente",        chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};
const ALL_PERMS = [
  "process.view","process.create","process.update","process.delete",
  "finance.view","finance.create","finance.issue","finance.invoice",
  "client.view","client.create","client.update","client.delete",
  "admin.manage_users","admin.audit","admin.settings",
  "knowledge.view","knowledge.create","portal.view",
];
const PERM_LABEL: Record<string, string> = {
  "process.view":"Ver processos","process.create":"Criar processos","process.update":"Editar processos","process.delete":"Excluir processos",
  "finance.view":"Ver financeiro","finance.create":"Lançar financeiro","finance.issue":"Emitir cobranças","finance.invoice":"Emitir NF",
  "client.view":"Ver clientes","client.create":"Criar clientes","client.update":"Editar clientes","client.delete":"Excluir clientes",
  "admin.manage_users":"Gerenciar usuários","admin.audit":"Ver auditoria","admin.settings":"Configurações",
  "knowledge.view":"Ver conhecimento","knowledge.create":"Criar conhecimento","portal.view":"Acessar portal",
};
const BR_UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function slugify(v: string) {
  return (v || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
    .replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
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
function normalizeRoles(raw: User["roles"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((r) => String(r).toUpperCase());
  if (typeof raw === "object") return Object.entries(raw).filter(([, v]) => Boolean(v)).map(([k]) => k.toUpperCase());
  return [];
}
function sameItems(a: string[], b: string[]) { return a.length === b.length && a.every((v, i) => v === b[i]); }
function toggle(arr: string[], v: string) { return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]; }

/* ─── UI atoms ─── */
function FLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
      {children}{required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function IconInput({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-foreground" />
      {children}
    </div>
  );
}

function RoleCard({ role, checked, onChange }: { role: string; checked: boolean; onChange: () => void }) {
  const m = ROLE_META[role];
  return (
    <label className={cn(
      "flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition-all",
      checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
    )}>
      <div className="flex items-center justify-between">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", m.chip)}>{m.label}</span>
        <input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={checked} onChange={onChange} />
      </div>
      <p className="text-[11px] leading-tight text-muted-foreground">{m.desc}</p>
    </label>
  );
}

type TabKey = "company" | "admin-user" | "users" | "permissions";

export default function CompaniesAdmin() {
  const { user: authUser, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) || "company";
  const setTab = (key: TabKey) => setSearchParams({ tab: key }, { replace: true });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* Company */
  const [cName, setCName] = useState(""); const [cCnpj, setCCnpj] = useState("");
  const [cEmail, setCEmail] = useState(""); const [cPhone, setCPhone] = useState("");
  const [cSlug, setCSlug] = useState(""); const [cLegal, setCLegal] = useState("");
  const [cOab, setCOab] = useState(""); const [cWebsite, setCWebsite] = useState("");
  const [cDesc, setCDesc] = useState(""); const [cLogo, setCLogo] = useState("");
  const [cZip, setCZip] = useState(""); const [cState, setCState] = useState("");
  const [cCity, setCCity] = useState(""); const [cAddr, setCAddr] = useState("");

  /* Admin user */
  const [aName, setAName] = useState(""); const [aEmail, setAEmail] = useState("");
  const [aPwd, setAPwd] = useState(""); const [aPhone, setAPhone] = useState("");
  const [aOab, setAOab] = useState(""); const [aRoles, setARoles] = useState<string[]>(["OWNER", "ADMIN"]);

  /* New user */
  const [uName, setUName] = useState(""); const [uEmail, setUEmail] = useState("");
  const [uPwd, setUPwd] = useState(""); const [uCompany, setUCompany] = useState("");
  const [uRoles, setURoles] = useState<string[]>(["LAWYER"]); const [uLinkEmp, setULinkEmp] = useState(false);
  const [uMatricula, setUMatricula] = useState(""); const [uCargo, setUCargo] = useState("");
  const [uAdmissao, setUAdmissao] = useState(""); const [uSalario, setUSalario] = useState("");

  /* Permissions */
  const [selUser, setSelUser] = useState(""); const [pRoles, setPRoles] = useState<string[]>([]);
  const [pPerms, setPPerms] = useState<string[]>([]); const [pActive, setPActive] = useState(true);

  const loadCompanies = useCallback(async () => {
    try { const d = await api.get<ListResponse<Company>>("/admin/companies/"); setCompanies(parseList(d)); }
    catch (e: any) { toast.error(e?.message || "Erro ao carregar empresas"); }
  }, []);
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try { const d = await api.get<ListResponse<User>>("/admin/users/"); setUsers(parseList(d)); }
    catch (e: any) { toast.error(e?.message || "Erro ao carregar usuários"); }
    finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { void Promise.all([loadCompanies(), loadUsers()]); }, [loadCompanies, loadUsers]);

  const primary = useMemo(() => companies[0] ?? null, [companies]);
  const selUserObj = useMemo(() => users.find((u) => String(u.id) === String(selUser)) ?? null, [users, selUser]);
  const inherited = useMemo(() => new Set(getInheritedPermissionsForRoles(pRoles, ALL_PERMS)), [pRoles]);
  const hasCompanies = companies.length > 0;
  const companyReady = !!cName.trim() && !!cCnpj.trim() && !!cEmail.trim();
  const adminReady = !!aName.trim() && !!aEmail.trim() && !!aPwd.trim();

  useEffect(() => {
    if (!primary) return;
    setCName(primary.name || ""); setCCnpj(primary.cnpj || ""); setCEmail(primary.email || "");
    setCPhone(primary.phone || ""); setCSlug(primary.slug || ""); setCLegal(primary.legal_name || "");
    setCOab(primary.oab || ""); setCWebsite(primary.website || ""); setCDesc(primary.description || "");
    setCLogo(primary.logo_url || ""); setCZip(primary.cep || ""); setCState(primary.state || "");
    setCCity(primary.city || ""); setCAddr(primary.address_line1 || "");
  }, [primary]);

  useEffect(() => { if (primary && !uCompany) setUCompany(String(primary.id)); }, [primary, uCompany]);

  useEffect(() => {
    if (!selUserObj) return;
    setPRoles(normalizeRoles(selUserObj.roles));
    setPPerms(Array.isArray(selUserObj.permissions) ? selUserObj.permissions : []);
    setPActive(selUserObj.is_active ?? true);
  }, [selUserObj]);

  useEffect(() => {
    setPPerms((prev) => {
      const next = stripInheritedPermissions(prev, getInheritedPermissionsForRoles(pRoles, ALL_PERMS));
      return sameItems(prev, next) ? prev : next;
    });
  }, [pRoles]);

  const onLogoChange = (file?: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setCLogo(typeof r.result === "string" ? r.result : "");
    r.readAsDataURL(file);
  };

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyReady) return;
    setSaving(true);
    try {
      const payload: any = {
        name: cName.trim(), cnpj: cCnpj.trim(), email: cEmail.trim(),
        ...(cPhone.trim() && { phone: cPhone.trim() }),
        ...(cSlug.trim() && { slug: cSlug.trim() }),
        ...(cLegal.trim() && { legal_name: cLegal.trim() }),
        ...(cOab.trim() && { oab: cOab.trim() }),
        ...(cWebsite.trim() && { website: cWebsite.trim() }),
        ...(cDesc.trim() && { description: cDesc.trim() }),
        ...(cLogo.trim() && { logo_url: cLogo.trim() }),
        ...(cZip.trim() && { cep: cZip.trim() }),
        ...(cState.trim() && { state: cState.trim() }),
        ...(cCity.trim() && { city: cCity.trim() }),
        ...(cAddr.trim() && { address_line1: cAddr.trim() }),
      };
      if (primary?.id) {
        await api.patch(`/admin/companies/${primary.id}/`, payload);
        toast.success("Empresa atualizada com sucesso");
      } else {
        await api.post("/admin/companies/", {
          tenant: payload,
          admin: { email: String(authUser?.email || cEmail).trim().toLowerCase(), full_name: String(profile?.full_name || cName).trim() },
        });
        toast.success("Empresa cadastrada! Configure agora o usuário administrador.");
        setTab("admin-user");
      }
      await loadCompanies();
    } catch (e: any) { toast.error(e?.message || "Erro ao salvar empresa"); }
    finally { setSaving(false); }
  };

  const handleSaveAdminUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminReady || !primary?.id) return;
    setSaving(true);
    try {
      await api.post("/admin/users/", {
        email: aEmail.trim().toLowerCase(), password: aPwd, full_name: aName.trim(),
        tenant_id: primary.id, is_active: true, roles: aRoles,
        ...(aPhone.trim() && { phone: aPhone.trim() }),
        ...(aOab.trim() && { oab_number: aOab.trim() }),
      });
      toast.success("Administrador criado com sucesso!");
      await loadUsers();
      setTab("users");
    } catch (e: any) { toast.error(e?.message || "Erro ao criar administrador"); }
    finally { setSaving(false); }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<any>("/admin/users/", {
        email: uEmail.trim().toLowerCase(), password: uPwd, full_name: uName.trim(),
        ...(uCompany && { tenant_id: uCompany }), is_active: true, roles: uRoles,
      });
      if (uLinkEmp && uCargo.trim()) {
        try {
          await createEmployeeRecord({
            userId: String(created?.id ?? created?.user?.id ?? "") || null,
            tenantId: uCompany || null, fullName: uName.trim(),
            email: uEmail.trim().toLowerCase(), matricula: uMatricula.trim() || null,
            cargoId: uCargo.trim() || null, dataAdmissao: uAdmissao || null,
            salarioAtual: uSalario.trim() || null, statusFuncional: "ATIVO", notes: null,
          });
        } catch { toast.warning("Usuário criado, mas vínculo de funcionário falhou."); }
      }
      toast.success("Usuário criado com sucesso");
      setUName(""); setUEmail(""); setUPwd(""); setURoles(["LAWYER"]); setULinkEmp(false);
      await loadUsers();
    } catch (e: any) { toast.error(e?.message || "Erro ao criar usuário"); }
    finally { setSaving(false); }
  };

  const handleSavePermissions = async (e: FormEvent) => {
    e.preventDefault();
    if (!selUser) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${selUser}/`, { roles: pRoles, permissions: pPerms, is_active: pActive });
      toast.success("Permissões atualizadas");
      await loadUsers();
    } catch (e: any) { toast.error(e?.message || "Erro ao atualizar permissões"); }
    finally { setSaving(false); }
  };

  /* Shared classes */
  const inputCls = "pl-3";
  const iconInputCls = "pl-9";
  const selectCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  const textareaCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y";

  function Card({ children }: { children: React.ReactNode }) {
    return <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">{children}</div>;
  }
  function CardHead({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
    return (
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-[17px] w-[17px] text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Banner */}
      {!hasCompanies && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-5 py-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-foreground">Primeiro acesso — configure o escritório</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Comece pela aba <strong>Empresa</strong>, depois crie o <strong>Usuário admin</strong> para acessar o sistema.
            </p>
          </div>
        </div>
      )}

      {/* ── EMPRESA ── */}
      {tab === "company" && (
        <form onSubmit={handleSaveCompany}>
          <Card>
            <CardHead icon={Building2} title={hasCompanies ? "Dados da empresa" : "Cadastrar empresa"} subtitle={hasCompanies ? "Atualize as informações do escritório." : "Preencha os dados do escritório para iniciar."} />
            <div className="divide-y divide-border">

              <div className="space-y-4 px-6 py-6">
                <SectionTitle>Identificação</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FLabel required>Nome do escritório</FLabel>
                    <Input placeholder="Ex: Dantas Advocacia" value={cName}
                      onChange={(e) => { setCName(e.target.value); setCSlug(slugify(e.target.value)); }} required />
                    {cSlug && <p className="mt-1 text-[11px] text-muted-foreground">slug: <code className="font-mono">{cSlug}</code></p>}
                  </div>
                  <div>
                    <FLabel required>CNPJ</FLabel>
                    <Input placeholder="00.000.000/0000-00" value={cCnpj} onChange={(e) => setCCnpj(maskCNPJ(e.target.value))} required />
                  </div>
                  <div className="sm:col-span-2">
                    <FLabel>Razão social</FLabel>
                    <Input placeholder="Razão social conforme CNPJ" value={cLegal} onChange={(e) => setCLegal(e.target.value)} />
                  </div>
                  <div>
                    <FLabel>Nº OAB do escritório</FLabel>
                    <IconInput icon={Hash}>
                      <Input className={iconInputCls} placeholder="OAB/SP 0000" value={cOab} onChange={(e) => setCOab(e.target.value)} />
                    </IconInput>
                  </div>
                  <div>
                    <FLabel>Site</FLabel>
                    <IconInput icon={Globe}>
                      <Input className={iconInputCls} placeholder="https://escritório.adv.br" value={cWebsite} onChange={(e) => setCWebsite(e.target.value)} />
                    </IconInput>
                  </div>
                  <div className="sm:col-span-2">
                    <FLabel>Descrição / especialidade</FLabel>
                    <textarea className={textareaCls} rows={2} placeholder="Ex: Especialistas em direito trabalhista..." value={cDesc} onChange={(e) => setCDesc(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <SectionTitle>Logo</SectionTitle>
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                    {cLogo ? <img src={cLogo} alt="logo" className="h-full w-full object-cover" /> : <Building2 className="h-7 w-7 text-muted-foreground/30" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Imagem da logo</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">PNG ou JPG. Aparece no portal e nos documentos.</p>
                    <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                      <ImgIcon className="h-3.5 w-3.5" /> Escolher arquivo
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => onLogoChange(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <SectionTitle>Contato</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FLabel required>E-mail do escritório</FLabel>
                    <IconInput icon={Mail}>
                      <Input type="email" className={iconInputCls} placeholder="contato@escritório.adv.br" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
                    </IconInput>
                  </div>
                  <div>
                    <FLabel>Telefone / WhatsApp</FLabel>
                    <IconInput icon={Phone}>
                      <Input className={iconInputCls} placeholder="(00) 00000-0000" value={cPhone} onChange={(e) => setCPhone(maskPhoneBR(e.target.value))} />
                    </IconInput>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <SectionTitle>Endereço</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <FLabel>CEP</FLabel>
                    <Input placeholder="00000-000" value={cZip} onChange={(e) => setCZip(maskCEP(e.target.value))} />
                  </div>
                  <div>
                    <FLabel>Estado</FLabel>
                    <select className={selectCls} value={maskUF(cState)} onChange={(e) => setCState(maskUF(e.target.value))}>
                      <option value="">UF</option>
                      {BR_UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                  <div>
                    <FLabel>Cidade</FLabel>
                    <Input placeholder="São Paulo" value={cCity} onChange={(e) => setCCity(e.target.value)} />
                  </div>
                  <div className="sm:col-span-3">
                    <FLabel>Logradouro</FLabel>
                    <IconInput icon={MapPin}>
                      <Input className={iconInputCls} placeholder="Rua, número, complemento, bairro" value={cAddr} onChange={(e) => setCAddr(e.target.value)} />
                    </IconInput>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4">
                <div className={cn("flex items-center gap-2 text-sm", companyReady ? "text-success" : "text-muted-foreground")}>
                  {companyReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {companyReady ? "Pronto para salvar" : "Preencha nome, CNPJ e e-mail"}
                </div>
                <Button type="submit" disabled={!companyReady || saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                    : hasCompanies ? "Salvar alterações" : <>Cadastrar empresa <ChevronRight className="ml-1 h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* ── USUÁRIO ADMIN ── */}
      {tab === "admin-user" && (
        <form onSubmit={handleSaveAdminUser}>
          <Card>
            <CardHead icon={UserPlus} title="Usuário administrador" subtitle="Crie o acesso principal ao painel interno do escritório." />
            {!hasCompanies && (
              <div className="mx-6 mt-5 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-warning" /> Cadastre a empresa primeiro.
              </div>
            )}
            <div className={cn("divide-y divide-border", !hasCompanies && "pointer-events-none opacity-50")}>
              <div className="space-y-4 px-6 py-6">
                <SectionTitle>Dados pessoais</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FLabel required>Nome completo</FLabel>
                    <Input placeholder="Dr. João da Silva" value={aName} onChange={(e) => setAName(e.target.value)} required />
                  </div>
                  <div>
                    <FLabel required>E-mail de acesso</FLabel>
                    <IconInput icon={Mail}>
                      <Input type="email" className={iconInputCls} placeholder="joao@escritório.adv.br" value={aEmail} onChange={(e) => setAEmail(e.target.value)} required />
                    </IconInput>
                  </div>
                  <div>
                    <FLabel required>Senha inicial</FLabel>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-foreground" />
                      <Input type={showPwd ? "text" : "password"} className="pl-9 pr-10" placeholder="Mínimo 8 caracteres" value={aPwd} onChange={(e) => setAPwd(e.target.value)} required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPwd(p => !p)}>
                        {showPwd ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <FLabel>Telefone</FLabel>
                    <IconInput icon={Phone}>
                      <Input className={iconInputCls} placeholder="(00) 00000-0000" value={aPhone} onChange={(e) => setAPhone(maskPhoneBR(e.target.value))} />
                    </IconInput>
                  </div>
                  <div className="sm:col-span-2">
                    <FLabel>Número OAB</FLabel>
                    <IconInput icon={Briefcase}>
                      <Input className={iconInputCls} placeholder="OAB/SP 000000" value={aOab} onChange={(e) => setAOab(e.target.value)} />
                    </IconInput>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <SectionTitle>Perfis de acesso</SectionTitle>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ROLES.map((role) => (
                    <RoleCard key={role} role={role} checked={aRoles.includes(role)} onChange={() => setARoles(p => toggle(p, role))} />
                  ))}
                </div>
              </div>

              <div className="flex justify-end px-6 py-4">
                <Button type="submit" disabled={!adminReady || !hasCompanies || saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : <><UserPlus className="mr-2 h-4 w-4" />Criar administrador</>}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* ── USUÁRIOS ── */}
      {tab === "users" && (
        <div className="space-y-5">
          <Card>
            <CardHead icon={Users} title="Usuários cadastrados" subtitle={`${users.length} usuário(s) no sistema`} />
            <div className="px-6 py-4">
              {loadingUsers ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
              ) : users.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
              ) : (
                <div className="space-y-2 py-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
                        {(u.full_name || u.email || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{u.full_name || u.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {normalizeRoles(u.roles).slice(0, 2).map((r) => (
                          <span key={r} className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_META[r]?.chip)}>{ROLE_META[r]?.label || r}</span>
                        ))}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", u.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                          {u.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <form onSubmit={handleCreateUser}>
            <Card>
              <CardHead icon={UserPlus} title="Novo usuário" subtitle="Adicione um membro à equipe." />
              <div className="divide-y divide-border">
                <div className="space-y-4 px-6 py-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FLabel required>Nome completo</FLabel>
                      <Input placeholder="Dr. Maria Santos" value={uName} onChange={(e) => setUName(e.target.value)} required />
                    </div>
                    <div>
                      <FLabel required>E-mail</FLabel>
                      <IconInput icon={Mail}>
                        <Input type="email" className={iconInputCls} placeholder="maria@escritório.adv.br" value={uEmail} onChange={(e) => setUEmail(e.target.value)} required />
                      </IconInput>
                    </div>
                    <div>
                      <FLabel required>Senha</FLabel>
                      <IconInput icon={Lock}>
                        <Input type="password" className={iconInputCls} placeholder="Mínimo 8 caracteres" value={uPwd} onChange={(e) => setUPwd(e.target.value)} required />
                      </IconInput>
                    </div>
                    <div>
                      <FLabel>Empresa</FLabel>
                      <select className={selectCls} value={uCompany} onChange={(e) => setUCompany(e.target.value)}>
                        <option value="">Selecione</option>
                        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <FLabel>Perfil</FLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {ROLES.map((role) => (
                        <RoleCard key={role} role={role} checked={uRoles.includes(role)} onChange={() => setURoles(p => toggle(p, role))} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Criar vínculo de funcionário</p>
                      <p className="text-xs text-muted-foreground">Registra no módulo de RH</p>
                    </div>
                    <Switch checked={uLinkEmp} onCheckedChange={setULinkEmp} />
                  </div>
                  {uLinkEmp && (
                    <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
                      <div><FLabel>Matrícula</FLabel><Input placeholder="000001" value={uMatricula} onChange={(e) => setUMatricula(e.target.value)} /></div>
                      <div><FLabel required>ID do cargo</FLabel><Input placeholder="UUID do cargo" value={uCargo} onChange={(e) => setUCargo(e.target.value)} /></div>
                      <div><FLabel>Admissão</FLabel><Input type="date" value={uAdmissao} onChange={(e) => setUAdmissao(e.target.value)} /></div>
                      <div><FLabel>Salário</FLabel><Input placeholder="R$ 0,00" value={uSalario} onChange={(e) => setUSalario(e.target.value)} /></div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end px-6 py-4">
                  <Button type="submit" disabled={!uName || !uEmail || !uPwd || saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : <><UserPlus className="mr-2 h-4 w-4" />Criar usuário</>}
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      )}

      {/* ── PERMISSÕES ── */}
      {tab === "permissions" && (
        <form onSubmit={handleSavePermissions}>
          <Card>
            <CardHead icon={Shield} title="Permissões de acesso" subtitle="Ajuste perfis e acessos individuais por usuário." />
            <div className="divide-y divide-border">
              <div className="px-6 py-6">
                <FLabel>Selecionar usuário</FLabel>
                {loadingUsers
                  ? <p className="text-sm text-muted-foreground">Carregando...</p>
                  : (
                    <select className={selectCls} value={selUser} onChange={(e) => setSelUser(e.target.value)}>
                      <option value="">Selecione um usuário</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.name || u.email} — {u.email}</option>)}
                    </select>
                  )}
              </div>

              {selUser && (
                <>
                  <div className="px-6 py-6">
                    <SectionTitle>Perfis</SectionTitle>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {ROLES.map((role) => (
                        <RoleCard key={role} role={role} checked={pRoles.includes(role)} onChange={() => setPRoles(p => toggle(p, role))} />
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-6">
                    <SectionTitle>Permissões individuais</SectionTitle>
                    <p className="mb-4 text-sm text-muted-foreground">Cinza = herdado do perfil (não editável). Use para acessos extras.</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ALL_PERMS.map((perm) => {
                        const inh = inherited.has(perm);
                        const chk = inh || pPerms.includes(perm);
                        return (
                          <label key={perm} className={cn("flex items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors", inh ? "cursor-not-allowed border-border/50 bg-muted/40 opacity-60" : "cursor-pointer border-border hover:bg-muted/40")}>
                            <input type="checkbox" className="h-3.5 w-3.5 shrink-0 accent-primary" checked={chk} disabled={inh} onChange={() => setPPerms(p => toggle(p, perm))} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{PERM_LABEL[perm] || perm}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{perm}</p>
                            </div>
                            {inh && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">herdado</span>}
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
                    <Switch checked={pActive} onCheckedChange={setPActive} />
                  </div>

                  <div className="flex justify-end px-6 py-4">
                    <Button type="submit" disabled={!selUser || saving}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Salvar permissões</>}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
