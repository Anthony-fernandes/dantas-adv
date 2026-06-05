import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiGetAllPages, Paginated } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

// Type aliases for DB resources used by pages (compat)
export type DbClient = import('@/types/models').Client;
export type DbProcess = import('@/types/models').Process;

// Finance (keep any for now — models vary by backend)
export type DbReceivable = any;
export type DbPayable = any;
export type DbPayment = any;
export type DbInstallment = any;

// Audit
export type DbAuditEvent = {
  id: string;
  actor_email?: string | null;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  summary?: string;
  payload?: any;
  created_at: string;
};

// Map a "resource" name used across the UI to a DRF endpoint path.
// We normalize to kebab-case (underscores -> hyphens) by default.
const DEFAULT_PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE ?? 25);

const RESOURCE_ALIASES: Record<string, string> = {
  receivables: 'accounts-receivable',
  payables: 'accounts-payable',
  positions: 'employee-positions',
};

function endpointFor(resource: string) {
  const alias = RESOURCE_ALIASES[resource] ?? resource;
  const normalized = alias.replace(/_/g, '-');
  return `/${normalized}/`;
}

function toQuery(params: Record<string, any> | undefined) {
  if (!params) return '';
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === 'all') return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : '';
}

// Generic list hook (returns plain array for compatibility with existing UI)
function useList<T>(
  resource: string,
  options?: {
    filters?: Record<string, any>;
    search?: { column: string; value: string }[];
    orderBy?: { column: string; ascending?: boolean };
    enabled?: boolean;
  },
) {
  const { activeTenantId } = useTenant();

  return useQuery({
    queryKey: [resource, activeTenantId, options?.filters, options?.search, options?.orderBy],
    enabled: (options?.enabled ?? true) && !!activeTenantId,
    queryFn: async () => {
      const params: Record<string, any> = { ...(options?.filters ?? {}) };

      // DRF SearchFilter: `search=<value>`
      if (options?.search?.length) {
        const combined = options.search.map((s) => s.value).filter(Boolean).join(' ');
        if (combined) params.search = combined;
      }

      // DRF ordering param: `ordering=-field`
      if (options?.orderBy?.column) {
        const col =
          options.orderBy.ascending === false ? `-${options.orderBy.column}` : options.orderBy.column;
        params.ordering = col;
      }

      const path = endpointFor(resource) + toQuery(params);
      const data = await api.get<any>(path);

      // Support both paginated and non-paginated
      if (Array.isArray(data)) return data as T[];
      if (data && Array.isArray((data as Paginated<T>).results))
        return (data as Paginated<T>).results;

      return [] as T[];
    },
  });
}

// Generic paginated list hook (returns full DRF pagination object)
function usePaginatedList<T>(
  resource: string,
  options?: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    search?: { column: string; value: string }[];
    orderBy?: { column: string; ascending?: boolean };
    enabled?: boolean;
  },
) {
  const { activeTenantId } = useTenant();

  return useQuery({
    queryKey: [
      resource,
      activeTenantId,
      'paginated',
      options?.page,
      options?.pageSize,
      options?.filters,
      options?.search,
      options?.orderBy,
    ],
    enabled: (options?.enabled ?? true) && !!activeTenantId,
    queryFn: async () => {
      const params: Record<string, any> = { ...(options?.filters ?? {}) };

      if (options?.search?.length) {
        const combined = options.search.map((s) => s.value).filter(Boolean).join(' ');
        if (combined) params.search = combined;
      }

      if (options?.orderBy?.column) {
        const col =
          options.orderBy.ascending === false ? `-${options.orderBy.column}` : options.orderBy.column;
        params.ordering = col;
      }

      const page = options?.page ?? 1;
      params.page = page;

      // Note: DRF page size is usually server-side; we keep client-side only for totalPages calc.
      const path = endpointFor(resource) + toQuery(params);
      const data = await api.get<any>(path);

      // Force paginated shape; if backend returns array, wrap it.
      if (Array.isArray(data)) {
        return { count: data.length, next: null, previous: null, results: data as T[] } as Paginated<T>;
      }
      if (data && Array.isArray((data as Paginated<T>).results)) {
        return data as Paginated<T>;
      }
      return { count: 0, next: null, previous: null, results: [] as T[] } as Paginated<T>;
    },
  });
}

function totalPagesFromCount(count: number, pageSize?: number) {
  const size = pageSize ?? DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.ceil(count / size));
}

function useAllPagesList<T>(
  resource: string,
  filters?: Record<string, any>,
  search?: string,
) {
  const { activeTenantId } = useTenant();

  return useQuery({
    queryKey: [resource, activeTenantId, 'all', filters, search],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const params: Record<string, any> = { ...(filters ?? {}) };
      if (search) params.search = search;
      return await apiGetAllPages<T>(endpointFor(resource), params);
    },
  });
}

/* -------------------- Mutations -------------------- */

function useCreate<T>(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<T>) => {
      const created = await api.post<T>(endpointFor(resource), payload);
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success('Criado com sucesso');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao criar'),
  });
}

function useUpdate<T>(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      if (!id) throw new Error('ID obrigatório');
      const updated = await api.patch<T>(`${endpointFor(resource)}${id}/`, payload);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success('Atualizado com sucesso');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao atualizar'),
  });
}

function useDelete(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new Error('ID obrigatório');
      await api.delete(`${endpointFor(resource)}${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      toast.success('Removido com sucesso');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao remover'),
  });
}

/* -------------------- Domain hooks used by pages -------------------- */

// Clients
export const useClients = (filters?: Record<string, any>, search?: string) =>
  useAllPagesList<DbClient>('clients', filters, search);

export const useClientsPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbClient>('clients', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

export const useCreateClient = () => useCreate<any>('clients');
export const useUpdateClient = () => useUpdate<any>('clients');
export const useDeleteClient = () => useDelete('clients');

// Processes
export const useProcesses = (filters?: Record<string, any>, search?: string) =>
  useAllPagesList<DbProcess>('processes', filters, search);

export const useProcessesPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbProcess>('processes', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

export const useCreateProcess = () => useCreate<any>('processes');
export const useUpdateProcess = () => useUpdate<any>('processes');
export const useDeleteProcess = () => useDelete('processes');

// Movements
export const useMovements = (processId?: string) =>
  useList<any>('movements', { filters: processId ? { process: processId } : undefined });

// Deadlines
export const useDeadlines = (filters?: Record<string, any>) => useList<any>('deadlines', { filters });
export const useCreateDeadline = () => useCreate<any>('deadlines');

// Hearings
export const useHearings = (filters?: Record<string, any>) => useList<any>('hearings', { filters });
export const useCreateHearing = () => useCreate<any>('hearings');

// Finance (legacy generic names)
export const useReceivables = (filters?: Record<string, any>) => useList<any>('receivables', { filters });
export const usePayables = (filters?: Record<string, any>) => useList<any>('payables', { filters });
export const useInvoices = (filters?: Record<string, any>) => useList<any>('invoices', { filters });
export const usePayments = (filters?: Record<string, any>) => useList<any>('payments', { filters });

// Notifications
export const useNotifications = (filters?: Record<string, any>, enabled: boolean = true) =>
  useList<any>('notifications', { filters, enabled });
export const useCreateNotification = () => useCreate<any>('notifications');

// Audit Logs (paged)
export const useAuditEventsPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbAuditEvent>('audit-events', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

// Documents
export const useDocuments = (processId?: string) =>
  useList<any>('documents', { filters: processId ? { process: processId } : undefined });

// Contracts
export const useContracts = (clientId?: string) =>
  useList<any>('contracts', { filters: clientId ? { client: clientId } : undefined });
export const useCreateContract = () => useCreate<any>('contracts');

// Profiles (for user lists)
export const useProfiles = () => useList<any>('profiles', {});
export const useUserRoles = () => useList<any>('user_roles', {});

/* -------------------- Compatibility aliases (old imports) -------------------- */

// Algumas telas antigas importam estes nomes:
export const useAccountsReceivable = useReceivables;
export const useAccountsPayable = usePayables;

// total pages helper (single export!)
export function getTotalPages(count: number, pageSize?: number) {
  return totalPagesFromCount(count, pageSize);
}

/* -------------------- Finance v2 (PR18) -------------------- */

// Accounts Receivable
export const useReceivablesPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbReceivable>('accounts-receivable', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

export const useCreateReceivable = () => useCreate<any>('accounts-receivable');
export const useUpdateReceivable = () => useUpdate<any>('accounts-receivable');
export const useDeleteReceivable = () => useDelete('accounts-receivable');

// Receivable installments
export const useInstallmentsPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbInstallment>('receivable-installments', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

// Payables
export const usePayablesPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbPayable>('accounts-payable', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

export const useCreatePayable = () => useCreate<any>('accounts-payable');

// Payments
export const usePaymentsPaged = (
  filters?: Record<string, any>,
  search?: string,
  page: number = 1,
  orderBy?: { column: string; ascending?: boolean },
) =>
  usePaginatedList<DbPayment>('payments', {
    page,
    filters,
    search: search ? [{ column: 'search', value: search }] : undefined,
    orderBy,
  });

export const useCreatePayment = () => useCreate<any>('payments');
