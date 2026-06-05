import type { QueryClient } from '@tanstack/react-query';

export async function invalidateProcessRelatedQueries(
  queryClient: QueryClient,
  tenantId?: string | null,
) {
  if (!tenantId) return;

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['processes'] }),
    queryClient.invalidateQueries({ queryKey: ['processes-workspace', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['agenda-processes', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['documents-processes', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['hearings-processes', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['clients-crm-processes', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['practice-areas-processes', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['financial-workspace', tenantId] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'strategic', tenantId] }),
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey)
        && query.queryKey[0] === 'client-detail-processes'
        && query.queryKey[1] === tenantId,
    }),
    queryClient.invalidateQueries({
      predicate: (query) => Array.isArray(query.queryKey)
        && query.queryKey[0] === 'process'
        && query.queryKey[1] === tenantId,
    }),
  ]);
}
