/**
 * Hooks do Portal do Cliente — consomem exclusivamente /api/portal/*,
 * que o backend restringe ao cliente autenticado (client.portal_user).
 * Nunca usar aqui os endpoints gerais do escritório.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export function usePortalGet<T>(path: string, enabled = true) {
  return useQuery<T>({
    queryKey: ["portal", path],
    queryFn: () => api.get<T>(path),
    enabled,
  });
}

/** Lista paginada do DRF ou array puro. */
export function unwrapList<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.results) ? payload.results : [];
}

export type PortalDashboard = {
  active_processes: number;
  documents: number;
  upcoming_deadlines: Array<{ id: string; due_date: string; description: string; status: string; priority: string; process: { id: string; cnj: string; title: string } }>;
  upcoming_hearings: Array<{ id: string; hearing_date: string; type: string; status: string; process: { id: string; cnj: string; title: string } }>;
};

export type PortalFinancial = {
  invoices: Array<{ id: string; description: string; amount: string | number; due_date: string; status: string; issue_date?: string; paid_at?: string }>;
  receivables: Array<{ id: string; description: string; amount: string | number; due_date: string; status: string; paid_date?: string; category?: string }>;
};

export function usePortalSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.post("/portal/messages/", { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal", "/portal/messages/"] }),
  });
}
