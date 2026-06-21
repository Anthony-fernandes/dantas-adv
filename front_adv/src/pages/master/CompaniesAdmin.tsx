import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2, Loader2, Shield, UserPlus, CheckCircle2, Mail, Phone,
  MapPin, Image as ImgIcon, ChevronRight, Users, Lock, Eye, EyeOff,
  AlertCircle, BadgeCheck, Globe, FileText, Hash, Briefcase,
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

const ROLES = ["OWNER","ADMIN","LAWYER","FINANCE","ASSISTANT","CLIENT"] as const;
const ROLE_META: Record<string, { label: string; desc: string; bg: string; text: string }> = {
  OWNER:     { label: "Proprietário",  desc: "Controle total",          bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  ADMIN:     { label: "Administrador", desc: "Usuários e config.",       bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300" },
  LAWYER:    { label: "Advogado",      desc: "Processos e docs",         bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  FINANCE:   { label: "Financeiro",    desc: "Honorários e contas",      bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300" },
  ASSISTANT: { label: "Assistente",    desc: "Suporte operacional",      bg: "bg-sky-100 dark:bg-sky-900/30",      text: "text-sky-700 dark:text-sky-300" },
  CLIENT:    { label: "Cliente",       desc: "Portal do cliente",        bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-700 dark:text-rose-300" },
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

/* ─── Helpers ─── */
function slugify(v: string) {
  return (v||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim()
    .replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-");
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
  if (typeof raw === "object") return Object.entries(raw).filter(([,v])=>Boolean(v)).map(([k])=>k.toUpperCase());
  return [];
}
function sameItems(a: string[], b: string[]) { return a.length===b.length && a.every((v,i)=>v===b[i]); }
function toggle(arr: string[], v: string) { return arr.includes(v) ? arr.filter((x)=>x!==v) : [...arr, v]; }

/* ─── UI atoms ─── */
function FLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#1e293b", marginBottom:6 }}>
      {children}{required && <span style={{ color:"#ef4444", marginLeft:3 }}>*</span>}
    </label>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#64748b" }}>{title}</span>
        <div style={{ flex:1, height:1, background:"#e2e8f0" }} />
      </div>
      {children}
    </div>
  );
}
function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:16 }}>{children}</div>;
}
function InputWrap({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) {
  if (!Icon) return <>{children}</>;
  return (
    <div style={{ position:"relative" }}>
      <Icon style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"#94a3b8", pointerEvents:"none" }} />
      {children}
    </div>
  );
}

type TabKey = "company" | "admin-user" | "users" | "permissions";
const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "company",    label: "Empresa",         icon: Building2 },
  { key: "admin-user", label: "Usuário admin",   icon: UserPlus },
  { key: "users",      label: "Usuários",        icon: Users },
  { key: "permissions",label: "Permissões",      icon: Shield },
];

/* ─── Main ─── */
export default function CompaniesAdmin() {
  const location = useLocation();
  const { user: authUser, profile } = useAuth();

  const [tab, setTab] = useState<TabKey>("company");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* Company form */
  const [cName, setCName] = useState("");
  const [cCnpj, setCCnpj] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cLegal, setCLegal] = useState("");
  const [cOab, setCOab] = useState("");
  const [cWebsite, setCWebsite] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cLogo, setCLogo] = useState("");
  const [cZip, setCZip] = useState("");
  const [cState, setCState] = useState("");
  const [cCity, setCCity] = useState("");
  const [cAddr, setCAddr] = useState("");

  /* Admin user form (first user) */
  const [aName, setAName] = useState("");
  const [aEmail, setAEmail] = useState("");
  const [aPwd, setAPwd] = useState("");
  const [aOab, setAOab] = useState("");
  const [aPhone, setAPhone] = useState("");
  const [aRoles, setARoles] = useState<string[]>(["OWNER","ADMIN"]);

  /* New user form */
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPwd, setUPwd] = useState("");
  const [uCompany, setUCompany] = useState("");
  const [uRoles, setURoles] = useState<string[]>(["LAWYER"]);
  const [uLinkEmp, setULinkEmp] = useState(false);
  const [uMatricula, setUMatricula] = useState("");
  const [uCargo, setUCargo] = useState("");
  const [uAdmissao, setUAdmissao] = useState("");
  const [uSalario, setUSalario] = useState("");

  /* Permissions */
  const [selUser, setSelUser] = useState("");
  const [pRoles, setPRoles] = useState<string[]>([]);
  const [pPerms, setPPerms] = useState<string[]>([]);
  const [pActive, setPActive] = useState(true);

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
  const selUserObj = useMemo(() => users.find((u)=>String(u.id)===String(selUser))??null, [users, selUser]);
  const inherited = useMemo(() => new Set(getInheritedPermissionsForRoles(pRoles, ALL_PERMS)), [pRoles]);

  useEffect(() => {
    if (!primary) return;
    setCName(primary.name||""); setCCnpj(primary.cnpj||""); setCEmail(primary.email||"");
    setCPhone(primary.phone||""); setCSlug(primary.slug||""); setCLegal(primary.legal_name||"");
    setCOab(primary.oab||""); setCWebsite(primary.website||""); setCDesc(primary.description||"");
    setCLogo(primary.logo_url||""); setCZip(primary.cep||""); setCState(primary.state||"");
    setCCity(primary.city||""); setCAddr(primary.address_line1||"");
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

  const hasCompanies = companies.length > 0;
  const companyReady = !!cName.trim() && !!cCnpj.trim() && !!cEmail.trim();
  const adminReady = !!aName.trim() && !!aEmail.trim() && !!aPwd.trim();

  const onLogoChange = (file?: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setCLogo(typeof r.result==="string" ? r.result : "");
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
          admin: { email: String(authUser?.email||cEmail).trim().toLowerCase(), full_name: String(profile?.full_name||cName).trim() },
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
      toast.success("Administrador criado com sucesso. Você pode fazer login agora.");
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
            userId: String(created?.id??created?.user?.id??"") || null,
            tenantId: uCompany || null, fullName: uName.trim(),
            email: uEmail.trim().toLowerCase(), matricula: uMatricula.trim()||null,
            cargoId: uCargo.trim()||null, dataAdmissao: uAdmissao||null,
            salarioAtual: uSalario.trim()||null, statusFuncional: "ATIVO", notes: null,
          });
        } catch { toast.warning("Usuário criado, mas o vínculo de funcionário falhou."); }
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

  /* ── Render ── */
  const tabStyle = (key: TabKey) => ({
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 16px", borderRadius: 10, cursor: "pointer",
    fontSize: 13, fontWeight: 600, transition: "all 0.15s",
    background: tab === key ? "#fff" : "transparent",
    color: tab === key ? "#7c3aed" : "#64748b",
    boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" : "none",
  } as React.CSSProperties);

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    overflow: "hidden",
  };
  const cardHeader: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
  };
  const cardBody: React.CSSProperties = { padding: "24px" };

  const inputCls = "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow";
  const selectCls = "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Banner */}
      {!hasCompanies && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:12, padding:"16px 20px" }}>
          <AlertCircle style={{ width:18, height:18, color:"#d97706", marginTop:1, flexShrink:0 }} />
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:"#92400e", margin:0 }}>Primeiro acesso — configure o escritório</p>
            <p style={{ fontSize:13, color:"#b45309", margin:"4px 0 0" }}>
              Comece pela aba <b>Empresa</b>, depois crie o <b>Usuário admin</b> para acessar o sistema.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"#f1f5f9", borderRadius:12, padding:4 }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" style={tabStyle(t.key)} onClick={() => setTab(t.key)}>
            <t.icon style={{ width:14, height:14 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB EMPRESA ── */}
      {tab === "company" && (
        <form onSubmit={handleSaveCompany}>
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Building2 style={{ width:17, height:17, color:"#7c3aed" }} />
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>
                  {hasCompanies ? "Dados da empresa" : "Cadastrar empresa"}
                </p>
                <p style={{ fontSize:13, color:"#64748b", margin:"2px 0 0" }}>
                  {hasCompanies ? "Atualize as informações do escritório." : "Preencha os dados do escritório para iniciar."}
                </p>
              </div>
            </div>

            <div style={{ ...cardBody, display:"flex", flexDirection:"column", gap:28 }}>

              <Section title="Identificação">
                <Grid cols={2}>
                  <div>
                    <FLabel required>Nome do escritório</FLabel>
                    <Input className={inputCls} placeholder="Ex: Dantas Advocacia" value={cName}
                      onChange={(e) => { setCName(e.target.value); setCSlug(slugify(e.target.value)); }} required />
                    {cSlug && <p style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>slug: <code>{cSlug}</code></p>}
                  </div>
                  <div>
                    <FLabel required>CNPJ</FLabel>
                    <Input className={inputCls} placeholder="00.000.000/0000-00" value={cCnpj}
                      onChange={(e) => setCCnpj(maskCNPJ(e.target.value))} required />
                  </div>
                  <div style={{ gridColumn:"span 2" }}>
                    <FLabel>Razão social</FLabel>
                    <Input className={inputCls} placeholder="Razão social conforme CNPJ" value={cLegal} onChange={(e) => setCLegal(e.target.value)} />
                  </div>
                  <div>
                    <FLabel>Nº OAB do escritório</FLabel>
                    <InputWrap icon={Hash}>
                      <Input className={cn(inputCls, "pl-9")} placeholder="OAB/SP 0000" value={cOab} onChange={(e) => setCOab(e.target.value)} />
                    </InputWrap>
                  </div>
                  <div>
                    <FLabel>Site</FLabel>
                    <InputWrap icon={Globe}>
                      <Input className={cn(inputCls, "pl-9")} placeholder="https://escritorio.adv.br" value={cWebsite} onChange={(e) => setCWebsite(e.target.value)} />
                    </InputWrap>
                  </div>
                  <div style={{ gridColumn:"span 2" }}>
                    <FLabel>Descrição / especialidade</FLabel>
                    <textarea
                      rows={2}
                      placeholder="Ex: Especialistas em direito trabalhista e previdenciário..."
                      value={cDesc}
                      onChange={(e) => setCDesc(e.target.value)}
                      style={{ width:"100%", borderRadius:8, border:"1px solid #e2e8f0", padding:"8px 12px", fontSize:14, color:"#0f172a", resize:"vertical", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                    />
                  </div>
                </Grid>
              </Section>

              <Section title="Logo">
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:80, height:80, borderRadius:12, border:"2px dashed #e2e8f0", background:"#f8fafc", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0 }}>
                    {cLogo ? <img src={cLogo} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <Building2 style={{ width:28, height:28, color:"#cbd5e1" }} />}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:"#0f172a", margin:0 }}>Imagem da logo</p>
                    <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 10px" }}>PNG ou JPG. Aparece no portal, documentos e e-mails.</p>
                    <label style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"1px solid #e2e8f0", background:"#f8fafc", fontSize:13, fontWeight:600, color:"#374151", cursor:"pointer" }}>
                      <ImgIcon style={{ width:14, height:14 }} /> Escolher arquivo
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={(e) => onLogoChange(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>
              </Section>

              <Section title="Contato">
                <Grid cols={2}>
                  <div>
                    <FLabel required>E-mail do escritório</FLabel>
                    <InputWrap icon={Mail}>
                      <Input type="email" className={cn(inputCls, "pl-9")} placeholder="contato@escritorio.adv.br" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
                    </InputWrap>
                  </div>
                  <div>
                    <FLabel>Telefone / WhatsApp</FLabel>
                    <InputWrap icon={Phone}>
                      <Input className={cn(inputCls, "pl-9")} placeholder="(00) 00000-0000" value={cPhone} onChange={(e) => setCPhone(maskPhoneBR(e.target.value))} />
                    </InputWrap>
                  </div>
                </Grid>
              </Section>

              <Section title="Endereço">
                <Grid cols={3}>
                  <div>
                    <FLabel>CEP</FLabel>
                    <Input className={inputCls} placeholder="00000-000" value={cZip} onChange={(e) => setCZip(maskCEP(e.target.value))} />
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
                    <Input className={inputCls} placeholder="São Paulo" value={cCity} onChange={(e) => setCCity(e.target.value)} />
                  </div>
                  <div style={{ gridColumn:"span 3" }}>
                    <FLabel>Logradouro</FLabel>
                    <InputWrap icon={MapPin}>
                      <Input className={cn(inputCls, "pl-9")} placeholder="Rua, número, complemento, bairro" value={cAddr} onChange={(e) => setCAddr(e.target.value)} />
                    </InputWrap>
                  </div>
                </Grid>
              </Section>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid #f1f5f9" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color: companyReady ? "#059669" : "#94a3b8" }}>
                  {companyReady
                    ? <><CheckCircle2 style={{ width:15, height:15 }} /> Pronto para salvar</>
                    : <><AlertCircle style={{ width:15, height:15 }} /> Preencha nome, CNPJ e e-mail</>
                  }
                </div>
                <Button type="submit" disabled={!companyReady || saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                    : hasCompanies ? "Salvar alterações" : <>Cadastrar e configurar usuário <ChevronRight className="ml-1 h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB ADMIN USER ── */}
      {tab === "admin-user" && (
        <form onSubmit={handleSaveAdminUser}>
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <UserPlus style={{ width:17, height:17, color:"#7c3aed" }} />
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Usuário administrador</p>
                <p style={{ fontSize:13, color:"#64748b", margin:"2px 0 0" }}>
                  Crie o usuário que terá acesso ao painel interno do escritório.
                </p>
              </div>
            </div>

            {!hasCompanies && (
              <div style={{ margin:"16px 24px 0", padding:"12px 16px", background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:10, fontSize:13, color:"#92400e" }}>
                Cadastre a empresa primeiro antes de criar o administrador.
              </div>
            )}

            <div style={{ ...cardBody, display:"flex", flexDirection:"column", gap:24, opacity: hasCompanies ? 1 : 0.5, pointerEvents: hasCompanies ? "auto" : "none" }}>

              <Section title="Dados pessoais">
                <Grid cols={2}>
                  <div>
                    <FLabel required>Nome completo</FLabel>
                    <Input className={inputCls} placeholder="Dr. João da Silva" value={aName} onChange={(e) => setAName(e.target.value)} required />
                  </div>
                  <div>
                    <FLabel required>E-mail de acesso</FLabel>
                    <InputWrap icon={Mail}>
                      <Input type="email" className={cn(inputCls, "pl-9")} placeholder="joao@escritorio.adv.br" value={aEmail} onChange={(e) => setAEmail(e.target.value)} required />
                    </InputWrap>
                  </div>
                  <div>
                    <FLabel required>Senha inicial</FLabel>
                    <div style={{ position:"relative" }}>
                      <Lock style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"#94a3b8", pointerEvents:"none" }} />
                      <Input type={showPwd?"text":"password"} className={cn(inputCls, "pl-9 pr-10")} placeholder="Mínimo 8 caracteres" value={aPwd} onChange={(e) => setAPwd(e.target.value)} required />
                      <button type="button" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", cursor:"pointer", background:"none", border:"none" }} onClick={() => setShowPwd(p=>!p)}>
                        {showPwd ? <EyeOff style={{ width:15, height:15 }} /> : <Eye style={{ width:15, height:15 }} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <FLabel>Telefone</FLabel>
                    <InputWrap icon={Phone}>
                      <Input className={cn(inputCls, "pl-9")} placeholder="(00) 00000-0000" value={aPhone} onChange={(e) => setAPhone(maskPhoneBR(e.target.value))} />
                    </InputWrap>
                  </div>
                  <div style={{ gridColumn:"span 2" }}>
                    <FLabel>Número OAB</FLabel>
                    <InputWrap icon={Briefcase}>
                      <Input className={cn(inputCls, "pl-9")} placeholder="OAB/SP 000000" value={aOab} onChange={(e) => setAOab(e.target.value)} />
                    </InputWrap>
                  </div>
                </Grid>
              </Section>

              <Section title="Perfis de acesso">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
                  {ROLES.map((role) => {
                    const m = ROLE_META[role];
                    const on = aRoles.includes(role);
                    return (
                      <label key={role} style={{ display:"flex", flexDirection:"column", gap:6, padding:"12px 14px", borderRadius:10, border: on ? "2px solid #7c3aed" : "2px solid #e2e8f0", background: on ? "#faf5ff" : "#fff", cursor:"pointer", transition:"all 0.15s" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", m.bg, m.text)}>{m.label}</span>
                          <input type="checkbox" style={{ width:14, height:14, accentColor:"#7c3aed" }} checked={on} onChange={() => setARoles((p) => toggle(p, role))} />
                        </div>
                        <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{m.desc}</p>
                      </label>
                    );
                  })}
                </div>
              </Section>

              <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:8, borderTop:"1px solid #f1f5f9" }}>
                <Button type="submit" disabled={!adminReady || !hasCompanies || saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</>
                    : <><UserPlus className="mr-2 h-4 w-4" />Criar administrador</>}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB USUÁRIOS ── */}
      {tab === "users" && (
        <form onSubmit={handleCreateUser}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Lista */}
            <div style={card}>
              <div style={cardHeader}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Users style={{ width:17, height:17, color:"#7c3aed" }} />
                </div>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Usuários cadastrados</p>
                  <p style={{ fontSize:13, color:"#64748b", margin:"2px 0 0" }}>{users.length} usuário(s) no sistema</p>
                </div>
              </div>
              <div style={{ padding:"0 24px 16px" }}>
                {loadingUsers ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"20px 0", color:"#94a3b8", fontSize:13 }}>
                    <Loader2 style={{ width:14, height:14, animation:"spin 1s linear infinite" }} /> Carregando...
                  </div>
                ) : users.length === 0 ? (
                  <p style={{ fontSize:13, color:"#94a3b8", padding:"20px 0" }}>Nenhum usuário cadastrado ainda.</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6, paddingTop:8 }}>
                    {users.map((u) => (
                      <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:"#7c3aed", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>
                          {(u.full_name||u.email||"U").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:0 }}>{u.full_name||u.name||"—"}</p>
                          <p style={{ fontSize:12, color:"#94a3b8", margin:"2px 0 0" }}>{u.email}</p>
                        </div>
                        <div style={{ display:"flex", gap:4 }}>
                          {normalizeRoles(u.roles).slice(0,2).map((r) => (
                            <span key={r} className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_META[r]?.bg, ROLE_META[r]?.text)}>{ROLE_META[r]?.label||r}</span>
                          ))}
                        </div>
                        <span style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background: u.is_active ? "#d1fae5" : "#fee2e2", color: u.is_active ? "#065f46" : "#991b1b", fontWeight:600 }}>
                          {u.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Formulário novo usuário */}
            <div style={card}>
              <div style={cardHeader}>
                <div style={{ width:36, height:36, borderRadius:10, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <UserPlus style={{ width:17, height:17, color:"#7c3aed" }} />
                </div>
                <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Novo usuário</p>
              </div>
              <div style={{ ...cardBody, display:"flex", flexDirection:"column", gap:20 }}>
                <Grid cols={2}>
                  <div>
                    <FLabel required>Nome completo</FLabel>
                    <Input className={inputCls} placeholder="Dr. Maria Santos" value={uName} onChange={(e) => setUName(e.target.value)} required />
                  </div>
                  <div>
                    <FLabel required>E-mail</FLabel>
                    <InputWrap icon={Mail}>
                      <Input type="email" className={cn(inputCls, "pl-9")} placeholder="maria@escritorio.adv.br" value={uEmail} onChange={(e) => setUEmail(e.target.value)} required />
                    </InputWrap>
                  </div>
                  <div>
                    <FLabel required>Senha</FLabel>
                    <InputWrap icon={Lock}>
                      <Input type="password" className={cn(inputCls, "pl-9")} placeholder="Mínimo 8 caracteres" value={uPwd} onChange={(e) => setUPwd(e.target.value)} required />
                    </InputWrap>
                  </div>
                  <div>
                    <FLabel>Empresa</FLabel>
                    <select className={selectCls} value={uCompany} onChange={(e) => setUCompany(e.target.value)}>
                      <option value="">Selecione</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </Grid>

                <div>
                  <p style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#64748b", marginBottom:10 }}>Perfil</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 }}>
                    {ROLES.map((role) => {
                      const m = ROLE_META[role];
                      const on = uRoles.includes(role);
                      return (
                        <label key={role} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:10, border: on ? "2px solid #7c3aed" : "2px solid #e2e8f0", background: on ? "#faf5ff" : "#fff", cursor:"pointer" }}>
                          <input type="checkbox" style={{ width:13, height:13, accentColor:"#7c3aed" }} checked={on} onChange={() => setURoles((p) => toggle(p, role))} />
                          <span style={{ fontSize:12, fontWeight:600, color: on ? "#7c3aed" : "#374151" }}>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:0 }}>Criar vínculo de funcionário</p>
                    <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>Registra automaticamente no módulo de RH</p>
                  </div>
                  <Switch checked={uLinkEmp} onCheckedChange={setULinkEmp} />
                </div>

                {uLinkEmp && (
                  <Grid cols={2}>
                    <div>
                      <FLabel>Matrícula</FLabel>
                      <Input className={inputCls} placeholder="000001" value={uMatricula} onChange={(e) => setUMatricula(e.target.value)} />
                    </div>
                    <div>
                      <FLabel required>ID do cargo</FLabel>
                      <Input className={inputCls} placeholder="UUID do cargo" value={uCargo} onChange={(e) => setUCargo(e.target.value)} />
                    </div>
                    <div>
                      <FLabel>Data de admissão</FLabel>
                      <Input type="date" className={inputCls} value={uAdmissao} onChange={(e) => setUAdmissao(e.target.value)} />
                    </div>
                    <div>
                      <FLabel>Salário</FLabel>
                      <Input className={inputCls} placeholder="R$ 0,00" value={uSalario} onChange={(e) => setUSalario(e.target.value)} />
                    </div>
                  </Grid>
                )}

                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <Button type="submit" disabled={!uName||!uEmail||!uPwd||saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : <><UserPlus className="mr-2 h-4 w-4" />Criar usuário</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB PERMISSÕES ── */}
      {tab === "permissions" && (
        <form onSubmit={handleSavePermissions}>
          <div style={card}>
            <div style={cardHeader}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Shield style={{ width:17, height:17, color:"#7c3aed" }} />
              </div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", margin:0 }}>Permissões de acesso</p>
                <p style={{ fontSize:13, color:"#64748b", margin:"2px 0 0" }}>Ajuste perfis e acessos individuais por usuário.</p>
              </div>
            </div>

            <div style={{ ...cardBody, display:"flex", flexDirection:"column", gap:24 }}>
              <div>
                <FLabel>Selecionar usuário</FLabel>
                {loadingUsers
                  ? <div style={{ fontSize:13, color:"#94a3b8" }}>Carregando...</div>
                  : (
                    <select className={selectCls} value={selUser} onChange={(e) => setSelUser(e.target.value)}>
                      <option value="">Selecione um usuário</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.full_name||u.name||u.email} — {u.email}</option>)}
                    </select>
                  )
                }
              </div>

              {selUser && (
                <>
                  <Section title="Perfis">
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10 }}>
                      {ROLES.map((role) => {
                        const m = ROLE_META[role]; const on = pRoles.includes(role);
                        return (
                          <label key={role} style={{ display:"flex", flexDirection:"column", gap:6, padding:"12px 14px", borderRadius:10, border: on ? "2px solid #7c3aed" : "2px solid #e2e8f0", background: on ? "#faf5ff" : "#fff", cursor:"pointer" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", m.bg, m.text)}>{m.label}</span>
                              <input type="checkbox" style={{ width:14, height:14, accentColor:"#7c3aed" }} checked={on} onChange={() => setPRoles((p) => toggle(p, role))} />
                            </div>
                            <p style={{ fontSize:11, color:"#64748b", margin:0 }}>{m.desc}</p>
                          </label>
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="Permissões individuais">
                    <p style={{ fontSize:12, color:"#94a3b8", marginBottom:12 }}>Cinza = herdado do perfil (não editável). Use para acessos extras.</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:6 }}>
                      {ALL_PERMS.map((perm) => {
                        const inh = inherited.has(perm);
                        const chk = inh || pPerms.includes(perm);
                        return (
                          <label key={perm} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, border:"1px solid #e2e8f0", background: inh ? "#f8fafc" : "#fff", opacity: inh ? 0.65 : 1, cursor: inh ? "not-allowed" : "pointer" }}>
                            <input type="checkbox" style={{ width:13, height:13, accentColor:"#7c3aed" }} checked={chk} disabled={inh} onChange={() => setPPerms((p) => toggle(p, perm))} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:0 }}>{PERM_LABEL[perm]||perm}</p>
                              <p style={{ fontSize:10, color:"#94a3b8", margin:"2px 0 0", fontFamily:"monospace" }}>{perm}</p>
                            </div>
                            {inh && <span style={{ fontSize:9, padding:"2px 6px", background:"#e2e8f0", borderRadius:20, color:"#64748b", fontWeight:700, flexShrink:0 }}>HERDADO</span>}
                          </label>
                        );
                      })}
                    </div>
                  </Section>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0f172a", margin:0 }}>Usuário ativo</p>
                      <p style={{ fontSize:12, color:"#64748b", margin:"2px 0 0" }}>Desativar bloqueia o acesso sem excluir a conta</p>
                    </div>
                    <Switch checked={pActive} onCheckedChange={setPActive} />
                  </div>

                  <div style={{ display:"flex", justifyContent:"flex-end" }}>
                    <Button type="submit" disabled={!selUser||saving}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                        : <><CheckCircle2 className="mr-2 h-4 w-4" />Salvar permissões</>}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
