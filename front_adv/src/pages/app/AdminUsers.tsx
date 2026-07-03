import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CircleAlert,
  Copy,
  Info,
  KeyRound,
  MailPlus,
  RefreshCcw,
  ShieldCheck,
  UserCheck,
  UserCog,
} from "lucide-react";
import { api, apiRequest } from "@/integrations/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useScopedTenant } from "@/hooks/useScopedTenant";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { OfficeAdminShell } from "@/components/office-management/OfficeAdminShell";
import { getInheritedPermissionsForRoles, stripInheritedPermissions } from "@/lib/accessControl";
import { cn } from "@/lib/utils";

type Company = { id: string; name?: string };
type AdminUser = {
  id: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  tenant?: { id?: string; name?: string } | string | null;
  tenant_id?: string | null;
  roles?: string[];
  permissions?: string[];
};
type AccessOption = { code: string; label?: string };
type Employee = {
  id: string;
  full_name?: string;
  email?: string;
  user?: string | { id?: string } | null;
  user_id?: string | null;
  tenant?: { id?: string; name?: string } | string | null;
  tenant_id?: string | null;
};
type ClientRecord = {
  id: string;
  name?: string;
  email?: string;
  user?: string | { id?: string } | null;
  user_id?: string | null;
  portal_user?: string | { id?: string } | null;
  portal_user_id?: string | null;
  client_user?: string | { id?: string } | null;
  client_user_id?: string | null;
  tenant?: { id?: string; name?: string } | string | null;
  tenant_id?: string | null;
  company?: { id?: string; name?: string } | string | null;
  company_id?: string | null;
  empresa?: { id?: string; name?: string } | string | null;
  empresa_id?: string | null;
};
type LinkSnapshot = { employeeId: string; employeeTenantId: string; clientId: string; clientTenantId: string };
type AccessSnapshot = { roles: string[]; permissions: string[] };
type PermissionGroup = { key: string; label: string; description: string; items: AccessOption[] };

const CLIENT_LINK_FIELDS = ["user", "portal_user", "user_id", "portal_user_id", "client_user", "client_user_id"] as const;
const ACCESS_EDIT_PERMISSION_CODES = ["usuarios.permissoes.editar", "admin.manage_users", "admin.settings"] as const;
const PRIVILEGED_ROLE_CODES = ["OWNER", "ADMIN"] as const;

const ROLE_META: Record<string, { label: string; description: string }> = {
  OWNER: { label: "Proprietário", description: "Controle integral do tenant, com gestão institucional, usuários, permissões e regras críticas." },
  ADMIN: { label: "Administrador", description: "Gerencia equipes, usuários, configurações e o fluxo operacional do escritório." },
  LAWYER: { label: "Advogado", description: "Atua em processos, documentos, audiências e relacionamento jurídico com clientes." },
  ASSISTANT: { label: "Assistente", description: "Apoia a rotina operacional do escritório e acompanha a execução das tarefas jurídicas." },
  FINANCE: { label: "Financeiro", description: "Opera o módulo financeiro, cobranças, faturamento e controles de recebíveis." },
  CLIENT: { label: "Cliente", description: "Acesso restrito ao portal do cliente, com foco em documentos, mensagens e visibilidade do caso." },
};

const PERMISSION_GROUP_META: Record<string, { label: string; description: string }> = {
  process: { label: "Processos", description: "Casos, fases, partes e acompanhamento processual." },
  cause: { label: "Áreas e causas", description: "Classificação jurídica e áreas de atuação." },
  client: { label: "Clientes", description: "Cadastros, relacionamento e dados do cliente." },
  document: { label: "Documentos", description: "Central documental, anexos e arquivos do escritório." },
  hearing: { label: "Audiências", description: "Pauta, condução e histórico de audiências." },
  deadline: { label: "Prazos", description: "Compromissos, vencimentos e alertas processuais." },
  calendar: { label: "Agenda", description: "Eventos, compromissos e agenda jurídica." },
  finance: { label: "Financeiro", description: "Recebimentos, cobranças e faturamento." },
  employee: { label: "Funcionários", description: "Equipe interna, contatos e vínculos do escritório." },
  position: { label: "Cargos", description: "Papéis, estrutura interna e role system." },
  admin: { label: "Usuários e configurações", description: "Usuários, auditoria, segurança e governança." },
  portal: { label: "Portal do cliente", description: "Acesso externo do cliente e comunicação segura." },
  knowledge: { label: "Base de conhecimento", description: "Modelos, precedentes e materiais internos." },
  other: { label: "Outros", description: "Permissoes adicionais do tenant." },
};

function listFrom(payload: any, key?: string): any[] {
  if (key && Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;
  return [];
}

async function fetchAllTenantPages<T>(path: string, tenantId: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 40; page += 1) {
    const payload = await apiRequest<any>(path, {
      method: "GET",
      params: { page, tenant_id: tenantId },
      headers: { "X-Tenant-ID": tenantId },
    });
    const batch = listFrom(payload) as T[];
    items.push(...batch);
    if (!payload?.next || batch.length === 0 || items.length >= Number(payload?.count || items.length)) break;
  }
  return items;
}

function sameSet(a: string[], b: string[]) {
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function resolveId(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object" && value.id != null) return String(value.id);
  return "";
}

function getEntityUserId(record: any): string {
  return resolveId(record?.user) || resolveId(record?.user_id) || resolveId(record?.portal_user) || resolveId(record?.portal_user_id) || resolveId(record?.client_user) || resolveId(record?.client_user_id);
}

function getEntityTenantId(record: any): string {
  return resolveId(record?.tenant) || resolveId(record?.tenant_id) || resolveId(record?.company) || resolveId(record?.company_id) || resolveId(record?.empresa) || resolveId(record?.empresa_id);
}

function prettyAccess(code: string) {
  if (ROLE_META[code]) return ROLE_META[code].label;
  const [resource, action] = String(code || "").split(".");
  const resourceLabel: Record<string, string> = {
    cause: "Causas", process: "Processos", client: "Clientes", employee: "Funcionários", position: "Cargos",
    finance: "Financeiro", portal: "Portal do cliente", admin: "Administração", document: "Documentos",
    hearing: "Audiências", deadline: "Prazos", calendar: "Agenda", knowledge: "Base de conhecimento",
  };
  const actionLabel: Record<string, string> = {
    view: "Visualizar", create: "Criar", update: "Editar", delete: "Excluir", issue: "Emitir", invoice: "Faturar",
    manage_users: "Gerenciar usuários", audit: "Auditar", settings: "Configurações",
  };
  if (resource && action) return `${resourceLabel[resource] || resource}: ${actionLabel[action] || action}`;
  return code;
}

function initialsOf(name?: string | null) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "LF";
}

function isPrivilegedRole(roleCode: string) {
  return PRIVILEGED_ROLE_CODES.includes(String(roleCode || "").toUpperCase() as (typeof PRIVILEGED_ROLE_CODES)[number]);
}

function getPermissionGroupKey(code: string) {
  const resource = String(code || "").split(".")[0] || "other";
  return PERMISSION_GROUP_META[resource] ? resource : "other";
}

function buildPermissionGroups(options: AccessOption[]): PermissionGroup[] {
  const grouped = new Map<string, AccessOption[]>();
  options.forEach((option) => {
    const key = getPermissionGroupKey(option.code);
    const previous = grouped.get(key) || [];
    previous.push(option);
    grouped.set(key, previous);
  });
  const orderedKeys = Object.keys(PERMISSION_GROUP_META);
  return Array.from(grouped.entries())
    .map(([key, items]) => ({
      key,
      label: PERMISSION_GROUP_META[key]?.label || PERMISSION_GROUP_META.other.label,
      description: PERMISSION_GROUP_META[key]?.description || PERMISSION_GROUP_META.other.description,
      items: [...items].sort((left, right) => prettyAccess(left.code).localeCompare(prettyAccess(right.code), "pt-BR")),
    }))
    .sort((left, right) => orderedKeys.indexOf(left.key) - orderedKeys.indexOf(right.key));
}

export default function AdminUsers() {
  const { isSuperuser, hasRole, roles: authRoles, user: authUser } = useAuth();
  const { companies: scopedCompanies, companiesQuery: scopedCompaniesQuery, effectiveTenantId, selectedTenantId, setSelectedTenantId } = useScopedTenant("office-users");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("LAWYER");
  const [inviteResult, setInviteResult] = useState<{ invite_url?: string; token?: string } | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [originalLinks, setOriginalLinks] = useState<LinkSnapshot>({ employeeId: "", employeeTenantId: "", clientId: "", clientTenantId: "" });
  const [accessSnapshot, setAccessSnapshot] = useState<AccessSnapshot>({ roles: [], permissions: [] });
  const [copySourceUserId, setCopySourceUserId] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    tenant_id: "",
    linked_employee_id: "",
    linked_client_id: "",
    is_active: true,
    roles: [] as string[],
    permissions: [] as string[],
  });
  const usersQuery = useQuery({
    queryKey: ["admin-users-list", effectiveTenantId],
    queryFn: async () => await api.get<any>("/admin/users/", effectiveTenantId ? { tenant_id: effectiveTenantId } : undefined),
    enabled: !!effectiveTenantId || isSuperuser,
    retry: false,
  });
  const companiesQuery = useQuery({ queryKey: ["admin-users-companies"], queryFn: async () => await api.get<any>("/admin/companies/"), enabled: true, retry: false });
  const accessQuery = useQuery({ queryKey: ["admin-users-access"], queryFn: async () => await api.get<any>("/access-controls/"), enabled: true, retry: false });
  const employeesQuery = useQuery({ queryKey: ["admin-users-employees", form.tenant_id], queryFn: async () => await fetchAllTenantPages<Employee>("/employees/", form.tenant_id), enabled: !!form.tenant_id, retry: false });
  const clientsQuery = useQuery({ queryKey: ["admin-users-clients", form.tenant_id], queryFn: async () => await fetchAllTenantPages<ClientRecord>("/clients/", form.tenant_id), enabled: !!form.tenant_id, retry: false });

  const users = useMemo(() => listFrom(usersQuery.data, "users") as AdminUser[], [usersQuery.data]);
  const companies = useMemo(() => {
    const fromApi = listFrom(companiesQuery.data, "companies") as Company[];
    return fromApi.length ? fromApi : (scopedCompanies as Company[]);
  }, [companiesQuery.data, scopedCompanies]);
  const roles = useMemo(() => (listFrom(accessQuery.data, "access_controls") as AccessOption[]).filter((item) => item.code !== "SUPERUSER"), [accessQuery.data]);
  const permissions = useMemo(() => listFrom(accessQuery.data, "permissions") as AccessOption[], [accessQuery.data]);
  const permissionCodes = useMemo(() => permissions.map((item) => item.code), [permissions]);
  const permissionGroups = useMemo(() => buildPermissionGroups(permissions), [permissions]);
  const employees = useMemo(() => listFrom(employeesQuery.data) as Employee[], [employeesQuery.data]);
  const clients = useMemo(() => listFrom(clientsQuery.data) as ClientRecord[], [clientsQuery.data]);
  const currentUser = useMemo(() => users.find((user) => user.id === editingUserId) ?? null, [users, editingUserId]);
  const actorUserRecord = useMemo(() => users.find((user) => user.id === authUser?.id) ?? null, [users, authUser?.id]);
  const actorRoleCodes = useMemo(() => (Array.isArray(actorUserRecord?.roles) && actorUserRecord.roles.length ? actorUserRecord.roles : (authRoles as string[])), [actorUserRecord?.roles, authRoles]);
  const actorInheritedPermissions = useMemo(() => getInheritedPermissionsForRoles(actorRoleCodes, permissionCodes), [actorRoleCodes, permissionCodes]);
  const actorPermissionSet = useMemo(() => new Set<string>([...actorInheritedPermissions, ...((actorUserRecord?.permissions || []) as string[])]), [actorInheritedPermissions, actorUserRecord?.permissions]);
  const canManageAccess = useMemo(() => isSuperuser || hasRole("OWNER", "ADMIN") || ACCESS_EDIT_PERMISSION_CODES.some((code) => actorPermissionSet.has(code)), [actorPermissionSet, hasRole, isSuperuser]);
  const inheritedPermissions = useMemo(() => getInheritedPermissionsForRoles(form.roles, permissionCodes), [form.roles, permissionCodes]);
  const inheritedPermissionSet = useMemo(() => new Set(inheritedPermissions), [inheritedPermissions]);
  const snapshotInheritedPermissions = useMemo(() => getInheritedPermissionsForRoles(accessSnapshot.roles, permissionCodes), [accessSnapshot.roles, permissionCodes]);
  const snapshotEffectivePermissionSet = useMemo(() => new Set<string>([...snapshotInheritedPermissions, ...accessSnapshot.permissions]), [accessSnapshot.permissions, snapshotInheritedPermissions]);
  const currentEffectivePermissionSet = useMemo(() => new Set<string>([...inheritedPermissions, ...form.permissions]), [form.permissions, inheritedPermissions]);
  const isEditingBackendSuperuser = !!currentUser?.is_superuser;
  const requiresTenantMembership = !isEditingBackendSuperuser;
  const formCanSubmit = !!form.email.trim() && !!form.full_name.trim() && (!!editingUserId || !!form.password) && (!requiresTenantMembership || !!form.tenant_id);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const roleCodes = Array.isArray(user.roles) ? user.roles : [];
      const tenantId = resolveId(user.tenant) || resolveId(user.tenant_id);
      const matchesTenant = !effectiveTenantId || !tenantId || tenantId === effectiveTenantId;
      const matchesRole = roleFilter === "all" ? true : roleCodes.includes(roleFilter);
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? user.is_active !== false : user.is_active === false;
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || String(user.full_name || "").toLowerCase().includes(query) || String(user.email || "").toLowerCase().includes(query);
      return matchesTenant && matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, effectiveTenantId, roleFilter, statusFilter, search]);

  useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedUserId("");
      return;
    }
    if (!filteredUsers.some((user) => user.id === selectedUserId)) setSelectedUserId(filteredUsers[0].id);
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(() => filteredUsers.find((user) => user.id === selectedUserId) || null, [filteredUsers, selectedUserId]);
  const targetTenantId = form.tenant_id || resolveId(currentUser?.tenant) || resolveId(currentUser?.tenant_id) || effectiveTenantId || "";
  const isEditingSelf = !!editingUserId && editingUserId === authUser?.id;
  const formHasPrivilegedRole = useMemo(() => form.roles.some(isPrivilegedRole), [form.roles]);
  const snapshotHadPrivilegedRole = useMemo(() => accessSnapshot.roles.some(isPrivilegedRole), [accessSnapshot.roles]);
  const otherPrivilegedUsersCount = useMemo(() => {
    if (!targetTenantId) return 0;
    return users.filter((user) => {
      if (user.id === editingUserId) return false;
      if (user.is_active === false) return false;
      const tenantId = resolveId(user.tenant) || resolveId(user.tenant_id) || "";
      if (tenantId && tenantId !== targetTenantId) return false;
      return (Array.isArray(user.roles) ? user.roles : []).some(isPrivilegedRole);
    }).length;
  }, [editingUserId, targetTenantId, users]);
  const selfAdminLockRisk = isEditingSelf && !currentUser?.is_superuser && snapshotHadPrivilegedRole && !formHasPrivilegedRole;
  const tenantAdminRetentionRisk = !!editingUserId && !currentUser?.is_superuser && snapshotHadPrivilegedRole && otherPrivilegedUsersCount === 0 && (!form.is_active || !formHasPrivilegedRole);
  const accessProfileChanged = !sameSet(form.roles, accessSnapshot.roles) || !sameSet(form.permissions, accessSnapshot.permissions);
  const selectedRoleLabels = useMemo(() => form.roles.map((role) => ROLE_META[role]?.label || prettyAccess(role)), [form.roles]);
  const copyableUsers = useMemo(() => users.filter((user) => user.id !== editingUserId).sort((left, right) => String(left.full_name || left.email || "").localeCompare(String(right.full_name || right.email || ""), "pt-BR")), [editingUserId, users]);
  const changedPermissionCount = useMemo(() => permissionCodes.filter((code) => snapshotEffectivePermissionSet.has(code) !== currentEffectivePermissionSet.has(code)).length, [currentEffectivePermissionSet, permissionCodes, snapshotEffectivePermissionSet]);

  const resetForm = () => {
    setEditingUserId(null);
    setOriginalLinks({ employeeId: "", employeeTenantId: "", clientId: "", clientTenantId: "" });
    setAccessSnapshot({ roles: [], permissions: [] });
    setCopySourceUserId("");
    setForm({ email: "", password: "", full_name: "", tenant_id: effectiveTenantId || "", linked_employee_id: "", linked_client_id: "", is_active: true, roles: [], permissions: [] });
  };

  const patchEmployeeLink = async (employeeId: string, userId: string | null, tenantId: string) => {
    if (!tenantId) throw new Error("Empresa obrigatoria para atualizar o vinculo com funcionario.");
    await apiRequest(`/employees/${employeeId}/`, { method: "PATCH", body: { user: userId }, headers: { "X-Tenant-ID": tenantId } });
  };

  const patchClientLink = async (clientId: string, userId: string | null, tenantId: string) => {
    if (!tenantId) throw new Error("Empresa obrigatoria para atualizar o vinculo com cliente.");
    const client = clients.find((item) => item.id === clientId);
    const preferredField = CLIENT_LINK_FIELDS.find((field) => field in (client ?? {})) ?? "user";
    const orderedFields = [preferredField, ...CLIENT_LINK_FIELDS.filter((field) => field !== preferredField)];
    let lastError: any = null;
    for (const field of orderedFields) {
      try {
        await apiRequest(`/clients/${clientId}/`, { method: "PATCH", body: { [field]: userId }, headers: { "X-Tenant-ID": tenantId } });
        return;
      } catch (error: any) {
        lastError = error;
        if (error?.status && ![400, 422].includes(Number(error.status))) throw error;
      }
    }
    throw lastError;
  };

  const syncLinksIfNeeded = async (userId: string) => {
    if (originalLinks.employeeId && originalLinks.employeeId !== form.linked_employee_id) await patchEmployeeLink(originalLinks.employeeId, null, originalLinks.employeeTenantId || form.tenant_id);
    if (form.linked_employee_id && form.linked_employee_id !== originalLinks.employeeId) await patchEmployeeLink(form.linked_employee_id, userId, form.tenant_id);
    if (originalLinks.clientId && originalLinks.clientId !== form.linked_client_id) await patchClientLink(originalLinks.clientId, null, originalLinks.clientTenantId || form.tenant_id);
    if (form.linked_client_id && form.linked_client_id !== originalLinks.clientId) await patchClientLink(form.linked_client_id, userId, form.tenant_id);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const safeRoles = canManageAccess ? form.roles : [];
      const safePermissions = canManageAccess ? form.permissions : [];
      const created = await api.post<any>("/admin/users/", { email: form.email, password: form.password, full_name: form.full_name, tenant_id: form.tenant_id || undefined, is_active: form.is_active, roles: safeRoles, permissions: safePermissions });
      let linkError: any = null;
      if (created?.id) {
        try { await syncLinksIfNeeded(created.id); } catch (error: any) { linkError = error; }
      }
      return { created, linkError };
    },
    onSuccess: ({ linkError }) => {
      toast({ title: linkError ? "Usuário cadastrado, mas o vínculo não foi concluído." : "Usuário cadastrado com sucesso.", description: linkError?.message || undefined, variant: linkError ? "destructive" : undefined });
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-employees"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-clients"] });
    },
    onError: (error: any) => toast({ title: "Erro ao cadastrar usuário", description: error?.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingUserId) throw new Error("Usuário inválido");
      const safeRoles = canManageAccess ? form.roles : (currentUser?.roles || []);
      const safePermissions = canManageAccess ? form.permissions : (currentUser?.permissions || []);
      const payload: any = { email: form.email, full_name: form.full_name, tenant_id: form.tenant_id || undefined, is_active: form.is_active, roles: safeRoles, permissions: safePermissions };
      if (form.password) payload.password = form.password;
      await api.put(`/admin/users/${editingUserId}/`, payload);
      let linkError: any = null;
      try { await syncLinksIfNeeded(editingUserId); } catch (error: any) { linkError = error; }
      return { linkError };
    },
    onSuccess: ({ linkError }) => {
      toast({ title: linkError ? "Usuário atualizado, mas o vínculo não foi concluído." : "Usuário atualizado com sucesso.", description: linkError?.message || undefined, variant: linkError ? "destructive" : undefined });
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-employees"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-clients"] });
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar usuário", description: error?.message, variant: "destructive" }),
  });
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const tenantId = effectiveTenantId;
      if (!tenantId) throw new Error('Selecione um escritório para enviar o convite.');
      return api.post<{ invite_url?: string; token?: string }>(`/tenants/${tenantId}/invite/`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
    },
    onSuccess: (data: any) => {
      setInviteResult(data ?? {});
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (error: any) => toast({ title: 'Erro ao enviar convite', description: error?.message, variant: 'destructive' }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const target = users.find((user) => user.id === userId);
      if (!target) throw new Error("Usuário não encontrado.");
      const targetRoles = Array.isArray(target.roles) ? target.roles : [];
      const targetTenant = resolveId(target.tenant) || resolveId(target.tenant_id) || effectiveTenantId || "";
      if (!isActive && targetRoles.some(isPrivilegedRole)) {
        if (authUser?.id === userId && !target.is_superuser) throw new Error("Você não pode desativar o próprio acesso administrativo.");
        const remainingPrivilegedUsers = users.filter((user) => {
          if (user.id === userId) return false;
          if (user.is_active === false) return false;
          const tenantId = resolveId(user.tenant) || resolveId(user.tenant_id) || "";
          if (targetTenant && tenantId && tenantId !== targetTenant) return false;
          return (Array.isArray(user.roles) ? user.roles : []).some(isPrivilegedRole);
        }).length;
        if (!target.is_superuser && remainingPrivilegedUsers === 0) throw new Error("Não é possível deixar o escritório sem nenhum usuário com perfil administrativo.");
      }
      await api.put(`/admin/users/${userId}/`, { email: target.email, full_name: target.full_name, tenant_id: targetTenant || undefined, is_active: isActive, roles: targetRoles, permissions: target.permissions || [] });
    },
    onSuccess: () => {
      toast({ title: "Status do usuário atualizado." });
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar status", description: error?.message, variant: "destructive" }),
  });

  const startCreate = () => { resetForm(); setOpen(true); };

  const startEdit = (user: AdminUser) => {
    setEditingUserId(user.id);
    setOriginalLinks({ employeeId: "", employeeTenantId: "", clientId: "", clientTenantId: "" });
    setAccessSnapshot({ roles: Array.isArray(user.roles) ? [...user.roles] : [], permissions: [...(user.permissions || [])] });
    setCopySourceUserId("");
    setForm({
      email: user.email || "",
      password: "",
      full_name: user.full_name || "",
      tenant_id: resolveId(user.tenant) || resolveId(user.tenant_id) || "",
      linked_employee_id: "",
      linked_client_id: "",
      is_active: !!user.is_active,
      roles: Array.isArray(user.roles) ? [...user.roles] : [],
      permissions: [...(user.permissions || [])],
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!editingUserId || !currentUser || !form.tenant_id) return;
    const linkedEmployee = employees.find((employee) => getEntityUserId(employee) === editingUserId);
    const linkedClient = clients.find((client) => getEntityUserId(client) === editingUserId);
    const linkedEmployeeId = linkedEmployee?.id || "";
    const linkedClientId = linkedClient?.id || "";

    setForm((previous) => {
      if (previous.linked_employee_id === linkedEmployeeId && previous.linked_client_id === linkedClientId) return previous;
      return { ...previous, linked_employee_id: linkedEmployeeId, linked_client_id: linkedClientId };
    });

    setOriginalLinks((previous) => {
      const linkedEmployeeTenantId = getEntityTenantId(linkedEmployee) || form.tenant_id;
      const linkedClientTenantId = getEntityTenantId(linkedClient) || form.tenant_id;
      if (previous.employeeId === linkedEmployeeId && previous.clientId === linkedClientId && previous.employeeTenantId === linkedEmployeeTenantId && previous.clientTenantId === linkedClientTenantId) {
        return previous;
      }
      return { employeeId: linkedEmployeeId, employeeTenantId: linkedEmployeeTenantId, clientId: linkedClientId, clientTenantId: linkedClientTenantId };
    });
  }, [editingUserId, currentUser, employees, clients, form.tenant_id]);

  useEffect(() => {
    setForm((previous) => {
      const nextPermissions = stripInheritedPermissions(previous.permissions, getInheritedPermissionsForRoles(previous.roles, permissionCodes));
      return sameSet(previous.permissions, nextPermissions) ? previous : { ...previous, permissions: nextPermissions };
    });
  }, [permissionCodes]);

  const dialogSaveDisabled = !formCanSubmit || createMutation.isPending || updateMutation.isPending || selfAdminLockRisk || tenantAdminRetentionRisk;

  const handleRoleCheckedChange = (roleCode: string, checked: boolean) => {
    if (!canManageAccess) return;
    setForm((previous) => {
      const alreadySelected = previous.roles.includes(roleCode);
      if (checked === alreadySelected) return previous;
      return { ...previous, roles: checked ? [...previous.roles, roleCode] : previous.roles.filter((role) => role !== roleCode) };
    });
  };

  const handlePermissionCheckedChange = (permissionCode: string, checked: boolean) => {
    if (!canManageAccess || inheritedPermissionSet.has(permissionCode)) return;
    setForm((previous) => {
      const alreadySelected = previous.permissions.includes(permissionCode);
      if (checked === alreadySelected) return previous;
      return { ...previous, permissions: checked ? [...previous.permissions, permissionCode] : previous.permissions.filter((code) => code !== permissionCode) };
    });
  };

  const handleSelectAllModulePermissions = (group: PermissionGroup) => {
    if (!canManageAccess) return;
    const editableCodes = group.items.map((item) => item.code).filter((code) => !inheritedPermissionSet.has(code));
    setForm((previous) => ({ ...previous, permissions: [...new Set([...previous.permissions, ...editableCodes])] }));
  };

  const handleClearModulePermissions = (group: PermissionGroup) => {
    if (!canManageAccess) return;
    const groupCodes = new Set(group.items.map((item) => item.code));
    setForm((previous) => ({ ...previous, permissions: previous.permissions.filter((code) => !groupCodes.has(code)) }));
  };

  const handleResetToRoleDefaults = () => {
    if (!canManageAccess || !form.permissions.length) return;
    if (!window.confirm("Deseja remover todas as permissões extras e voltar ao padrão herdado dos perfis selecionados?")) return;
    setForm((previous) => ({ ...previous, permissions: [] }));
  };

  const handleCopyAccessFromUser = () => {
    if (!canManageAccess || !copySourceUserId) return;
    const sourceUser = users.find((user) => user.id === copySourceUserId);
    if (!sourceUser) return;
    if (!window.confirm(`Copiar perfis e permissões extras de ${sourceUser.full_name || sourceUser.email || "outro usuário"}?`)) return;
    setForm((previous) => ({ ...previous, roles: Array.isArray(sourceUser.roles) ? [...sourceUser.roles] : [], permissions: [...(sourceUser.permissions || [])] }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canManageAccess && !form.roles.length) {
      toast({ title: "Selecione ao menos um perfil.", description: "Todo usuário precisa de pelo menos um role para acessar o sistema com segurança.", variant: "destructive" });
      return;
    }
    if (selfAdminLockRisk) {
      toast({ title: "Acesso protegido", description: "Você não pode remover do próprio cadastro o último perfil administrativo.", variant: "destructive" });
      return;
    }
    if (tenantAdminRetentionRisk) {
      toast({ title: "Operação bloqueada", description: "Mantenha ao menos um usuário administrativo ativo no escritório antes de salvar esta alteração.", variant: "destructive" });
      return;
    }
    const previousTenantId = resolveId(currentUser?.tenant) || resolveId(currentUser?.tenant_id);
    const criticalAccessChange = !!editingUserId && (accessProfileChanged || (currentUser?.is_active ?? true) !== form.is_active || previousTenantId !== form.tenant_id);
    if (criticalAccessChange) {
      const confirmed = window.confirm("Esta alteração mexe em perfis, permissões ou status de acesso. Deseja continuar?");
      if (!confirmed) return;
    }
    editingUserId ? updateMutation.mutate() : createMutation.mutate();
  };

  return (
    <OfficeAdminShell
      section="users"
      title="Usuários"
      description="Controle acessos, papéis administrativos, vínculos com funcionários e permissões extras do tenant."
      action={{ label: "Novo usuário", onClick: startCreate }}
      metrics={[
        { label: "Usuários ativos", value: String(users.filter((user) => user.is_active !== false).length), helper: "Contas internas habilitadas no tenant.", icon: UserCheck },
        { label: "Perfis administrativos", value: String(users.filter((user) => (Array.isArray(user.roles) ? user.roles : []).some(isPrivilegedRole)).length), helper: "Usuários com papel de gestão do escritório.", icon: ShieldCheck },
        { label: "Clientes com portal", value: String(users.filter((user) => (Array.isArray(user.roles) ? user.roles : []).includes("CLIENT")).length), helper: "Perfis ligados ao portal do cliente.", icon: UserCog },
        { label: "Permissoes disponiveis", value: String(permissionCodes.length), helper: "Escopos de acesso mapeados no sistema.", icon: KeyRound },
      ]}
      headerAside={isSuperuser ? (
        <div className="space-y-1">
          <Label>Escritório ativo</Label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)} disabled={scopedCompaniesQuery.isLoading}>
            <option value="">{scopedCompaniesQuery.isLoading ? "Carregando escritórios..." : "Selecione o escritório"}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name || company.id}</option>)}
          </select>
        </div>
      ) : null}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Gestão de usuários</CardTitle>
                {(isSuperuser || hasRole('OWNER', 'ADMIN')) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => { setInviteEmail(''); setInviteRole('LAWYER'); setInviteResult(null); setInviteOpen(true); }}
                  >
                    <MailPlus className="h-4 w-4" />
                    Convidar
                  </Button>
                )}
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                <Input placeholder="Buscar por nome ou e-mail" value={search} onChange={(event) => setSearch(event.target.value)} />
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="all">Todos os perfis</option>
                  {roles.map((role) => <option key={role.code} value={role.code}>{prettyAccess(role.code)}</option>)}
                </select>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!filteredUsers.length ? <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p> : null}
              {filteredUsers.map((user) => {
                const tenantName = (typeof user.tenant === "object" ? user.tenant?.name : resolveId(user.tenant)) || resolveId(user.tenant_id) || "Sem empresa";
                return (
                  <div
                    key={user.id}
                    className={cn("cursor-pointer rounded-xl border p-4 transition-colors", selectedUserId === user.id ? "border-primary bg-muted/40" : "hover:border-primary/40")}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback>{initialsOf(user.full_name || user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || user.email || "Sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{user.email || "-"} · {tenantName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.is_active !== false ? "Ativo" : "Inativo"}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            const nextIsActive = user.is_active === false;
                            if (!nextIsActive) {
                              const confirmed = window.confirm(`Deseja desativar o acesso de ${user.full_name || user.email || "este usuário"}?`);
                              if (!confirmed) return;
                            }
                            toggleStatusMutation.mutate({ userId: user.id, isActive: nextIsActive });
                          }}
                        >
                          {user.is_active !== false ? "Desativar" : "Ativar"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); startEdit(user); }}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo do usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedUser ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback>{initialsOf(selectedUser.full_name || selectedUser.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedUser.full_name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email || "-"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selectedUser.roles) ? selectedUser.roles : []).map((role) => <Badge key={role} variant="secondary">{prettyAccess(role)}</Badge>)}
                  </div>
                  <p className="text-sm text-muted-foreground">Permissoes extras: {selectedUser.permissions?.length || 0}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione um usuário para ver o resumo rápido.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="border-b px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <DialogTitle>{editingUserId ? "Editar usuário" : "Novo usuário"}</DialogTitle>
                  <p className="max-w-3xl text-sm text-muted-foreground">Organize dados básicos, vínculos operacionais e o controle de acesso deste usuário dentro do tenant.</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={form.is_active ? "default" : "outline"}>{form.is_active ? "Ativo" : "Inativo"}</Badge>
                    {(selectedRoleLabels.length ? selectedRoleLabels : ["Sem perfil definido"]).map((label) => <Badge key={label} variant="secondary">{label}</Badge>)}
                    <Badge variant="outline">{form.permissions.length} permissão(ões) extra(s)</Badge>
                  </div>
                </div>
                <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                  <p className="font-medium">Modelo de acesso</p>
                  <p className="mt-1 max-w-sm text-muted-foreground">Perfis definem o padrão. Permissões extras refinam o acesso de forma pontual e controlada.</p>
                </div>
              </div>
            </DialogHeader>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base">Dados básicos</CardTitle></CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div><Label>Nome</Label><Input value={form.full_name} onChange={(event) => setForm((previous) => ({ ...previous, full_name: event.target.value }))} required /></div>
                        <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))} required /></div>
                        <div className="md:col-span-2"><Label>Senha {editingUserId ? "(deixe em branco para manter)" : ""}</Label><Input type="password" value={form.password} onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))} required={!editingUserId} /></div>
                        <div className="md:col-span-2 rounded-2xl border p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1"><p className="font-medium">Status de acesso</p><p className="text-sm text-muted-foreground">Desative apenas quando quiser bloquear o login sem remover o cadastro do usuário.</p></div>
                            <label className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(value) => setForm((previous) => ({ ...previous, is_active: value }))} /><span className="text-sm font-medium">{form.is_active ? "Usuário ativo" : "Usuário inativo"}</span></label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base">Resumo operacional</CardTitle></CardHeader>
                      <CardContent className="space-y-4 text-sm">
                        <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tenant</p><p className="mt-2 font-medium">{companies.find((company) => company.id === form.tenant_id)?.name || (form.tenant_id ? form.tenant_id : "Não definido")}</p></div>
                        <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vínculos ativos</p><div className="mt-3 space-y-2 text-muted-foreground"><p>Funcionário: {employees.find((employee) => employee.id === form.linked_employee_id)?.full_name || "Não vinculado"}</p><p>Cliente portal: {clients.find((client) => client.id === form.linked_client_id)?.name || "Não vinculado"}</p></div></div>
                        <div className="rounded-2xl border p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Acesso atual</p><p className="mt-2 text-muted-foreground">{selectedRoleLabels.length ? `Perfis combinados: ${selectedRoleLabels.join(", ")}` : "Nenhum perfil selecionado ainda."}</p><p className="mt-2 text-muted-foreground">{form.permissions.length ? `${form.permissions.length} permissão(ões) extra(s) configurada(s).` : "Sem overrides extras no momento."}</p></div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" />Vínculos do usuário</CardTitle></CardHeader>
                    <CardContent className="grid gap-4 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Empresa</Label>
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.tenant_id} onChange={(event) => setForm((previous) => ({ ...previous, tenant_id: event.target.value, linked_employee_id: "", linked_client_id: "" }))}>
                          <option value="">{isEditingBackendSuperuser ? "Sem vínculo com escritório" : "Selecione"}</option>
                          {companies.map((company) => <option key={company.id} value={company.id}>{company.name || company.id}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Funcionário vinculado</Label>
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.linked_employee_id} onChange={(event) => { const value = event.target.value; setForm((previous) => ({ ...previous, linked_employee_id: value, linked_client_id: value ? "" : previous.linked_client_id })); }} disabled={!form.tenant_id || employeesQuery.isLoading}>
                          <option value="">{!form.tenant_id ? "Selecione a empresa primeiro" : employeesQuery.isLoading ? "Carregando funcionários..." : "Sem vínculo"}</option>
                          {employees.map((employee) => <option key={employee.id} value={employee.id}>{[employee.full_name || employee.id, employee.email].filter(Boolean).join(" - ")}</option>)}
                        </select>
                        <p className="text-xs text-muted-foreground">Use este vínculo para consolidar agenda, produtividade e atribuições internas.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Cliente portal</Label>
                        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.linked_client_id} onChange={(event) => { const value = event.target.value; setForm((previous) => ({ ...previous, linked_client_id: value, linked_employee_id: value ? "" : previous.linked_employee_id })); }} disabled={!form.tenant_id || clientsQuery.isLoading}>
                          <option value="">{!form.tenant_id ? "Selecione a empresa primeiro" : clientsQuery.isLoading ? "Carregando clientes..." : "Sem vínculo"}</option>
                          {clients.map((client) => <option key={client.id} value={client.id}>{[client.name || client.id, client.email].filter(Boolean).join(" - ")}</option>)}
                        </select>
                        <p className="text-xs text-muted-foreground">Vincule quando este cadastro for usado no portal do cliente.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {!canManageAccess ? <Alert><CircleAlert className="h-4 w-4" /><AlertTitle>Edição de acesso bloqueada</AlertTitle><AlertDescription>Você não tem permissão para editar perfis e permissões deste usuário. Apenas proprietário, administrador ou quem tenha a permissão específica pode alterar acessos.</AlertDescription></Alert> : null}
                  {selfAdminLockRisk ? <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>Proteção do próprio acesso</AlertTitle><AlertDescription>O seu cadastro não pode perder o último perfil administrativo enquanto esta conta estiver em uso.</AlertDescription></Alert> : null}
                  {tenantAdminRetentionRisk ? <Alert variant="destructive"><CircleAlert className="h-4 w-4" /><AlertTitle>Tenant precisa de um administrador</AlertTitle><AlertDescription>Antes de inativar ou remover este perfil administrativo, mantenha outro usuário com perfil de proprietário ou administrador ativo no escritório.</AlertDescription></Alert> : null}

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Perfis (roles)</CardTitle>
                        <p className="text-sm text-muted-foreground">É permitido combinar mais de um perfil. O acesso final considera a união das permissões herdadas com as permissões extras do usuário.</p>
                      </CardHeader>
                      <CardContent>
                        <TooltipProvider delayDuration={120}>
                          <div className="space-y-2">
                            {roles.map((role) => {
                              const checked = form.roles.includes(role.code);
                              const changed = accessSnapshot.roles.includes(role.code) !== checked;
                              return (
                                <label key={role.code} className={cn("flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-4 transition-colors", checked ? "border-primary/50 bg-primary/5" : "hover:border-primary/30", changed ? "shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]" : "", !canManageAccess ? "cursor-not-allowed opacity-75" : "")}>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Checkbox checked={checked} onCheckedChange={(value) => handleRoleCheckedChange(role.code, value === true)} disabled={!canManageAccess} />
                                      <span className="font-medium">{ROLE_META[role.code]?.label || prettyAccess(role.code)}</span>
                                      {changed ? <Badge variant="secondary">Alterado</Badge> : null}
                                      <Tooltip>
                                        <TooltipTrigger asChild><button type="button" className="text-muted-foreground"><Info className="h-4 w-4" /></button></TooltipTrigger>
                                        <TooltipContent className="max-w-xs">{ROLE_META[role.code]?.description || role.label || prettyAccess(role.code)}</TooltipContent>
                                      </Tooltip>
                                    </div>
                                    <p className="pl-6 text-sm text-muted-foreground">{ROLE_META[role.code]?.description || role.label || prettyAccess(role.code)}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </TooltipProvider>
                      </CardContent>
                    </Card>

                    <Card className="flex min-h-0 flex-col">
                      <CardHeader className="space-y-3 pb-3">
                        <div>
                          <CardTitle className="text-base">Permissões herdadas e extras</CardTitle>
                          <p className="text-sm text-muted-foreground">As permissões herdadas aparecem como bloqueadas. Use overrides para refinar o acesso além do padrão do perfil.</p>
                        </div>
                        <div className="grid gap-3 rounded-2xl border bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={copySourceUserId} onChange={(event) => setCopySourceUserId(event.target.value)} disabled={!canManageAccess}>
                            <option value="">Copiar permissões de outro usuário</option>
                            {copyableUsers.map((user) => <option key={user.id} value={user.id}>{user.full_name || user.email || user.id}</option>)}
                          </select>
                          <Button type="button" variant="outline" className="gap-2" onClick={handleCopyAccessFromUser} disabled={!canManageAccess || !copySourceUserId}><Copy className="h-4 w-4" />Copiar</Button>
                          <Button type="button" variant="ghost" className="gap-2" onClick={handleResetToRoleDefaults} disabled={!canManageAccess || !form.permissions.length}><RefreshCcw className="h-4 w-4" />Resetar</Button>
                        </div>
                      </CardHeader>
                      <CardContent className="min-h-0 flex-1 space-y-4">
                        {selectedRoleLabels.length ? <div className="rounded-2xl border p-4"><p className="text-sm font-medium">Permissoes herdadas de {selectedRoleLabels.join(", ")}</p><div className="mt-3 flex flex-wrap gap-2">{inheritedPermissions.map((code) => <Badge key={code} variant="outline">{prettyAccess(code)}</Badge>)}</div></div> : null}
                        <ScrollArea className="h-[420px] pr-4">
                          <div className="space-y-4">
                            {permissionGroups.map((group) => {
                              const groupChanged = group.items.some((item) => snapshotEffectivePermissionSet.has(item.code) !== currentEffectivePermissionSet.has(item.code));
                              const editableItems = group.items.filter((item) => !inheritedPermissionSet.has(item.code));
                              return (
                                <div key={group.key} className={cn("rounded-2xl border p-4 transition-colors", groupChanged ? "border-primary/40 bg-primary/5" : "")}>
                                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-1"><p className="font-medium">{group.label}</p><p className="text-sm text-muted-foreground">{group.description}</p></div>
                                    <div className="flex flex-wrap gap-2">
                                      <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAllModulePermissions(group)} disabled={!canManageAccess || !editableItems.length}>Selecionar tudo</Button>
                                      <Button type="button" size="sm" variant="ghost" onClick={() => handleClearModulePermissions(group)} disabled={!canManageAccess || !editableItems.length}>Limpar</Button>
                                    </div>
                                  </div>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    {group.items.map((permission) => {
                                      const inherited = inheritedPermissionSet.has(permission.code);
                                      const selected = inherited || form.permissions.includes(permission.code);
                                      const changed = snapshotEffectivePermissionSet.has(permission.code) !== currentEffectivePermissionSet.has(permission.code);
                                      const explicitExtra = form.permissions.includes(permission.code);
                                      return (
                                        <label key={permission.code} className={cn("flex items-start justify-between gap-3 rounded-xl border px-3 py-3 transition-colors", selected ? "border-primary/40 bg-background" : "bg-background/70", changed ? "shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]" : "", !canManageAccess ? "opacity-80" : "")}>
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <Checkbox checked={selected} disabled={!canManageAccess || inherited} onCheckedChange={(value) => handlePermissionCheckedChange(permission.code, value === true)} />
                                              <span className="font-medium">{prettyAccess(permission.code)}</span>
                                            </div>
                                            <div className="pl-6"><div className="flex flex-wrap gap-2">{inherited ? <Badge variant="secondary">Herdada</Badge> : null}{explicitExtra ? <Badge variant="outline">Extra</Badge> : null}{changed ? <Badge variant="outline">Alterada</Badge> : null}</div></div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">{accessProfileChanged ? `${selectedRoleLabels.length || 0} perfil(is) e ${changedPermissionCount} permissão(ões) com alteração pendente.` : "Nenhuma alteração de acesso pendente neste momento."}</div>
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={dialogSaveDisabled}>{createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingUserId ? "Salvar alterações" : "Criar usuário"}</Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) { setInviteOpen(false); setInviteResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          {inviteResult ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Convite enviado!</p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                  O link foi enviado para <strong>{inviteEmail}</strong>.
                </p>
              </div>
              {(inviteResult.invite_url || inviteResult.token) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {inviteResult.invite_url ? 'Link do convite (copie se precisar enviar manualmente)' : 'Token do convite'}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={inviteResult.invite_url || inviteResult.token || ''}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon" aria-label="Duplicar"
                      onClick={() => navigator.clipboard.writeText(inviteResult!.invite_url || inviteResult!.token || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => { setInviteOpen(false); setInviteResult(null); }}>Fechar</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid gap-1.5">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuário@exemplo.com"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Perfil inicial</Label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>{prettyAccess(r.code)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => inviteMutation.mutate()}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  className="gap-2"
                >
                  <MailPlus className="h-4 w-4" />
                  {inviteMutation.isPending ? 'Enviando...' : 'Enviar convite'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OfficeAdminShell>
  );
}
