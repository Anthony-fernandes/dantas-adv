import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CheckCircle2, MoreHorizontal, Palette, Pencil, Shield, Trash2, Users } from "lucide-react";
import { api, apiGetAllPages, apiRequest } from "@/integrations/api/client";
import { maskMoneyBRInput, moneyToApiDecimal } from "@/lib/masks";
import { useScopedTenant } from "@/hooks/useScopedTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OfficeAdminShell } from "@/components/office-management/OfficeAdminShell";
import {
  createDefaultOfficeTenantMeta,
  defaultPositionMeta,
  loadOfficeTenantMeta,
  saveOfficeTenantMeta,
} from "./office-settings/storage";
import { DataTable, RowActions, type Column } from "@/components/ds";

type Position = {
  id: string;
  name?: string;
  salario_base?: string | number | null;
  is_active?: boolean;
  description?: string | null;
};

type Employee = {
  id: string;
  position?: string | null;
  position_name?: string | null;
  user?: string | { id?: string } | null;
  user_id?: string | null;
  full_name?: string;
  email?: string;
  is_active?: boolean;
};

type AccessOption = { code: string; label?: string };

type PositionForm = {
  name: string;
  salario_base: string;
  description: string;
  is_active: boolean;
  color: string;
  permissionCodes: string[];
};

const INITIAL_FORM: PositionForm = {
  name: "",
  salario_base: "",
  description: "",
  is_active: true,
  color: "#1d4ed8",
  permissionCodes: [],
};

function listFrom(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.permissions)) return payload.permissions;
  return [];
}

function prettyPermission(code: string) {
  const [resource, action] = String(code || "").split(".");
  const resourceLabel: Record<string, string> = {
    process: "Processos",
    client: "Clientes",
    employee: "Funcionários",
    position: "Cargos",
    finance: "Financeiro",
    portal: "Portal",
    admin: "Administração",
    cause: "Causas",
    knowledge: "Conhecimento",
    document: "Documentos",
  };
  const actionLabel: Record<string, string> = {
    view: "Visualizar",
    create: "Criar",
    update: "Editar",
    delete: "Excluir",
    issue: "Emitir",
    invoice: "Faturar",
    manage_users: "Gerenciar usuários",
    audit: "Auditoria",
    settings: "Configurações",
  };
  return resource && action ? `${resourceLabel[resource] || resource} · ${actionLabel[action] || action}` : code;
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
}

export default function Positions() {
  const { isSuperuser, companies, companiesQuery, effectiveTenantId, selectedTenantId, setSelectedTenantId } = useScopedTenant("positions");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PositionForm>(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [tenantMeta, setTenantMeta] = useState(() => createDefaultOfficeTenantMeta());

  const officeMetaQuery = useQuery({
    queryKey: ["office-tenant-meta", effectiveTenantId],
    enabled: !!effectiveTenantId,
    queryFn: () => loadOfficeTenantMeta(effectiveTenantId),
    retry: false,
  });

  const positionsQuery = useQuery({
    queryKey: ["positions-list", effectiveTenantId],
    queryFn: async () => await apiGetAllPages<Position>("/employee-positions/"),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const employeesQuery = useQuery({
    queryKey: ["positions-employees", effectiveTenantId],
    queryFn: async () => await apiGetAllPages<Employee>("/employees/"),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ["positions-users", effectiveTenantId],
    queryFn: async () => await api.get<any>("/admin/users/", effectiveTenantId ? { tenant_id: effectiveTenantId } : undefined),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const accessQuery = useQuery({
    queryKey: ["positions-access"],
    queryFn: async () => await api.get<any>("/access-controls/"),
    retry: false,
  });

  const positions = useMemo(() => (positionsQuery.data || []) as Position[], [positionsQuery.data]);
  const employees = useMemo(() => (employeesQuery.data || []) as Employee[], [employeesQuery.data]);
  const users = useMemo(() => listFrom(usersQuery.data), [usersQuery.data]);
  const permissions = useMemo(() => listFrom(accessQuery.data?.permissions || accessQuery.data), [accessQuery.data]);

  useEffect(() => {
    setTenantMeta(officeMetaQuery.data || createDefaultOfficeTenantMeta());
  }, [officeMetaQuery.data]);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? position.is_active !== false : position.is_active === false;
      const query = search.trim().toLowerCase();
      const matchesText = !query || String(position.name || "").toLowerCase().includes(query) || String(position.description || "").toLowerCase().includes(query);
      return matchesStatus && matchesText;
    });
  }, [positions, search, statusFilter]);

  useEffect(() => {
    if (!filteredPositions.length) {
      setSelectedId("");
      return;
    }
    if (!filteredPositions.some((position) => position.id === selectedId)) setSelectedId(filteredPositions[0].id);
  }, [filteredPositions, selectedId]);

  const selectedPosition = useMemo(() => filteredPositions.find((position) => position.id === selectedId) || null, [filteredPositions, selectedId]);
  const selectedPositionMeta = selectedPosition ? tenantMeta.positions[selectedPosition.id] || defaultPositionMeta(0) : defaultPositionMeta(0);
  const selectedEmployees = useMemo(
    () => (selectedPosition ? employees.filter((employee) => String(employee.position || "") === selectedPosition.id) : []),
    [selectedPosition, employees],
  );
  const selectedUsers = useMemo(() => {
    return selectedEmployees.filter((employee) => {
      const linkedUserId = typeof employee.user === "object" ? String(employee.user?.id || "") : String(employee.user || employee.user_id || "");
      return users.some((user: any) => String(user.id) === linkedUserId);
    });
  }, [selectedEmployees, users]);

  const metrics = useMemo(() => {
    const activePositions = positions.filter((position) => position.is_active !== false).length;
    const withoutEmployees = positions.filter((position) => employees.every((employee) => String(employee.position || "") !== position.id)).length;
    const permissionAverage = positions.length
      ? Math.round(
          positions.reduce((sum, position, index) => sum + (tenantMeta.positions[position.id]?.permissionCodes?.length || defaultPositionMeta(index).permissionCodes.length), 0) / positions.length,
        )
      : 0;
    return [
      {
        label: "Cargos ativos",
        value: String(activePositions),
        helper: "Funções disponíveis para novos vínculos.",
        icon: BriefcaseBusiness,
      },
      {
        label: "Equipe vinculada",
        value: String(employees.filter((employee) => employee.position).length),
        helper: "Funcionários distribuídos entre os cargos.",
        icon: Users,
      },
      {
        label: "Permissões por cargo",
        value: `${permissionAverage} em média`,
        helper: "Padrão de acesso configurado nas funções.",
        icon: Shield,
      },
      {
        label: "Cargos sem equipe",
        value: String(withoutEmployees),
        helper: "Estruturas ainda não ocupadas na operação.",
        icon: Palette,
      },
    ];
  }, [positions, employees, tenantMeta.positions]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, color: defaultPositionMeta(positions.length).color });
    setOpen(true);
  };

  const openEdit = (position: Position) => {
    const meta = tenantMeta.positions[position.id] || defaultPositionMeta(positions.findIndex((item) => item.id === position.id));
    setEditingId(position.id);
    setForm({
      name: position.name || "",
      salario_base: position.salario_base ? String(position.salario_base).replace(".", ",") : "",
      description: position.description || "",
      is_active: position.is_active !== false,
      color: meta.color,
      permissionCodes: meta.permissionCodes || [],
    });
    setOpen(true);
  };

  const resetDialog = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        salario_base: form.salario_base ? moneyToApiDecimal(form.salario_base) : undefined,
        description: form.description || undefined,
        is_active: form.is_active,
      };
      if (editingId) {
        await apiRequest(`/employee-positions/${editingId}/`, { method: "PATCH", body: payload, headers: { "X-Tenant-ID": effectiveTenantId } });
        return editingId;
      }
      const created = await apiRequest<any>("/employee-positions/", { method: "POST", body: payload, headers: { "X-Tenant-ID": effectiveTenantId } });
      return String(created?.id || "");
    },
    onSuccess: async (positionId) => {
      if (positionId) {
        const nextMeta = {
          ...tenantMeta,
          positions: {
            ...tenantMeta.positions,
            [positionId]: {
              color: form.color,
              icon: "briefcase",
              permissionCodes: form.permissionCodes,
            },
          },
        };
        setTenantMeta(nextMeta);
        if (effectiveTenantId) {
          await saveOfficeTenantMeta(effectiveTenantId, nextMeta);
          await queryClient.invalidateQueries({ queryKey: ["office-tenant-meta", effectiveTenantId] });
        }
      }
      toast({ title: editingId ? "Cargo atualizado com sucesso." : "Cargo criado com sucesso." });
      resetDialog();
      queryClient.invalidateQueries({ queryKey: ["positions-list"] });
    },
    onError: (error: any) => toast({ title: "Erro ao salvar cargo", description: error?.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (positionId: string) => {
      await apiRequest(`/employee-positions/${positionId}/`, { method: "DELETE", headers: { "X-Tenant-ID": effectiveTenantId } });
    },
    onSuccess: async (_, positionId) => {
      const nextMeta = { ...tenantMeta, positions: { ...tenantMeta.positions } };
      delete nextMeta.positions[positionId];
      setTenantMeta(nextMeta);
      if (effectiveTenantId) {
        await saveOfficeTenantMeta(effectiveTenantId, nextMeta);
        await queryClient.invalidateQueries({ queryKey: ["office-tenant-meta", effectiveTenantId] });
      }
      toast({ title: "Cargo excluído com sucesso." });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["positions-list"] });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir cargo", description: error?.message, variant: "destructive" }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ positionId, isActive }: { positionId: string; isActive: boolean }) => {
      await apiRequest(`/employee-positions/${positionId}/`, { method: "PATCH", body: { is_active: isActive }, headers: { "X-Tenant-ID": effectiveTenantId } });
    },
    onSuccess: () => {
      toast({ title: "Status do cargo atualizado." });
      queryClient.invalidateQueries({ queryKey: ["positions-list"] });
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar cargo", description: error?.message, variant: "destructive" }),
  });

  const positionColumns: Column<Position>[] = [
    {
      key: "name",
      header: "Cargo",
      cell: (position, index) => {
        const meta = tenantMeta.positions[position.id] || defaultPositionMeta(index);
        return (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 shrink-0 rounded-full border border-border" style={{ backgroundColor: meta.color }} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{position.name || "Cargo sem nome"}</p>
              <p className="truncate text-[12px] text-muted-foreground">{position.description || "Sem descrição"}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "team",
      header: "Equipe",
      align: "center",
      cell: (position) => <span className="tabular-nums text-foreground">{employees.filter((e) => String(e.position || "") === position.id).length}</span>,
    },
    {
      key: "perms",
      header: "Permissões",
      align: "center",
      cell: (position, index) => <span className="tabular-nums text-foreground">{(tenantMeta.positions[position.id] || defaultPositionMeta(index)).permissionCodes.length}</span>,
    },
    {
      key: "salary",
      header: "Salário base",
      align: "right",
      cell: (position) => <span className="tabular-nums text-foreground">{position.salario_base ? formatCurrency(position.salario_base) : "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (position) => <Badge variant="outline">{position.is_active !== false ? "Ativo" : "Inativo"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: "56px",
      cell: (position) => (
        <RowActions
          actions={[
            { label: "Editar", icon: <Pencil className="h-4 w-4" />, onClick: () => openEdit(position) },
            {
              label: position.is_active !== false ? "Desativar" : "Reativar",
              icon: <CheckCircle2 className="h-4 w-4" />,
              onClick: () => toggleStatusMutation.mutate({ positionId: position.id, isActive: position.is_active === false }),
            },
            { label: "Excluir", icon: <Trash2 className="h-4 w-4" />, danger: true, separatorBefore: true, onClick: () => setDeleteId(position.id) },
          ]}
        />
      ),
    },
  ];

  return (
    <OfficeAdminShell
      section="positions"
      title="Cargos"
      description="Estruture funções do escritório com cor, permissões-base e leitura clara do impacto operacional de cada cargo."
      action={{ label: "Novo cargo", icon: BriefcaseBusiness, onClick: openCreate }}
      metrics={metrics}
      headerAside={isSuperuser ? (
        <div className="space-y-1">
          <Label>Escritório ativo</Label>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedTenantId} onChange={(event) => setSelectedTenantId(event.target.value)} disabled={companiesQuery.isLoading}>
            <option value="">{companiesQuery.isLoading ? "Carregando escritórios..." : "Selecione o escritório"}</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name || company.id}</option>)}
          </select>
        </div>
      ) : null}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Role system do escritório</CardTitle>
                  <CardDescription>Defina cargos como Advogado, Estagiário, Administrativo ou Financeiro com permissões-base e leitura visual do time.</CardDescription>
                </div>
                <Button className="gap-2" onClick={openCreate}>
                  <BriefcaseBusiness className="h-4 w-4" />
                  Novo cargo
                </Button>
              </div>
              <div className="grid gap-3 pt-2 md:grid-cols-3">
                <Input placeholder="Buscar por nome ou descrição" value={search} onChange={(event) => setSearch(event.target.value)} />
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {!filteredPositions.length ? (
                <Card className="border-dashed">
                  <CardContent className="space-y-3 p-8">
                    <p className="text-base font-semibold">Nenhum cargo estruturado</p>
                    <p className="text-sm text-muted-foreground">Crie cargos como Advogado, Estagiário, Administrativo ou Financeiro para organizar equipe e padrões de acesso.</p>
                    <Button onClick={openCreate}>Criar cargo</Button>
                  </CardContent>
                </Card>
              ) : (
                <DataTable
                  columns={positionColumns}
                  rows={filteredPositions}
                  getRowKey={(p) => p.id}
                  onRowClick={(p) => setSelectedId(p.id)}
                  minWidth={720}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhes do cargo</CardTitle>
              <CardDescription>Permissões-base, equipe e leitura estratégica da função.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPosition ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ backgroundColor: `${selectedPositionMeta.color}20` }}>
                      <BriefcaseBusiness className="h-5 w-5" style={{ color: selectedPositionMeta.color }} />
                    </div>
                    <div>
                      <p className="font-semibold">{selectedPosition.name || "Cargo sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{selectedPosition.description || "Sem descrição detalhada."}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Status:</span> {selectedPosition.is_active !== false ? "Ativo" : "Inativo"}</p>
                    <p><span className="text-muted-foreground">Equipe vinculada:</span> {selectedEmployees.length}</p>
                    <p><span className="text-muted-foreground">Usuários vinculados:</span> {selectedUsers.length}</p>
                    <p><span className="text-muted-foreground">Salário base:</span> {selectedPosition.salario_base ? formatCurrency(selectedPosition.salario_base) : "-"}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Permissões-base</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPositionMeta.permissionCodes.length ? (
                        selectedPositionMeta.permissionCodes.map((permission) => <Badge key={permission} variant="secondary">{prettyPermission(permission)}</Badge>)
                      ) : (
                        <p className="text-sm text-muted-foreground">Este cargo ainda não possui permissões-base definidas.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione um cargo para ver detalhes e vínculos da equipe.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? resetDialog() : setOpen(true))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar cargo" : "Novo cargo"}</DialogTitle>
            <DialogDescription>Defina nome, cor, descrição e permissões-base dessa função.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate(); }}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados do cargo</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))} required />
                  </div>
                  <div>
                    <Label>Salário base</Label>
                    <Input value={form.salario_base} onChange={(event) => setForm((previous) => ({ ...previous, salario_base: maskMoneyBRInput(event.target.value) }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea rows={4} value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Cor do cargo</Label>
                    <Input type="color" value={form.color} onChange={(event) => setForm((previous) => ({ ...previous, color: event.target.value }))} />
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Cargo ativo</p>
                        <p className="text-xs text-muted-foreground">Disponível para novos vínculos.</p>
                      </div>
                      <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((previous) => ({ ...previous, is_active: checked }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Permissões-base</CardTitle>
                  <CardDescription>Essas permissões podem ser usadas como padrão quando o usuário está vinculado ao cargo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72 rounded-xl border">
                    <div className="space-y-1 p-3">
                      {permissions.map((permission: AccessOption) => (
                        <label key={permission.code} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/50">
                          <span className="text-sm">{prettyPermission(permission.code)}</span>
                          <input type="checkbox" checked={form.permissionCodes.includes(permission.code)} onChange={() => setForm((previous) => ({ ...previous, permissionCodes: previous.permissionCodes.includes(permission.code) ? previous.permissionCodes.filter((item) => item !== permission.code) : [...previous.permissionCodes, permission.code] }))} />
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar cargo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(nextOpen) => (!nextOpen ? setDeleteId(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cargo?</AlertDialogTitle>
            <AlertDialogDescription>Verifique antes se não existem funcionários importantes vinculados a este cargo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir cargo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OfficeAdminShell>
  );
}
