import { api, apiUpload } from "@/integrations/api/client";

type Params = Record<string, string | number | boolean | undefined | null>;

// Consolidated API contract for the new flow.
export const flowApi = {
  auth: {
    login: (email: string, password: string) => api.post("/auth/login/", { email, password }),
    token: (email: string, password: string) => api.post("/auth/token/", { email, password }),
    refresh: () => api.post("/auth/token/refresh/"),
  },

  admin: {
    companies: (params?: Params) => api.get("/admin/companies/", params),
    createCompany: (payload: Record<string, any>) => api.post("/admin/companies/", payload),
    users: (params?: Params) => api.get("/admin/users/", params),
    createUser: (payload: Record<string, any>) => api.post("/admin/users/", payload),
    updateUser: (id: string, payload: Record<string, any>) => api.patch(`/admin/users/${id}/`, payload),
  },

  accessControls: {
    list: () => api.get("/access-controls/"),
  },

  hr: {
    positions: (params?: Params) => api.get("/employee-positions/", params),
    createPosition: (payload: Record<string, any>) => api.post("/employee-positions/", payload),
    updatePosition: (id: string, payload: Record<string, any>) => api.patch(`/employee-positions/${id}/`, payload),
    removePosition: (id: string) => api.delete(`/employee-positions/${id}/`),

    employees: (params?: Params) => api.get("/employees/", params),
    createEmployee: (payload: Record<string, any>) => api.post("/employees/", payload),
    updateEmployee: (id: string, payload: Record<string, any>) => api.patch(`/employees/${id}/`, payload),
    removeEmployee: (id: string) => api.delete(`/employees/${id}/`),
  },

  legal: {
    causes: (params?: Params) => api.get("/causes/", params),
    createCause: (payload: Record<string, any>) => api.post("/causes/", payload),
    updateCause: (id: string, payload: Record<string, any>) => api.patch(`/causes/${id}/`, payload),
    removeCause: (id: string) => api.delete(`/causes/${id}/`),

    processes: (params?: Params) => api.get("/processes/", params),
    createProcess: (payload: Record<string, any>) => api.post("/processes/", payload),
    updateProcess: (id: string, payload: Record<string, any>) => api.patch(`/processes/${id}/`, payload),
    processTimeline: (id: string) => api.get(`/processes/${id}/timeline/`),

    movements: (params?: Params) => api.get("/movements/", params),
    createMovement: (payload: Record<string, any>) => api.post("/movements/", payload),
    deadlines: (params?: Params) => api.get("/deadlines/", params),
    createDeadline: (payload: Record<string, any>) => api.post("/deadlines/", payload),
    hearings: (params?: Params) => api.get("/hearings/", params),
    createHearing: (payload: Record<string, any>) => api.post("/hearings/", payload),
    processDocuments: (id: string, params?: Params) => api.get(`/processes/${id}/documents/`, params),
    uploadProcessDocument: (id: string, fd: FormData) => apiUpload(`/processes/${id}/documents/`, fd),
  },

  clients: {
    list: (params?: Params) => api.get("/clients/", params),
    create: (payload: Record<string, any>) => api.post("/clients/", payload),
    update: (id: string, payload: Record<string, any>) => api.patch(`/clients/${id}/`, payload),
    remove: (id: string) => api.delete(`/clients/${id}/`),
  },

  finance: {
    receivable: (params?: Params) => api.get("/accounts-receivable/", params),
    createReceivable: (payload: Record<string, any>) => api.post("/accounts-receivable/", payload),
    payable: (params?: Params) => api.get("/accounts-payable/", params),
    createPayable: (payload: Record<string, any>) => api.post("/accounts-payable/", payload),
    invoices: (params?: Params) => api.get("/invoices/", params),
    createInvoice: (payload: Record<string, any>) => api.post("/invoices/", payload),
    payments: (params?: Params) => api.get("/payments/", params),
    createPayment: (payload: Record<string, any>) => api.post("/payments/", payload),
    installments: (params?: Params) => api.get("/receivable-installments/", params),
    report: (kind: "receivable" | "payable" | "payments") => api.get("/finance/report/", { kind }),
  },

  editor: {
    list: (params?: Params) => api.get("/editor-documents/", params),
    create: (payload: Record<string, any>) => api.post("/editor-documents/", payload),
    update: (id: string, payload: Record<string, any>) => api.patch(`/editor-documents/${id}/`, payload),
    remove: (id: string) => api.delete(`/editor-documents/${id}/`),
    newVersion: (id: string, payload: Record<string, any>) => api.post(`/editor-documents/${id}/new-version/`, payload),
    placeholders: () => api.get("/editor-documents/placeholders/"),
    preview: (id: string, payload?: Record<string, any>) => api.post(`/editor-documents/${id}/preview/`, payload ?? {}),
    exportPdf: (id: string, payload?: Record<string, any>) => api.post(`/editor-documents/${id}/export-pdf/`, payload ?? {}),
  },

  landing: {
    config: () => api.get("/landing-page/"),
    updateConfig: (payload: Record<string, any>) => api.patch("/landing-page/", payload),
    publicPage: (slug: string) => api.get(`/public/landing/${slug}/`),
    submitLead: (slug: string, payload: Record<string, any>) => api.post(`/public/landing/${slug}/lead/`, payload),
  },
};
