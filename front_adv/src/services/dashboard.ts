import { apiRequest } from "@/integrations/api/client";

export type DashboardStatusCount = { status: string; count: number };

export type DashboardDeadlineItem = {
  id: string;
  description: string;
  due_date: string;
  status: string;
  priority: string;
  process_id: string;
};

export type DashboardHearingItem = {
  id: string;
  type: string | null;
  hearing_date: string;
  status: string;
  modality: string;
  process_id: string;
};

export type LegalDashboardResponse = {
  active_processes: number;
  deadlines_week: number;
  deadlines_overdue: number;
  hearings_upcoming: number;
  processes_by_status: DashboardStatusCount[];
  deadlines_next: DashboardDeadlineItem[];
  hearings_next: DashboardHearingItem[];
};

export type DashboardResponsible = {
  id?: string | null;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

export type DashboardProcessRecord = {
  id: string;
  cnj?: string | null;
  court?: string | null;
  court_division?: string | null;
  class_name?: string | null;
  subject?: string | null;
  area?: string | null;
  phase?: string | null;
  status?: string | null;
  probability?: string | null;
  cause_value?: string | number | null;
  plaintiff?: string | null;
  defendant?: string | null;
  client?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  responsaveis?: DashboardResponsible[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardDeadlineRecord = {
  id: string;
  description?: string | null;
  due_date?: string | null;
  status?: string | null;
  priority?: string | null;
  process?: string | null;
  process_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardHearingRecord = {
  id: string;
  type?: string | null;
  hearing_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  modality?: string | null;
  location?: string | null;
  process?: string | null;
  process_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardMovementRecord = {
  id: string;
  type?: string | null;
  description?: string | null;
  date?: string | null;
  process?: string | null;
  process_id?: string | null;
  created_at?: string | null;
};

export type DashboardDocumentRecord = {
  id: string;
  title?: string | null;
  filename?: string | null;
  category?: string | null;
  process?: string | null;
  client?: string | null;
  uploaded_by?: string | null;
  created_at?: string | null;
  file_size?: number | null;
};

export type DashboardClientRecord = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  razao_social?: string | null;
  type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardEmployeeRecord = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  position_name?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DashboardAreaRecord = {
  id: string;
  name?: string | null;
  area?: string | null;
  is_active?: boolean | null;
};

export type DashboardReceivableRecord = {
  id: string;
  description?: string | null;
  amount?: string | number | null;
  status?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  client?: string | null;
  process?: string | null;
  created_at?: string | null;
};

export type DashboardPayableRecord = {
  id: string;
  description?: string | null;
  amount?: string | number | null;
  status?: string | null;
  due_date?: string | null;
  supplier?: string | null;
  process?: string | null;
  created_at?: string | null;
};

export type DashboardPaymentRecord = {
  id: string;
  amount?: string | number | null;
  payment_date?: string | null;
  method?: string | null;
  receivable?: string | null;
  client?: string | null;
  process?: string | null;
  created_at?: string | null;
};

export type DashboardStatusTotal = { status: string; count: number };

export type StrategicDashboardData = {
  legalSummary: LegalDashboardResponse | null;
  processTotals: DashboardStatusTotal[];
  processes: DashboardProcessRecord[];
  deadlines: DashboardDeadlineRecord[];
  hearings: DashboardHearingRecord[];
  movements: DashboardMovementRecord[];
  documents: DashboardDocumentRecord[];
  clients: DashboardClientRecord[];
  employees: DashboardEmployeeRecord[];
  areas: DashboardAreaRecord[];
  receivables: DashboardReceivableRecord[];
  payables: DashboardPayableRecord[];
  payments: DashboardPaymentRecord[];
};

type StrategicDashboardApiResponse = {
  legal_summary: LegalDashboardResponse | null;
  process_totals: DashboardStatusTotal[];
  processes: DashboardProcessRecord[];
  deadlines: DashboardDeadlineRecord[];
  hearings: DashboardHearingRecord[];
  movements: DashboardMovementRecord[];
  documents: DashboardDocumentRecord[];
  clients: DashboardClientRecord[];
  employees: DashboardEmployeeRecord[];
  areas: DashboardAreaRecord[];
  receivables: DashboardReceivableRecord[];
  payables: DashboardPayableRecord[];
  payments: DashboardPaymentRecord[];
};

async function safeRequest<T>(path: string) {
  try {
    return await apiRequest<T>(path);
  } catch {
    return null;
  }
}

export async function getLegalDashboard(windowDays: number = 7) {
  return apiRequest<LegalDashboardResponse>(`/dashboard/legal/?window_days=${windowDays}`);
}

const EMPTY_DASHBOARD: StrategicDashboardData = {
  legalSummary: null,
  processTotals: [],
  processes: [],
  deadlines: [],
  hearings: [],
  movements: [],
  documents: [],
  clients: [],
  employees: [],
  areas: [],
  receivables: [],
  payables: [],
  payments: [],
};

/**
 * Uma única requisição ao endpoint agregado do servidor. O backend já
 * janela e limita cada recurso, então o payload é enxuto mesmo em bases
 * grandes (antes: N requisições paginadas baixando tudo para o cliente).
 */
export async function getStrategicDashboardData(options: { includeFinance?: boolean } = {}): Promise<StrategicDashboardData> {
  const includeFinance = options.includeFinance !== false;
  const query = includeFinance ? "?include_finance=1" : "";

  const response = await safeRequest<StrategicDashboardApiResponse>(`/dashboard/strategic/${query}`);
  if (!response) return EMPTY_DASHBOARD;

  return {
    legalSummary: response.legal_summary ?? null,
    processTotals: response.process_totals ?? [],
    processes: response.processes ?? [],
    deadlines: response.deadlines ?? [],
    hearings: response.hearings ?? [],
    movements: response.movements ?? [],
    documents: response.documents ?? [],
    clients: response.clients ?? [],
    employees: response.employees ?? [],
    areas: response.areas ?? [],
    receivables: response.receivables ?? [],
    payables: response.payables ?? [],
    payments: response.payments ?? [],
  };
}
