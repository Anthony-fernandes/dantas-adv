import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, CheckCircle2, Mail, MoreHorizontal, Pencil, Phone, UserSquare2, Users } from "lucide-react";
import { api, apiGetAllPages, apiRequest } from "@/integrations/api/client";
import { maskCEP, maskCpfCnpj, maskMoneyBRInput, maskPhoneBR, maskUF, moneyToApiDecimal } from "@/lib/masks";
import { useCepLookup } from "@/hooks/useCepLookup";
import { useScopedTenant } from "@/hooks/useScopedTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { OfficeAdminShell } from "@/components/office-management/OfficeAdminShell";

type Employee = {
  id: string;
  position?: string;
  user?: string | null;
  full_name?: string;
  email?: string;
  phone?: string | null;
  document_id?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  salario?: string | number | null;
  position_name?: string;
  is_active?: boolean;
  notes?: string | null;
};

type Position = { id: string; name: string };

type EmployeeForm = {
  full_name: string;
  email: string;
  position: string;
  user: string;
  phone: string;
  whatsapp: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  document_id: string;
  birth_date: string;
  hire_date: string;
  termination_date: string;
  salario: string;
  zip_code: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  street_number: string;
  address_complement: string;
  has_oab: boolean;
  oab_number: string;
  oab_state: string;
  notes: string;
  is_active: boolean;
};

const INITIAL_FORM: EmployeeForm = {
  full_name: "",
  email: "",
  position: "",
  user: "",
  phone: "",
  whatsapp: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  document_id: "",
  birth_date: "",
  hire_date: "",
  termination_date: "",
  salario: "",
  zip_code: "",
  state: "",
  city: "",
  neighborhood: "",
  street: "",
  street_number: "",
  address_complement: "",
  has_oab: false,
  oab_number: "",
  oab_state: "",
  notes: "",
  is_active: true,
};

const META_MARKER = "[META_FRONT]\n";

function listFrom(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.users)) return payload.users;
  return [];
}

function initialsOf(name?: string | null) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "LF";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function formatMoneyValue(value?: string | number | null) {
  if (value == null || value === "") return "";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function extractEmployeeMeta(notes?: string | null) {
  const raw = String(notes || "");
  const markerIndex = raw.lastIndexOf(META_MARKER);
  if (markerIndex === -1) return { noteText: raw.trim(), meta: {} as Record<string, any> };
  const noteText = raw.slice(0, markerIndex).trim();
  const metaText = raw.slice(markerIndex + META_MARKER.length).trim();
  try {
    return { noteText, meta: JSON.parse(metaText) as Record<string, any> };
  } catch {
    return { noteText: raw.trim(), meta: {} as Record<string, any> };
  }
}

function buildEmployeeNotes(form: EmployeeForm) {
  const oab = form.has_oab ? { numero: form.oab_number || "", uf: form.oab_state || "" } : null;
  const meta = {
    contatos: {
      telefone_principal: form.phone || "",
      whatsapp: form.whatsapp || "",
      contato_emergencia_nome: form.emergency_contact_name || "",
      contato_emergencia_telefone: form.emergency_contact_phone || "",
    },
    endereco: {
      cep: form.zip_code || "",
      estado: form.state || "",
      cidade: form.city || "",
      bairro: form.neighborhood || "",
      logradouro: form.street || "",
      numero: form.street_number || "",
      complemento: form.address_complement || "",
    },
    profissional: { categoria: form.has_oab ? "advogado" : "", oab },
    pessoal: { data_nascimento: form.birth_date || "", documento: form.document_id || "" },
  };
  return [form.notes?.trim(), `${META_MARKER}${JSON.stringify(meta)}`].filter(Boolean).join("\n\n");
}

function employeeToForm(employee: Employee): EmployeeForm {
  const { noteText, meta } = extractEmployeeMeta(employee.notes);
  const contacts = meta?.contatos || {};
  const address = meta?.endereco || {};
  const professional = meta?.profissional || {};
  const personal = meta?.pessoal || {};
  const oab = professional?.oab || {};
  return {
    full_name: employee.full_name || "",
    email: employee.email || "",
    position: employee.position ? String(employee.position) : "",
    user: employee.user ? String(employee.user) : "",
    phone: employee.phone || contacts.telefone_principal || "",
    whatsapp: contacts.whatsapp || "",
    emergency_contact_name: contacts.contato_emergencia_nome || "",
    emergency_contact_phone: contacts.contato_emergencia_telefone || "",
    document_id: employee.document_id || personal.documento || "",
    birth_date: personal.data_nascimento || "",
    hire_date: employee.hire_date ? String(employee.hire_date).slice(0, 10) : "",
    termination_date: employee.termination_date ? String(employee.termination_date).slice(0, 10) : "",
    salario: formatMoneyValue(employee.salario),
    zip_code: address.cep || "",
    state: address.estado || "",
    city: address.cidade || "",
    neighborhood: address.bairro || "",
    street: address.logradouro || "",
    street_number: address.numero || "",
    address_complement: address.complemento || "",
    has_oab: Boolean(oab.numero),
    oab_number: oab.numero || "",
    oab_state: oab.uf || "",
    notes: noteText,
    is_active: employee.is_active !== false,
  };
}

export default function Employees() {
  const { isSuperuser, companies, companiesQuery, effectiveTenantId, selectedTenantId, setSelectedTenantId } = useScopedTenant("employees");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const cepLookup = useCepLookup();
  const [open, setOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(INITIAL_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const employeesQuery = useQuery({
    queryKey: ["employees-list-only", effectiveTenantId],
    queryFn: async () => await apiGetAllPages<Employee>("/employees/"),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const positionsQuery = useQuery({
    queryKey: ["employees-positions", effectiveTenantId],
    queryFn: async () => await apiGetAllPages<Position>("/employee-positions/"),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const usersQuery = useQuery({
    queryKey: ["employees-users", effectiveTenantId],
    queryFn: async () => await api.get<any>("/admin/users/", effectiveTenantId ? { tenant_id: effectiveTenantId } : undefined),
    enabled: !!effectiveTenantId,
    retry: false,
  });

  const employees = useMemo(() => (employeesQuery.data || []) as Employee[], [employeesQuery.data]);
  const positions = useMemo(() => (positionsQuery.data || []) as Position[], [positionsQuery.data]);
  const users = useMemo(() => listFrom(usersQuery.data), [usersQuery.data]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? employee.is_active !== false : employee.is_active === false;
      const matchesPosition = positionFilter === "all" ? true : String(employee.position || "") === positionFilter;
      const query = search.trim().toLowerCase();
      const linkedPosition = positions.find((position) => position.id === String(employee.position || ""));
      const matchesSearch =
        !query ||
        String(employee.full_name || "").toLowerCase().includes(query) ||
        String(employee.email || "").toLowerCase().includes(query) ||
        String(employee.phone || "").toLowerCase().includes(query) ||
        String(linkedPosition?.name || employee.position_name || "").toLowerCase().includes(query);
      return matchesStatus && matchesPosition && matchesSearch;
    });
  }, [employees, positions, search, statusFilter, positionFilter]);

  useEffect(() => {
    if (!filteredEmployees.length) {
      setSelectedEmployeeId("");
      return;
    }
    if (!filteredEmployees.some((employee) => employee.id === selectedEmployeeId)) setSelectedEmployeeId(filteredEmployees[0].id);
  }, [filteredEmployees, selectedEmployeeId]);

  const selectedEmployee = useMemo(() => filteredEmployees.find((employee) => employee.id === selectedEmployeeId) || null, [filteredEmployees, selectedEmployeeId]);
  const selectedEmployeeMeta = selectedEmployee ? extractEmployeeMeta(selectedEmployee.notes) : { noteText: "", meta: {} as Record<string, any> };
  const selectedPosition = selectedEmployee ? positions.find((position) => position.id === String(selectedEmployee.position || "")) || null : null;
  const selectedUser = selectedEmployee ? users.find((user: any) => String(user.id) === String(selectedEmployee.user || "")) || null : null;

  const metrics = useMemo(() => {
    const activeEmployees = employees.filter((employee) => employee.is_active !== false).length;
    const linkedUsers = employees.filter((employee) => employee.user).length;
    const lawyers = employees.filter((employee) => {
      const meta = extractEmployeeMeta(employee.notes);
      return Boolean(meta.meta?.profissional?.oab?.numero);
    }).length;
    return [
      {
        label: "Funcionários ativos",
        value: String(activeEmployees),
        helper: "Equipe interna habilitada para operação.",
        icon: Users,
      },
      {
        label: "Logins vinculados",
        value: String(linkedUsers),
        helper: "Funcionários conectados a um usuário do sistema.",
        icon: Activity,
      },
      {
        label: "Equipe jurídica",
        value: String(lawyers),
        helper: "Profissionais com OAB registrada no cadastro.",
        icon: CheckCircle2,
      },
      {
        label: "Cargos utilizados",
        value: String(new Set(employees.map((employee) => employee.position).filter(Boolean)).size),
        helper: "Funções atualmente ocupadas no escritório.",
        icon: UserSquare2,
      },
    ];
  }, [employees]);

  const resetDialog = () => {
    setOpen(false);
    setEditingEmployeeId(null);
    setForm(INITIAL_FORM);
  };

  const startCreate = () => {
    setEditingEmployeeId(null);
    setForm(INITIAL_FORM);
    setOpen(true);
  };

  const startEdit = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setForm(employeeToForm(employee));
    setOpen(true);
  };

  const buildPayload = () => ({
    full_name: form.full_name,
    email: form.email,
    position: form.position || null,
    user: form.user || null,
    phone: form.phone || undefined,
    document_id: form.document_id || undefined,
    hire_date: form.hire_date || undefined,
    termination_date: form.termination_date || null,
    salario: form.salario ? moneyToApiDecimal(form.salario) : undefined,
    notes: buildEmployeeNotes(form) || undefined,
    is_active: form.is_active,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveTenantId) throw new Error("Selecione uma empresa antes de salvar o funcionário.");
      if (editingEmployeeId) {
        return await apiRequest(`/employees/${editingEmployeeId}/`, {
          method: "PATCH",
          body: buildPayload(),
          headers: { "X-Tenant-ID": effectiveTenantId },
        });
      }
      return await apiRequest("/employees/", {
        method: "POST",
        body: buildPayload(),
        headers: { "X-Tenant-ID": effectiveTenantId },
      });
    },
    onSuccess: () => {
      toast({ title: editingEmployeeId ? "Funcionário atualizado com sucesso." : "Funcionário cadastrado com sucesso." });
      resetDialog();
      queryClient.invalidateQueries({ queryKey: ["employees-list-only"] });
    },
    onError: (error: any) => toast({ title: "Erro ao salvar funcionário", description: error?.message, variant: "destructive" }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ employeeId, isActive }: { employeeId: string; isActive: boolean }) => {
      await apiRequest(`/employees/${employeeId}/`, {
        method: "PATCH",
        body: { is_active: isActive },
        headers: { "X-Tenant-ID": effectiveTenantId },
      });
    },
    onSuccess: () => {
      toast({ title: "Status do funcionário atualizado." });
      queryClient.invalidateQueries({ queryKey: ["employees-list-only"] });
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar funcionário", description: error?.message, variant: "destructive" }),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <OfficeAdminShell
      section="employees"
      title="Funcionários"
      description="Gerencie a equipe interna, vínculos com usuários, cargo, contatos e dados profissionais do escritório."
      action={{ label: "Novo funcionário", icon: UserSquare2, onClick: startCreate }}
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
                  <CardTitle>Equipe do escritório</CardTitle>
                  <CardDescription>Lista operacional da equipe com cargo, contato, status e vínculo de login.</CardDescription>
                </div>
                <Button className="gap-2" onClick={startCreate}>
                  <UserSquare2 className="h-4 w-4" />
                  Novo funcionário
                </Button>
              </div>
              <div className="grid gap-3 pt-2 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
                <Input placeholder="Buscar por nome, e-mail, cargo ou contato" value={search} onChange={(event) => setSearch(event.target.value)} />
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
                  <option value="all">Todos os cargos</option>
                  {positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                </select>
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {!filteredEmployees.length ? (
                <Card className="border-dashed">
                  <CardContent className="space-y-3 p-8">
                    <p className="text-base font-semibold">Nenhum funcionário cadastrado</p>
                    <p className="text-sm text-muted-foreground">Cadastre advogados, assistentes, administrativo e demais integrantes da equipe para estruturar o escritório.</p>
                    <Button onClick={startCreate}>Cadastrar funcionário</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Login vinculado</TableHead>
                        <TableHead>Admissão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[72px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => {
                        const linkedPosition = positions.find((position) => position.id === String(employee.position || ""));
                        const linkedUser = users.find((user: any) => String(user.id) === String(employee.user || ""));
                        return (
                          <TableRow key={employee.id} className={selectedEmployeeId === employee.id ? "bg-muted/40" : ""} onClick={() => setSelectedEmployeeId(employee.id)}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                  <AvatarFallback>{initialsOf(employee.full_name || employee.email)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{employee.full_name || "Sem nome"}</p>
                                  <p className="truncate text-xs text-muted-foreground">{employee.email || "Sem e-mail"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{linkedPosition?.name || employee.position_name || "Sem cargo"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{employee.phone || "Sem telefone"}</TableCell>
                            <TableCell>{linkedUser ? <Badge variant="outline">{linkedUser.full_name || linkedUser.email || "Usuário vinculado"}</Badge> : <span className="text-sm text-muted-foreground">Sem login</span>}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(employee.hire_date)}</TableCell>
                            <TableCell><Badge variant="outline">{employee.is_active !== false ? "Ativo" : "Inativo"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Abrir menu de ações" onClick={(event) => event.stopPropagation()}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEdit(employee)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleStatusMutation.mutate({ employeeId: employee.id, isActive: employee.is_active === false })}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {employee.is_active !== false ? "Desativar" : "Reativar"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Perfil do funcionário</CardTitle>
              <CardDescription>Visão rápida de cargo, contato, login e observações do colaborador.</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarFallback>{initialsOf(selectedEmployee.full_name || selectedEmployee.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedEmployee.full_name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{selectedPosition?.name || selectedEmployee.position_name || "Sem cargo definido"}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedEmployee.email || "-"}</p>
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedEmployee.phone || selectedEmployeeMeta.meta?.contatos?.telefone_principal || "-"}</p>
                    <p><span className="text-muted-foreground">Login vinculado:</span> {selectedUser?.email || "-"}</p>
                    <p><span className="text-muted-foreground">Admissão:</span> {formatDate(selectedEmployee.hire_date)}</p>
                    <p><span className="text-muted-foreground">OAB:</span> {selectedEmployeeMeta.meta?.profissional?.oab?.numero ? `${selectedEmployeeMeta.meta.profissional.oab.numero}/${selectedEmployeeMeta.meta.profissional.oab.uf || ""}` : "Não informada"}</p>
                  </div>

                  {selectedEmployeeMeta.noteText ? (
                    <div className="rounded-xl border p-4">
                      <p className="text-sm font-medium">Observações</p>
                      <p className="mt-2 text-sm text-muted-foreground">{selectedEmployeeMeta.noteText}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione um funcionário para ver o perfil resumido.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? resetDialog() : setOpen(true))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingEmployeeId ? "Editar funcionário" : "Novo funcionário"}</DialogTitle>
            <DialogDescription>Preencha dados pessoais, cargo, contato, vínculo de usuário e informações profissionais.</DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dados principais</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Nome completo</Label>
                    <Input value={form.full_name} onChange={(event) => setForm((previous) => ({ ...previous, full_name: event.target.value }))} required />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))} required />
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.position} onChange={(event) => setForm((previous) => ({ ...previous, position: event.target.value }))}>
                      <option value="">Definir depois</option>
                      {positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Login vinculado</Label>
                    <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.user} onChange={(event) => setForm((previous) => ({ ...previous, user: event.target.value }))}>
                      <option value="">Sem login vinculado</option>
                      {users.map((user: any) => <option key={user.id} value={user.id}>{[user.full_name || user.email, user.email].filter(Boolean).join(" · ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(event) => setForm((previous) => ({ ...previous, phone: maskPhoneBR(event.target.value) }))} />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={(event) => setForm((previous) => ({ ...previous, whatsapp: maskPhoneBR(event.target.value) }))} />
                  </div>
                  <div>
                    <Label>Documento</Label>
                    <Input value={form.document_id} onChange={(event) => setForm((previous) => ({ ...previous, document_id: maskCpfCnpj(event.target.value) }))} />
                  </div>
                  <div>
                    <Label>Nascimento</Label>
                    <Input type="date" value={form.birth_date} onChange={(event) => setForm((previous) => ({ ...previous, birth_date: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Admissão</Label>
                    <Input type="date" value={form.hire_date} onChange={(event) => setForm((previous) => ({ ...previous, hire_date: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Desligamento</Label>
                    <Input type="date" value={form.termination_date} onChange={(event) => setForm((previous) => ({ ...previous, termination_date: event.target.value }))} />
                  </div>
                  <div>
                    <Label>Salário</Label>
                    <Input value={form.salario} onChange={(event) => setForm((previous) => ({ ...previous, salario: maskMoneyBRInput(event.target.value) }))} />
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Funcionário ativo</p>
                        <p className="text-xs text-muted-foreground">Controle rápido de disponibilidade.</p>
                      </div>
                      <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((previous) => ({ ...previous, is_active: checked }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dados profissionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Possui OAB</p>
                          <p className="text-xs text-muted-foreground">Ajuda a diferenciar equipe jurídica do administrativo.</p>
                        </div>
                        <Switch checked={form.has_oab} onCheckedChange={(checked) => setForm((previous) => ({ ...previous, has_oab: checked }))} />
                      </div>
                    </div>
                    {form.has_oab ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Número da OAB</Label>
                          <Input value={form.oab_number} onChange={(event) => setForm((previous) => ({ ...previous, oab_number: event.target.value }))} />
                        </div>
                        <div>
                          <Label>UF da OAB</Label>
                          <Input maxLength={2} value={form.oab_state} onChange={(event) => setForm((previous) => ({ ...previous, oab_state: maskUF(event.target.value) }))} />
                        </div>
                      </div>
                    ) : null}
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Contato de emergência</Label>
                        <Input value={form.emergency_contact_name} onChange={(event) => setForm((previous) => ({ ...previous, emergency_contact_name: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Telefone de emergência</Label>
                        <Input value={form.emergency_contact_phone} onChange={(event) => setForm((previous) => ({ ...previous, emergency_contact_phone: maskPhoneBR(event.target.value) }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Endereço e observações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <Label>CEP</Label>
                        <div className="relative">
                          <Input
                            value={form.zip_code}
                            maxLength={9}
                            onChange={async (event) => {
                              const masked = maskCEP(event.target.value);
                              setForm((previous) => ({ ...previous, zip_code: masked }));
                              const filled = await cepLookup.lookup(masked);
                              if (filled) {
                                setForm((previous) => ({
                                  ...previous,
                                  neighborhood: filled.neighborhood || previous.neighborhood,
                                  city: filled.city || previous.city,
                                  state: filled.state || previous.state,
                                }));
                              }
                            }}
                          />
                          {cepLookup.loading && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input maxLength={2} value={form.state} onChange={(event) => setForm((previous) => ({ ...previous, state: maskUF(event.target.value) }))} />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input value={form.city} onChange={(event) => setForm((previous) => ({ ...previous, city: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input value={form.neighborhood} onChange={(event) => setForm((previous) => ({ ...previous, neighborhood: event.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Logradouro</Label>
                        <Input value={form.street} onChange={(event) => setForm((previous) => ({ ...previous, street: event.target.value }))} />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input value={form.street_number} onChange={(event) => setForm((previous) => ({ ...previous, street_number: event.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Complemento</Label>
                        <Input value={form.address_complement} onChange={(event) => setForm((previous) => ({ ...previous, address_complement: event.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea rows={4} value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetDialog}>Cancelar</Button>
              <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : editingEmployeeId ? "Salvar alterações" : "Salvar funcionário"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </OfficeAdminShell>
  );
}
