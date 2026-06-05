// ========================
// Base Types
// ========================
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [field: string]: string[] | string | undefined;
}

export type UserRole =
  | 'OWNER' | 'ADMIN' | 'LAWYER' | 'FINANCE' | 'ASSISTANT' | 'CLIENT'
  // legacy (backward compatibility)
  | 'socio' | 'admin' | 'advogado' | 'financeiro' | 'assistente' | 'cliente';

export type Permission =
  | 'process.view' | 'process.create' | 'process.update' | 'process.delete'
  | 'finance.view' | 'finance.create' | 'finance.issue' | 'finance.invoice'
  | 'client.view' | 'client.create' | 'client.update' | 'client.delete'
  | 'admin.manage_users' | 'admin.audit' | 'admin.settings'
  | 'knowledge.view' | 'knowledge.create'
  | 'portal.view';

export interface Tenant {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  tenant: Tenant;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

// ========================
// Auth
// ========================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ========================
// Process (Core)
// ========================
export type ProcessStatus =
  | 'pre_processual'
  | 'em_andamento'
  | 'suspenso'
  | 'finalizado'
  | 'arquivado'
  | 'ATIVO'
  | 'ENCERRADO'
  | 'SUSPENSO'
  | 'ARQUIVADO';
export type ProcessPhase =
  | 'conhecimento'
  | 'recursal'
  | 'execucao'
  | 'cumprimento'
  | 'CONHECIMENTO'
  | 'RECURSAL'
  | 'EXECUCAO'
  | 'CUMPRIMENTO';
export type ProcessArea =
  | 'civel'
  | 'trabalhista'
  | 'criminal'
  | 'tributario'
  | 'empresarial'
  | 'familia'
  | 'consumidor'
  | 'CIVEL'
  | 'TRABALHISTA'
  | 'CRIMINAL'
  | 'TRIBUTARIO'
  | 'EMPRESARIAL'
  | 'FAMILIA'
  | 'CONSUMIDOR';
export type ProbabilityLevel = 'baixa' | 'media' | 'alta' | 'BAIXA' | 'MEDIA' | 'ALTA';

export interface Process {
  id: string;
  cnj?: string | null;
  court?: string | null;
  tribunal?: string | null;
  jurisdiction?: string | null;
  court_division?: string | null;
  vara?: string | null;
  class_name?: string | null;
  classe?: string | null;
  subject?: string | null;
  plaintiff?: string | null;
  polo_ativo?: string | null;
  defendant?: string | null;
  polo_passivo?: string | null;
  area?: ProcessArea | string | null;
  phase?: ProcessPhase | string | null;
  fase?: ProcessPhase | string | null;
  cause_value?: number | string | null;
  valor_causa?: number | string | null;
  probability?: ProbabilityLevel | string | null;
  prob_exito?: ProbabilityLevel | string | null;
  status?: ProcessStatus | string | null;
  responsaveis?: User[] | Array<{ id?: string | null; name?: string | null; full_name?: string | null }> | null;
  responsible_lawyer?: string | null;
  client?: string | null;
  client_id?: string | null;
  cliente_id?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  notes?: string | null;
  observacoes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  tenant?: string | null;
  tenant_id?: string | null;
}

export type MovementType = 'DESPACHO' | 'DECISAO' | 'SENTENCA' | 'PETICAO' | 'AUDIENCIA' | 'PUBLICACAO' | 'OUTRO';

export interface Movement {
  id: string;
  process_id: string;
  date: string;
  type: MovementType;
  description: string;
  attachments: DocumentFile[];
  created_at: string;
}

export type DeadlinePriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type DeadlineStatus = 'PENDENTE' | 'CONCLUIDO' | 'ATRASADO';

export interface Deadline {
  id: string;
  process_id: string;
  date: string;
  description: string;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  alert_channels: string[];
  created_at: string;
}

export type HearingModality = 'PRESENCIAL' | 'ONLINE' | 'HIBRIDA';
export type HearingStatus = 'AGENDADA' | 'REALIZADA' | 'REDESIGNADA' | 'CANCELADA';

export interface Hearing {
  id: string;
  process_id: string;
  date: string;
  location: string;
  modality: HearingModality;
  responsible: string;
  status: HearingStatus;
  created_at: string;
}

export interface DocumentFile {
  id: string;
  group_id: string;
  title?: string | null;
  filename: string;
  category: string;
  version: number;
  is_latest: boolean;
  is_template: boolean;
  access_level: 'TENANT' | 'ROLES';
  allowed_roles: string[];
  file?: string | null;
  file_url?: string | null;
  file_download_url?: string | null;
  file_size?: number | null;
  content_type?: string | null;
  uploaded_by?: string | null;
  process?: string | null;
  client?: string | null;
  created_at: string;
}

export interface LegalTemplate {
  id: string;
  group_id: string;
  name: string;
  description?: string | null;
  category: string;
  format: 'RICH_TEXT' | 'PLAIN_TEXT';
  content: string;
  version: number;
  is_latest: boolean;
  access_level: 'TENANT' | 'ROLES';
  allowed_roles: string[];
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

// ========================
// Client (CRM)
// ========================
export type ClientType = 'PF' | 'PJ';
export type ClientStatus = 'ATIVO' | 'INATIVO' | 'PROSPECTO';

export interface Contact {
  type: 'email' | 'phone' | 'whatsapp';
  value: string;
  label?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  doc: string;
  contacts: Contact[];
  address?: Address;
  tags: string[];
  status: ClientStatus;
  responsavel: string;
  processos_ativos: number;
  inadimplencia: number;
  created_at: string;
  updated_at: string;
  tenant_id: string;
}

export type ContractType = 'FIXO' | 'EXITO' | 'MENSALIDADE' | 'MISTO';

export interface Contract {
  id: string;
  client_id: string;
  type: ContractType;
  percent?: number;
  valor_fixo?: number;
  start: string;
  end?: string;
  clauses: string[];
  attachments: DocumentFile[];
  status: 'VIGENTE' | 'ENCERRADO' | 'SUSPENSO';
  created_at: string;
  updated_at: string;
}

// ========================
// Financial
// ========================
export type EntryType = 'RECEITA' | 'DESPESA';
export type EntryStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type InvoiceType = 'NF' | 'RECIBO' | 'BOLETO' | 'PIX';
export type InvoiceStatus = 'RASCUNHO' | 'EMITIDO' | 'PAGO' | 'VENCIDO' | 'CANCELADO';

export interface FinanceEntry {
  id: string;
  type: EntryType;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: EntryStatus;
  cost_center: string;
  category: string;
  process_id?: string;
  client_id?: string;
  created_at: string;
  tenant_id: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  client_id: string;
  client_name: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  items: { description: string; amount: number }[];
  created_at: string;
  tenant_id: string;
}

// ========================
// Admin
// ========================
export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  details: string;
  ip?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  area: ProcessArea;
  members: User[];
  goals?: { label: string; target: number; current: number }[];
}

export interface KnowledgeItem {
  id: string;
  type: 'TESE' | 'JURISPRUDENCIA' | 'MODELO';
  title: string;
  content: string;
  tags: string[];
  attachments: DocumentFile[];
  created_at: string;
  updated_at: string;
}

// ========================
// Integration
// ========================
export type IntegrationStatus = 'CONECTADO' | 'DESCONECTADO' | 'ERRO';

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: IntegrationStatus;
  last_sync?: string;
  config: Record<string, string>;
}

export interface SyncRun {
  id: string;
  integration_id: string;
  started_at: string;
  finished_at?: string;
  status: 'SUCCESS' | 'ERROR' | 'RUNNING';
  records_synced: number;
  error_message?: string;
}

// ========================
// Portal
// ========================
export interface PortalMessage {
  id: string;
  sender: 'CLIENT' | 'OFFICE';
  sender_name: string;
  content: string;
  attachments: DocumentFile[];
  read: boolean;
  created_at: string;
}

// ========================
// Landing
// ========================
export interface LeadRequest {
  slug?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source?: string;
}

// ========================
// Timeline
// ========================
export type TimelineItemType = 'movement' | 'deadline' | 'hearing';

export interface TimelineItem {
  type: TimelineItemType;
  id: string;
  date: string; // ISO
  title: string;
  description: string;
  status: string | null;
  meta?: Record<string, any>;
}
