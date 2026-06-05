import { apiRequest } from "@/integrations/api/client";

type EmployeeCreateInput = {
  userId?: string | null;
  tenantId?: string | null;
  fullName?: string | null;
  email?: string | null;
  matricula?: string | null;
  cargoId?: string | null;
  dataAdmissao?: string | null;
  salarioAtual?: string | null;
  statusFuncional?: string | null;
  notes?: string | null;
};

function buildPayload(input: EmployeeCreateInput) {
  const payload: Record<string, any> = {
    ...(input.userId ? { user: input.userId } : {}),
    ...(input.fullName ? { full_name: input.fullName } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.matricula ? { document_id: input.matricula } : {}),
    ...(input.cargoId ? { position: input.cargoId } : {}),
    ...(input.dataAdmissao ? { hire_date: input.dataAdmissao } : {}),
    ...(input.salarioAtual ? { salario: input.salarioAtual } : {}),
    ...(input.statusFuncional ? { is_active: input.statusFuncional.toUpperCase() === "ATIVO" } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };

  return payload;
}

export async function createEmployeeRecord(input: EmployeeCreateInput) {
  if (!input.tenantId) {
    throw new Error("Tenant obrigatorio para cadastrar funcionario.");
  }
  const payload = buildPayload(input);
  return apiRequest<any>("/employees/", {
    method: "POST",
    body: payload,
    headers: { "X-Tenant-ID": input.tenantId },
  });
}
