import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentsHub } from '@/components/documents/DocumentsHub';
import { useTenant } from '@/contexts/TenantContext';
import { apiGetAllPages } from '@/integrations/api/client';
import type { DocumentFile } from '@/types/models';

type Paginated<T> = { count?: number; results?: T[] } | T[];

type ProcessItem = {
  id: string;
  cnj?: string | null;
  subject?: string | null;
  number?: string | null;
  client?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
};

type ClientItem = {
  id: string;
  name: string;
};

const asList = <T,>(data: Paginated<T> | undefined | null): T[] => (
  !data ? [] : Array.isArray(data) ? data : (data.results ?? [])
);

export default function DocumentsModule() {
  const { activeTenantId } = useTenant();

  const processesQuery = useQuery({
    queryKey: ['documents-processes', activeTenantId],
    queryFn: () => apiGetAllPages<ProcessItem>('/processes/'),
    enabled: !!activeTenantId,
  });

  const clientsQuery = useQuery({
    queryKey: ['documents-clients', activeTenantId],
    queryFn: () => apiGetAllPages<ClientItem>('/clients/'),
    enabled: !!activeTenantId,
  });

  const uploadedDocsQuery = useQuery({
    queryKey: ['documents-files', activeTenantId],
    queryFn: () => apiGetAllPages<DocumentFile>('/documents/'),
    enabled: !!activeTenantId,
  });

  const processes = useMemo(() => (
    asList(processesQuery.data)
      .map((process) => ({
        id: process.id,
        label: [process.cnj || process.number, process.subject].filter(Boolean).join(' - ') || process.id,
        clientId: process.client || null,
        clientName: process.client_name || process.cliente_nome || null,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'))
  ), [processesQuery.data]);

  const clients = useMemo(() => (
    asList(clientsQuery.data)
      .map((client) => ({ id: client.id, name: client.name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
  ), [clientsQuery.data]);

  return (
    <DocumentsHub
      documents={asList(uploadedDocsQuery.data)}
      processes={processes}
      clients={clients}
      isLoading={uploadedDocsQuery.isLoading || processesQuery.isLoading || clientsQuery.isLoading}
      isError={uploadedDocsQuery.isError || processesQuery.isError || clientsQuery.isError}
    />
  );
}
