import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiGetAllPages } from "./api";
import { useAuth } from "./auth";

/**
 * Hooks genéricos de recurso REST (DRF). Cada recurso é uma coleção paginada
 * em /api/<resource>/. Reaproveitados por todos os módulos.
 */

export function useList<T = any>(resource: string, params?: Record<string, any>, enabled = true) {
  const { activeTenantId, isSuperuser } = useAuth();
  return useQuery({
    queryKey: [resource, "list", activeTenantId, params],
    enabled: enabled && (!!activeTenantId || isSuperuser),
    queryFn: () => apiGetAllPages<T>(`/${resource}/`, params),
  });
}

export function useDetail<T = any>(resource: string, id: string | undefined) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: [resource, "detail", activeTenantId, id],
    enabled: !!id,
    queryFn: () => api.get<T>(`/${resource}/${id}/`),
  });
}

export function useCreate<T = any>(resource: string, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<T>(`/${resource}/`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
      invalidate.forEach((r) => qc.invalidateQueries({ queryKey: [r] }));
    },
  });
}

export function useUpdate<T = any>(resource: string, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, any>) =>
      api.patch<T>(`/${resource}/${id}/`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
      invalidate.forEach((r) => qc.invalidateQueries({ queryKey: [r] }));
    },
  });
}

export function useRemove(resource: string, invalidate: string[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [resource] });
      invalidate.forEach((r) => qc.invalidateQueries({ queryKey: [r] }));
    },
  });
}

/* ---------------- formatters ---------------- */

export function fmtBRL(value?: string | number | null) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(n) ? n : 0);
}

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return null;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86400000);
}

export function humanize(value?: string | null) {
  if (!value) return "—";
  return String(value).replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function clientName(c: any): string {
  return String(c?.name || c?.full_name || c?.razao_social || c?.client_name || c?.cliente_nome || "—").trim();
}

/**
 * Abre o pop-up de cadastro quando a rota recebe `?novo=1`
 * (usado pelo Command Palette: "Criar processo", "Criar cliente", …).
 */
export function useNovoParam(open: () => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("novo")) {
      open();
      params.delete("novo");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
