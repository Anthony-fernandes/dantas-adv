import { api } from '@/integrations/api/client';
import type { PaginatedResponse, LegalTemplate, DocumentFile } from '@/types/models';

type Params = Record<string, string | number | undefined>;

export const templatesService = {
  list: (params?: Params) => api.get<PaginatedResponse<LegalTemplate>>('/legal-templates/', params),
  get: (id: string) => api.get<LegalTemplate>(`/legal-templates/${id}/`),
  create: (data: Partial<LegalTemplate>) => api.post<LegalTemplate>('/legal-templates/', data),
  update: (id: string, data: Partial<LegalTemplate>) => api.patch<LegalTemplate>(`/legal-templates/${id}/`, data),
  newVersion: (id: string, data: Partial<LegalTemplate>) => api.post<LegalTemplate>(`/legal-templates/${id}/new-version/`, data),
  generate: (id: string, data: { process_id?: string; client_id?: string; title?: string }) =>
    api.post<DocumentFile>(`/legal-templates/${id}/generate/`, data),
};
