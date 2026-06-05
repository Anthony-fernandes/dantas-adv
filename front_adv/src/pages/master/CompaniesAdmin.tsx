import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Building2, Loader2, Shield, UserPlus } from "lucide-react";
import { api, Paginated } from "@/integrations/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createEmployeeRecord } from "@/services/employeeService";
import { maskCEP, maskCNPJ, maskPhoneBR, maskUF } from "@/lib/masks";
import { useAuth } from "@/contexts/AuthContext";
import { getInheritedPermissionsForRoles, stripInheritedPermissions } from "@/lib/accessControl";

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

const AVAILABLE_PERMISSIONS = [
  "process.view",
  "process.create",
  "process.update",
  "process.delete",
  "finance.view",
  "finance.create",
  "finance.issue",
  "finance.invoice",
  "client.view",
  "client.create",
  "client.update",
  "client.delete",
  "admin.manage_users",
  "admin.audit",
  "admin.settings",
  "knowledge.view",
  "knowledge.create",
  "portal.view",
];

const BR_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

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
    return Object.entries(raw)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([name]) => String(name).toUpperCase());
  }
  return [];
}

function sameItems(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
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

  // Aba: empresa
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

  // Aba: usuario
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

  // Aba: permissoes
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

  useEffect(() => {
    void Promise.all([loadCompanies(), loadUsers()]);
  }, [loadCompanies, loadUsers]);

  const selectedUser = useMemo(
    () => users.find((u) => String(u.id) === String(selectedUserId)) ?? null,
    [users, selectedUserId]
  );
  const primaryCompany = useMemo(() => companies[0] ?? null, [companies]);
  const inheritedPermissionList = useMemo(
    () => getInheritedPermissionsForRoles(permissionRoles, AVAILABLE_PERMISSIONS),
    [permissionRoles]
  );
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
  const userEmployeeCanSave =
    !userLinkEmployee ||
    (!!userCompanyId && !!userEmployeeCargoId.trim());
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

  const resetCompanyForm = () => {
    setTenantName("");
    setTenantCnpj("");
    setTenantEmail("");
    setTenantPhone("");
    setTenantSlug("");
    setTenantLegalName("");
    setTenantLogoUrl("");
    setTenantZipCode("");
    setTenantState("");
    setTenantCity("");
    setTenantAddress("");
  };

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
    setUserEmail("");
    setUserPassword("");
    setUserFullName("");
    setUserCompanyId("");
    setUserRoles(["ADMIN"]);
    setUserLinkEmployee(true);
    setUserEmployeeMatricula("");
    setUserEmployeeCargoId("");
    setUserEmployeeDataAdmissao("");
    setUserEmployeeSalario("");
    setUserEmployeeStatus("ATIVO");
    setUserEmployeeNotes("");
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
        await api.post("/admin/companies/", {
          tenant: tenantPayload,
          admin: {
            email: adminEmail,
            full_name: adminFullName,
          },
        });
        toast.success("Empresa cadastrada com sucesso");
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
          toast.warning("Usuário criado, mas o funcionário não foi cadastrado. Verifique tenant e cargo.");
        }
      }

      toast.success("Usuário cadastrado com sucesso");
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
      const payload = {
        roles: permissionRoles,
        permissions: permissionList,
        is_active: permissionActive,
      };

      await api.put(`/admin/users/${selectedUserId}/`, payload);
      toast.success("Permissoes atualizadas com sucesso");
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar permissões");
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão Master</h1>
        <p className="text-sm text-muted-foreground">
          Configuração global da empresa.
        </p>
      </div>

      <Tabs value={visibleTab} className="space-y-4">

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {hasCompanies ? "Configuração da empresa" : "Cadastrar empresa"}
              </CardTitle>
              <CardDescription>
                {hasCompanies ? "Atualize os dados da empresa cadastrada." : "Informe os dados para criar empresa e administrador inicial."}
              </CardDescription>
              {!hasCompanies ? (
                <p className="text-sm text-amber-600">
                  Primeiro acesso detectado: cadastre a primeira empresa para liberar o restante do sistema.
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveCompany}>
                <div className="md:col-span-2 rounded-lg border p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados da empresa</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome da empresa</Label>
                      <Input
                        value={tenantName}
                        onChange={(e) => {
                          const next = e.target.value;
                          setTenantName(next);
                          setTenantSlug(slugify(next));
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input value={tenantCnpj} onChange={(e) => setTenantCnpj(maskCNPJ(e.target.value))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Razão social</Label>
                      <Input value={tenantLegalName} onChange={(e) => setTenantLegalName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo da empresa</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded border bg-muted overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
                        {tenantLogoUrl ? <img src={tenantLogoUrl} alt="Logo" className="h-full w-full object-cover" /> : "Sem logo"}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input type="file" accept="image/*" onChange={(e) => onLogoFileChange(e.target.files?.[0])} />
                        <p className="text-xs text-muted-foreground">Selecione uma imagem para a logo.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contatos</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email da empresa</Label>
                      <Input type="email" value={tenantEmail} onChange={(e) => setTenantEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input value={tenantPhone} onChange={(e) => setTenantPhone(maskPhoneBR(e.target.value))} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereço</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input value={tenantZipCode} onChange={(e) => setTenantZipCode(maskCEP(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <select
                        className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                        value={maskUF(tenantState)}
                        onChange={(e) => setTenantState(maskUF(e.target.value))}
                      >
                        <option value="">Selecione</option>
                        {BR_UFS.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input value={tenantCity} onChange={(e) => setTenantCity(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Endereço</Label>
                      <Input value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={!companyCanSave || savingCompany}>
                    {savingCompany ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      hasCompanies ? "Salvar alteracoes" : "Cadastrar empresa"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Cadastrar usuário
              </CardTitle>
              <CardDescription>
                Crie usuário e vincule roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={userFullName} onChange={(e) => setUserFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <p className="text-xs text-muted-foreground">
                    Usuários comuns precisam estar vinculados a uma empresa. Apenas o superuser criado no backend foge dessa regra.
                  </p>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={userCompanyId}
                    onChange={(e) => setUserCompanyId(e.target.value)}
                  >
                    <option value="">Selecione a empresa</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Roles</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {AVAILABLE_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                        <input
                          type="checkbox"
                          checked={userRoles.includes(role)}
                          onChange={() => setUserRoles((prev) => toggleItem(prev, role))}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="text-sm font-medium">Criar vínculo de funcionário</p>
                    <p className="text-xs text-muted-foreground">
                      Cria registro de funcionário com os dados abaixo e vincula ao usuário.
                    </p>
                  </div>
                  <Switch checked={userLinkEmployee} onCheckedChange={setUserLinkEmployee} />
                </div>

                {userLinkEmployee && (
                  <>
                    <div className="space-y-2">
                      <Label>Matricula</Label>
                      <Input value={userEmployeeMatricula} onChange={(e) => setUserEmployeeMatricula(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status funcional</Label>
                      <Input value={userEmployeeStatus} onChange={(e) => setUserEmployeeStatus(e.target.value)} placeholder="ATIVO" />
                    </div>
                    <div className="space-y-2">
                      <Label>ID do cargo</Label>
                      <Input value={userEmployeeCargoId} onChange={(e) => setUserEmployeeCargoId(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Data de admissao</Label>
                      <Input type="date" value={userEmployeeDataAdmissao} onChange={(e) => setUserEmployeeDataAdmissao(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Salario atual</Label>
                      <Input value={userEmployeeSalario} onChange={(e) => setUserEmployeeSalario(e.target.value)} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Observacao</Label>
                      <Input
                        value={userEmployeeNotes}
                        onChange={(e) => setUserEmployeeNotes(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={!userCanSave || savingUser}>
                    {savingUser ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "Cadastrar usuário"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Alterar permissões do usuário
              </CardTitle>
              <CardDescription>
                Selecione um usuário e ajuste roles/permissões.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleUpdatePermissions}>
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {(u.full_name || u.name || u.email) + " - " + u.email}
                      </option>
                    ))}
                  </select>
                  {loadingUsers && (
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Carregando usuários...
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_ROLES.map((role) => (
                        <label key={role} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <input
                            type="checkbox"
                            checked={permissionRoles.includes(role)}
                            onChange={() => setPermissionRoles((prev) => toggleItem(prev, role))}
                          />
                          {role}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Permissoes extras</Label>
                    <p className="text-xs text-muted-foreground">
                      As permissoes do cargo ja ficam marcadas automaticamente. Use esta coluna apenas para conceder extras.
                    </p>
                    <div className="max-h-60 overflow-auto space-y-2 border rounded-md p-2">
                      {AVAILABLE_PERMISSIONS.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={inheritedPermissionSet.has(perm) || permissionList.includes(perm)}
                            disabled={inheritedPermissionSet.has(perm)}
                            onChange={() => setPermissionList((prev) => toggleItem(prev, perm))}
                          />
                          <span className="font-mono text-xs">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="text-sm font-medium">Usuário ativo</p>
                      <p className="text-xs text-muted-foreground">Controla se pode acessar o sistema.</p>
                    </div>
                    <Switch checked={permissionActive} onCheckedChange={setPermissionActive} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!permissionsCanSave || savingPermissions}>
                    {savingPermissions ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar permissoes"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
