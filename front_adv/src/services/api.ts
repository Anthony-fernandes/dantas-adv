import { api, apiGetAllPages, apiMultipart, apiUpload } from '@/integrations/api/client';
import { PaginatedResponse, Process, Movement, Deadline, Hearing, Client, TimelineItem, Contract, FinanceEntry, Invoice, User, AuditLog, KnowledgeItem, Integration, SyncRun, PortalMessage, LeadRequest, AuthTokens, DocumentFile } from '@/types/models';
import { LandingContactRequest, LandingDifferential, LandingMessage, LandingNavigationLink, LandingPost, LandingProcessStep, LandingPublicPayload, LandingSettings, LandingSocialLink, LandingTestimonial } from '@/types/landing';

type Params = Record<string, string | number | undefined>;

// Auth
export const authService = {
  login: (email: string, password: string) => api.post<AuthTokens>('/auth/login/', { email, password }),
  refresh: () => api.post<AuthTokens>('/auth/token/refresh/'),
  me: () => api.get<User>('/me/'),
  logout: () => api.post('/auth/logout/'),
};

// Processes
export const processService = {
  list: (params?: Params) => api.get<PaginatedResponse<Process>>('/processes/', params),
  get: (id: string) => api.get<Process>(`/processes/${id}/`),
  create: (data: Partial<Process>) => api.post<Process>('/processes/', data),
  update: (id: string, data: Partial<Process>) => api.patch<Process>(`/processes/${id}/`, data),
  delete: (id: string) => api.delete(`/processes/${id}/`),
  movements: (id: string, params?: Params) => api.get<PaginatedResponse<Movement>>('/movements/', { process: id, ...(params ?? {}) }),
  addMovement: (id: string, data: Partial<Movement>) => api.post<Movement>('/movements/', { ...data, process: id }),
  deadlines: (id: string) => api.get<PaginatedResponse<Deadline>>('/deadlines/', { process: id }),
  addDeadline: (id: string, data: Partial<Deadline>) => api.post<Deadline>('/deadlines/', { ...data, process: id }),
  hearings: (id: string) => api.get<PaginatedResponse<Hearing>>('/hearings/', { process: id }),
  addHearing: (id: string, data: Partial<Hearing>) => api.post<Hearing>('/hearings/', { ...data, process: id }),
  timeline: (id: string) => api.get<TimelineItem[]>(`/processes/${id}/timeline/`),
  documents: (id: string) => api.get<PaginatedResponse<DocumentFile>>(`/processes/${id}/documents/`),
  uploadDocument: (id: string, formData: FormData) => apiUpload<DocumentFile>(`/processes/${id}/documents/`, formData),
};

// Causes
export const causeService = {
  list: (params?: Params) => api.get('/causes/', params),
  get: (id: string) => api.get(`/causes/${id}/`),
  create: (data: Record<string, any>) => api.post('/causes/', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/causes/${id}/`, data),
  remove: (id: string) => api.delete(`/causes/${id}/`),
};

// Clients
export const clientService = {
  list: (params?: Params) => api.get<PaginatedResponse<Client>>('/clients/', params),
  get: (id: string) => api.get<Client>(`/clients/${id}/`),
  create: (data: Partial<Client>) => api.post<Client>('/clients/', data),
  update: (id: string, data: Partial<Client>) => api.patch<Client>(`/clients/${id}/`, data),
  contracts: (id: string) => api.get<PaginatedResponse<Contract>>(`/clients/${id}/contracts/`),
  processes: (id: string) => api.get<PaginatedResponse<Process>>(`/clients/${id}/processes/`),
  financial: (id: string) => api.get<PaginatedResponse<FinanceEntry>>(`/clients/${id}/financial/`),
};

// Financial
export const financeService = {
  receivables: (params?: Params) => api.get('/accounts-receivable/', params),
  createReceivable: (data: Record<string, any>) => api.post('/accounts-receivable/', data),
  payables: (params?: Params) => api.get('/accounts-payable/', params),
  createPayable: (data: Record<string, any>) => api.post('/accounts-payable/', data),
  invoices: (params?: Params) => api.get('/invoices/', params),
  createInvoice: (data: Record<string, any>) => api.post('/invoices/', data),
  payments: (params?: Params) => api.get('/payments/', params),
  createPayment: (data: Record<string, any>) => api.post('/payments/', data),
  receivableInstallments: (params?: Params) => api.get('/receivable-installments/', params),
  report: (kind: 'receivable' | 'payable' | 'payments') => api.get('/finance/report/', { kind }),
};

// Admin
export const adminService = {
  users: (params?: Params) => api.get<PaginatedResponse<User>>('/admin/users/', params),
  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/admin/users/${id}/`, data),
  auditLogs: (params?: Params) => api.get<PaginatedResponse<AuditLog>>('/audit-events/', params),
  knowledge: (params?: Params) => api.get<PaginatedResponse<KnowledgeItem>>('/knowledge/', params),
  createKnowledge: (data: Partial<KnowledgeItem>) => api.post<KnowledgeItem>('/knowledge/', data),
};

// Integrations
export const integrationService = {
  list: () => api.get<PaginatedResponse<Integration>>('/integrations/'),
  test: (id: string) => api.post(`/integrations/${id}/test/`),
  runs: (id: string) => api.get<PaginatedResponse<SyncRun>>(`/integrations/${id}/runs/`),
};

// Portal
export const portalService = {
  login: (email: string, password: string) => api.post<AuthTokens>('/portal/login/', { email, password }),
  me: () => api.get<User>('/portal/me/'),
  processes: (params?: Params) => api.get<PaginatedResponse<Process>>('/portal/processes/', params),
  processDetail: (id: string) => api.get<Process>(`/portal/processes/${id}/`),
  messages: () => api.get<PaginatedResponse<PortalMessage>>('/portal/messages/'),
  sendMessage: (data: { content: string }) => api.post<PortalMessage>('/portal/messages/', data),
};

// Landing
export const leadService = {
  getPublicLanding: (slug: string) => api.get(`/public/landing/${slug}/`),
  submit: (slug: string, data: LeadRequest) => api.post(`/public/landing/${slug}/lead/`, data),
  getPublicTenants: () => api.get('/public/tenants/'),
  getPublicSite: (slug?: string) => api.get<LandingPublicPayload>('/landing/', slug ? { slug } : undefined),
  submitPublicSite: (data: LandingContactRequest) => api.post('/contact-messages/', data),
};

export const landingPageService = {
  get: () => api.get('/landing-page/'),
  update: (data: Record<string, any>) => api.patch('/landing-page/', data),
};

export const landingPublicService = {
  getLanding: (slug?: string) => api.get<LandingPublicPayload>('/landing/', slug ? { slug } : undefined),
  getPosts: (slug?: string) => api.get<LandingPost[]>('/posts/', slug ? { slug } : undefined),
  getTestimonials: (slug?: string) => api.get<LandingTestimonial[]>('/testimonials/', slug ? { slug } : undefined),
  submitContact: (data: LandingContactRequest) => api.post('/contact-messages/', data),
};

export const landingCmsService = {
  getSettings: () => api.get<LandingSettings>('/admin/landing/settings/'),
  updateSettings: (data: Partial<LandingSettings>) => api.patch<LandingSettings>('/admin/landing/settings/', data),
  updateSettingsForm: (formData: FormData) => apiMultipart<LandingSettings>('/admin/landing/settings/', formData, { method: 'PATCH' }),

  listDifferentials: () => api.get<PaginatedResponse<LandingDifferential>>('/admin/landing/differentials/'),
  createDifferential: (data: Partial<LandingDifferential>) => api.post<LandingDifferential>('/admin/landing/differentials/', data),
  updateDifferential: (id: string, data: Partial<LandingDifferential>) => api.patch<LandingDifferential>(`/admin/landing/differentials/${id}/`, data),
  removeDifferential: (id: string) => api.delete(`/admin/landing/differentials/${id}/`),

  listProcessSteps: () => api.get<PaginatedResponse<LandingProcessStep>>('/admin/landing/process-steps/'),
  createProcessStep: (data: Partial<LandingProcessStep>) => api.post<LandingProcessStep>('/admin/landing/process-steps/', data),
  updateProcessStep: (id: string, data: Partial<LandingProcessStep>) => api.patch<LandingProcessStep>(`/admin/landing/process-steps/${id}/`, data),
  removeProcessStep: (id: string) => api.delete(`/admin/landing/process-steps/${id}/`),

  listPosts: () => api.get<PaginatedResponse<LandingPost>>('/admin/posts/'),
  listAllPosts: () => apiGetAllPages<LandingPost>('/admin/posts/'),
  createPost: (formData: FormData) => apiMultipart<LandingPost>('/admin/posts/', formData, { method: 'POST' }),
  updatePost: (id: string, formData: FormData) => apiMultipart<LandingPost>(`/admin/posts/${id}/`, formData, { method: 'PATCH' }),
  removePost: (id: string) => api.delete(`/admin/posts/${id}/`),

  listTestimonials: () => api.get<PaginatedResponse<LandingTestimonial>>('/admin/testimonials/'),
  createTestimonial: (data: Partial<LandingTestimonial>) => api.post<LandingTestimonial>('/admin/testimonials/', data),
  updateTestimonial: (id: string, data: Partial<LandingTestimonial>) => api.patch<LandingTestimonial>(`/admin/testimonials/${id}/`, data),
  removeTestimonial: (id: string) => api.delete(`/admin/testimonials/${id}/`),

  listSocialLinks: () => api.get<PaginatedResponse<LandingSocialLink>>('/admin/landing/social-links/'),
  createSocialLink: (data: Partial<LandingSocialLink>) => api.post<LandingSocialLink>('/admin/landing/social-links/', data),
  updateSocialLink: (id: string, data: Partial<LandingSocialLink>) => api.patch<LandingSocialLink>(`/admin/landing/social-links/${id}/`, data),
  removeSocialLink: (id: string) => api.delete(`/admin/landing/social-links/${id}/`),

  listNavigationLinks: () => api.get<PaginatedResponse<LandingNavigationLink>>('/admin/landing/navigation-links/'),
  createNavigationLink: (data: Partial<LandingNavigationLink>) => api.post<LandingNavigationLink>('/admin/landing/navigation-links/', data),
  updateNavigationLink: (id: string, data: Partial<LandingNavigationLink>) => api.patch<LandingNavigationLink>(`/admin/landing/navigation-links/${id}/`, data),
  removeNavigationLink: (id: string) => api.delete(`/admin/landing/navigation-links/${id}/`),

  listMessages: (params?: Params) => api.get<PaginatedResponse<LandingMessage>>('/messages/', params),
  updateMessage: (id: string, data: Partial<LandingMessage>) => api.patch<LandingMessage>(`/messages/${id}/`, data),
};

export const accessControlService = {
  list: () => api.get('/access-controls/'),
};

// Editor de documentos (Word-like)
export const editorDocumentService = {
  list: (params?: Params) => api.get('/editor-documents/', params),
  get: (id: string) => api.get(`/editor-documents/${id}/`),
  create: (data: Record<string, any>) => api.post('/editor-documents/', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/editor-documents/${id}/`, data),
  remove: (id: string) => api.delete(`/editor-documents/${id}/`),
  newVersion: (id: string, data: Record<string, any>) => api.post(`/editor-documents/${id}/new-version/`, data),
  placeholders: () => api.get('/editor-documents/placeholders/'),
  preview: (id: string, data: Record<string, any>) => api.post(`/editor-documents/${id}/preview/`, data),
  exportPdf: (id: string, data?: Record<string, any>) => api.post(`/editor-documents/${id}/export-pdf/`, data ?? {}),
};
